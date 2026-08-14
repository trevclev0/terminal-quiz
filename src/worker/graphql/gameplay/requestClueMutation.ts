import { gateClues } from "@shared/schema";
import { generateClue } from "@worker-services/aiService";
import { GraphQLNonNull, GraphQLString } from "graphql";
import { env } from "hono/adapter";
import { loadActiveSession } from "./activeSession";
import {
  getDailyAiBudget,
  getUsageDateKey,
  isAiBudgetExceeded,
  recordAiUsage,
} from "./aiBudget";
import {
  computeCanRequestClue,
  computeCluesRemaining,
  getExistingCluesForGate,
  MAX_CLUES_PER_GATE,
} from "./clueEligibility";
import { claimClueRateLimit } from "./clueRateLimit";
import { MAX_GUESS_LENGTH } from "./guessValidation";
import { type AppGraphQLContext, RequestClueResultType } from "./types";

export const requestClue = {
  type: RequestClueResultType,
  args: {
    programId: { type: new GraphQLNonNull(GraphQLString) },
    gateId: { type: new GraphQLNonNull(GraphQLString) },
    currentGuess: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _: unknown,
    args: { programId: string; gateId: string; currentGuess: string },
    context: AppGraphQLContext,
  ) => {
    const db = context.get("db");
    const sessionId = context.get("sessionId");

    const currentGuess = args.currentGuess.trim();
    if (currentGuess.length === 0 || currentGuess.length > MAX_GUESS_LENGTH) {
      throw new Error("Invalid current guess length.");
    }

    if (!sessionId) throw new Error("Unauthorized: Missing Session ID");

    const { progress, activeGate } = await loadActiveSession(
      db,
      sessionId,
      args.programId,
      args.gateId,
      "Desync: Clue requested for the wrong active gate.",
    );

    const existingClues = await getExistingCluesForGate(
      db,
      progress.id,
      args.gateId,
    );
    const cluesRemaining = computeCluesRemaining(existingClues.length);
    const mostRecentClueAttemptCount =
      existingClues[0]?.attemptCountAtRequest ?? null;

    // Use shared helper to check eligibility
    const canRequestClue = computeCanRequestClue({
      isCorrectGuess: false,
      guidanceEnabled: activeGate.guidanceEnabled,
      attemptCount: progress.attemptCount,
      guidanceThreshold: activeGate.guidanceThreshold,
      existingClueCount: existingClues.length,
      mostRecentClueAttemptCount,
    });

    if (!canRequestClue) {
      return {
        clueText: null,
        isClueLimitReached: existingClues.length >= MAX_CLUES_PER_GATE,
        cluesRemaining,
        isRateLimited: false,
        retryAfterMs: null,
        isAiBudgetExhausted: false,
      };
    }

    // Global daily budget guard: check BEFORE the rate-limit claim so an
    // exhausted budget never burns a per-attempt slot, inserts a clue row,
    // or spends an AI call. The counter only increments on a *successful*
    // generation (below), so AI failures and rejected requests don't consume
    // budget.
    const usageDateKey = getUsageDateKey();
    const budget = getDailyAiBudget(
      env<{ AI_DAILY_CLUE_BUDGET?: string }>(context).AI_DAILY_CLUE_BUDGET,
    );
    const aiBudgetExceeded = await isAiBudgetExceeded(db, usageDateKey, budget);
    if (aiBudgetExceeded) {
      return {
        clueText: null,
        isClueLimitReached: false,
        cluesRemaining,
        isRateLimited: false,
        retryAfterMs: null,
        isAiBudgetExhausted: true,
      };
    }

    // Claim a rolling rate-limit slot BEFORE any AI spend. Rejected requests
    // never reach generateClue; the window is consumed even if AI fails. The
    // claim is per-attempt, keyed (session, gate, attempt): within a window
    // only one request per gate+attempt wins a slot, so concurrent
    // same-attempt requests cannot all call AI.
    const rateLimit = await claimClueRateLimit(
      db,
      progress.id,
      args.gateId,
      progress.attemptCount,
    );
    if (!rateLimit.claimed) {
      return {
        clueText: null,
        isClueLimitReached: false,
        cluesRemaining,
        isRateLimited: true,
        retryAfterMs: rateLimit.retryAfterMs,
        isAiBudgetExhausted: false,
      };
    }

    const previousClueTexts = existingClues
      .toReversed()
      .map((clue) => clue.clueText);
    const clueText = await generateClue(
      context,
      activeGate.question,
      activeGate.correctAnswer,
      currentGuess,
      previousClueTexts,
    );

    if (!clueText) {
      return {
        clueText: null,
        isClueLimitReached: false,
        cluesRemaining,
        isRateLimited: false,
        retryAfterMs: null,
        isAiBudgetExhausted: false,
      };
    }

    try {
      await db.insert(gateClues).values({
        sessionProgressId: progress.id,
        gateId: args.gateId,
        clueText,
        attemptCountAtRequest: progress.attemptCount,
      });
    } catch (error) {
      // Handle unique constraint violation - another request
      // may have already inserted a clue for this attempt
      console.warn("Failed to insert clue (likely duplicate):", error);
      return {
        clueText: null,
        isClueLimitReached: false,
        cluesRemaining,
        isRateLimited: false,
        retryAfterMs: null,
        isAiBudgetExhausted: false,
      };
    }

    // The clue was generated AND stored — count it against the daily budget.
    await recordAiUsage(db, usageDateKey);

    const newCluesRemaining = computeCluesRemaining(existingClues.length + 1);

    return {
      clueText,
      isClueLimitReached: newCluesRemaining === 0,
      cluesRemaining: newCluesRemaining,
      isRateLimited: false,
      retryAfterMs: null,
      isAiBudgetExhausted: false,
    };
  },
};
