import { gateClues } from "@shared/schema";
import { generateClue } from "@worker-services/aiService";
import { GraphQLNonNull, GraphQLString } from "graphql";
import { env } from "hono/adapter";
import { loadActiveSession } from "./activeSession";
import {
  getDailyAiBudget,
  getUsageDateKey,
  releaseAiUsage,
  reserveAiUsage,
} from "./aiBudget";
import { trackEvent } from "./analytics";
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
      trackEvent(context, {
        name: "clue_requested",
        programId: args.programId,
        gateId: args.gateId,
        outcome: "not_eligible",
        attemptCount: progress.attemptCount,
      });
      return {
        clueText: null,
        isClueLimitReached: existingClues.length >= MAX_CLUES_PER_GATE,
        cluesRemaining,
        isRateLimited: false,
        retryAfterMs: null,
        isAiBudgetExhausted: false,
      };
    }

    // Global daily budget guard: atomically reserve one unit BEFORE the
    // rate-limit claim so an exhausted budget never burns a per-attempt slot,
    // inserts a clue row, or spends an AI call. The single upsert+return is
    // race-free (D1 is single-writer): concurrent requests get strictly
    // increasing counts, so once the cap is reached every subsequent request
    // sees `count > budget` and releases back before touching anything else.
    // Reservations are released only when we positively know the AI was never
    // called (over-budget race loser, rate-limit rejection). A generation
    // that returns null or fails to persist may still have billed, so its
    // reservation is intentionally kept — the counter reflects launched
    // (potentially billable) generations, not just stored clues.
    const usageDateKey = getUsageDateKey();
    const budget = getDailyAiBudget(
      env<{ AI_DAILY_CLUE_BUDGET?: string }>(context).AI_DAILY_CLUE_BUDGET,
    );
    const reservedCount = await reserveAiUsage(db, usageDateKey);
    if (reservedCount > budget) {
      await releaseAiUsage(db, usageDateKey);
      trackEvent(context, {
        name: "clue_requested",
        programId: args.programId,
        gateId: args.gateId,
        outcome: "budget_exhausted",
        attemptCount: progress.attemptCount,
      });
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
      await releaseAiUsage(db, usageDateKey);
      trackEvent(context, {
        name: "clue_requested",
        programId: args.programId,
        gateId: args.gateId,
        outcome: "rate_limited",
        attemptCount: progress.attemptCount,
      });
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
    const clueResult = await generateClue(
      context,
      activeGate.question,
      activeGate.correctAnswer,
      currentGuess,
      previousClueTexts,
    );

    if (!clueResult.clueText) {
      trackEvent(context, {
        name: "clue_requested",
        programId: args.programId,
        gateId: args.gateId,
        outcome: `ai_failed:${clueResult.reason}`,
        attemptCount: progress.attemptCount,
        aiLatencyMs: clueResult.latencyMs,
      });
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
        clueText: clueResult.clueText,
        attemptCountAtRequest: progress.attemptCount,
      });
    } catch (error) {
      // Only a unique-constraint violation means another request already
      // inserted a clue for this attempt. Anything else is a real
      // persistence failure and must surface, not masquerade as a duplicate.
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      console.warn("Failed to insert clue (likely duplicate):", error);
      trackEvent(context, {
        name: "clue_requested",
        programId: args.programId,
        gateId: args.gateId,
        outcome: "duplicate",
        attemptCount: progress.attemptCount,
        aiLatencyMs: clueResult.latencyMs,
      });
      return {
        clueText: null,
        isClueLimitReached: false,
        cluesRemaining,
        isRateLimited: false,
        retryAfterMs: null,
        isAiBudgetExhausted: false,
      };
    }

    const newCluesRemaining = computeCluesRemaining(existingClues.length + 1);

    trackEvent(context, {
      name: "clue_requested",
      programId: args.programId,
      gateId: args.gateId,
      outcome: "success",
      attemptCount: progress.attemptCount,
      aiLatencyMs: clueResult.latencyMs,
    });

    return {
      clueText: clueResult.clueText,
      isClueLimitReached: newCluesRemaining === 0,
      cluesRemaining: newCluesRemaining,
      isRateLimited: false,
      retryAfterMs: null,
      isAiBudgetExhausted: false,
    };
  },
};

function isUniqueConstraintError(error: unknown): boolean {
  let current: unknown = error;
  while (current instanceof Error) {
    if (/UNIQUE constraint/i.test(current.message)) return true;
    current = current.cause;
  }
  return false;
}
