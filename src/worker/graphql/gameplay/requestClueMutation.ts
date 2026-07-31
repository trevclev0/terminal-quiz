import { gateClues, gates, sessionProgress } from "@shared/schema";
import { generateClue } from "@worker-services/aiService";
import { and, eq } from "drizzle-orm";
import { GraphQLNonNull, GraphQLString } from "graphql";
import {
  computeCanRequestClue,
  computeCluesRemaining,
  getExistingCluesForGate,
  MAX_CLUES_PER_GATE,
} from "./clueEligibility";
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

    const progress = await db.query.sessionProgress.findFirst({
      where: and(
        eq(sessionProgress.sessionId, sessionId),
        eq(sessionProgress.programId, args.programId),
      ),
    });

    if (!progress || progress.status === "completed") {
      throw new Error(
        "Invalid state: Program already completed or not started.",
      );
    }

    if (progress.currentGateId !== args.gateId) {
      throw new Error("Desync: Clue requested for the wrong active gate.");
    }

    const activeGate = await db.query.gates.findFirst({
      where: eq(gates.id, args.gateId),
    });

    if (!activeGate) {
      throw new Error(`Gate with ID ${args.gateId} not found.`);
    }

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
      };
    }

    const newCluesRemaining = computeCluesRemaining(existingClues.length + 1);

    return {
      clueText,
      isClueLimitReached: newCluesRemaining === 0,
      cluesRemaining: newCluesRemaining,
    };
  },
};
