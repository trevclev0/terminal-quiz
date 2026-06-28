import { gateClues, gates, sessionProgress } from "@shared/schema";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { GraphQLNonNull, GraphQLString } from "graphql";
import { generateClue } from "../../services/aiService";
import isGuessCloseEnough from "../../utils/isGuessCloseEnough";
import {
  computeCanRequestClue,
  computeCluesRemaining,
  MAX_CLUES_PER_GATE,
} from "./clueEligibility";
import type { AppGraphQLContext } from "./queries";
import { RequestClueResultType, SubmitGuessPayloadType } from "./types";

async function getExistingCluesForGate(
  db: AppGraphQLContext["var"]["db"],
  sessionProgressId: string,
  gateId: string,
) {
  return db.query.gateClues.findMany({
    where: and(
      eq(gateClues.sessionProgressId, sessionProgressId),
      eq(gateClues.gateId, gateId),
    ),
    orderBy: [desc(gateClues.createdAt)],
  });
}

export const submitGuess = {
  type: SubmitGuessPayloadType,
  args: {
    programId: { type: new GraphQLNonNull(GraphQLString) },
    gateId: { type: new GraphQLNonNull(GraphQLString) },
    guess: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _: unknown,
    args: { programId: string; gateId: string; guess: string },
    context: AppGraphQLContext,
  ) => {
    const db = context.get("db");
    const sessionId = context.get("sessionId");

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
      throw new Error("Desync: Guess submitted for the wrong active gate.");
    }

    const activeGate = await db.query.gates.findFirst({
      where: eq(gates.id, args.gateId),
    });

    if (!activeGate) {
      throw new Error(`Gate with ID ${args.gateId} not found.`);
    }

    if (!isGuessCloseEnough(args.guess, activeGate.correctAnswer)) {
      // Atomic increment of attemptCount to prevent race conditions
      await db
        .update(sessionProgress)
        .set({
          attemptCount: sql`${sessionProgress.attemptCount} + 1`,
        })
        .where(eq(sessionProgress.id, progress.id));

      // Re-fetch to get the incremented value
      const updatedProgress = await db.query.sessionProgress.findFirst({
        where: eq(sessionProgress.id, progress.id),
      });

      if (!updatedProgress) {
        throw new Error("Failed to update attempt count.");
      }

      const existingClues = await getExistingCluesForGate(
        db,
        progress.id,
        args.gateId,
      );
      const mostRecentClueAttemptCount =
        existingClues[0]?.attemptCountAtRequest ?? null;

      const canRequestClue = computeCanRequestClue({
        isCorrectGuess: false,
        guidanceEnabled: activeGate.guidanceEnabled,
        attemptCount: updatedProgress.attemptCount,
        guidanceThreshold: activeGate.guidanceThreshold,
        existingClueCount: existingClues.length,
        mostRecentClueAttemptCount,
      });

      return {
        success: false,
        message: "ACCESS DENIED. INCORRECT SYNTAX OR VALUE.",
        nextGate: null,
        canRequestClue,
      };
    }

    // Guess is correct! Advance the state.
    const nextGate =
      (await db.query.gates.findFirst({
        columns: {
          correctAnswer: false,
        },
        where: and(
          eq(gates.programId, args.programId),
          gt(gates.sequenceOrder, activeGate.sequenceOrder), // > current gate
        ),
        orderBy: [asc(gates.sequenceOrder)],
      })) || null;

    let completedIds: string[] = [];
    try {
      const parsed = JSON.parse(progress.completedGateIds || "[]");
      if (Array.isArray(parsed)) {
        completedIds = parsed;
      }
    } catch (error) {
      console.error("Error parsing completedGateIds:", error);
      throw new Error("Internal server error.");
    }
    completedIds.push(activeGate.id);

    const newStatus = nextGate ? "in_progress" : "completed";
    await db
      .update(sessionProgress)
      .set({
        currentGateId: nextGate ? nextGate.id : null,
        completedGateIds: JSON.stringify(completedIds),
        status: newStatus,
        attemptCount: 0,
        ...(newStatus === "completed" ? { completedAt: new Date() } : {}),
      })
      .where(eq(sessionProgress.id, progress.id));

    return {
      success: true,
      message: activeGate.successMessage,
      nextGate,
      canRequestClue: false,
    };
  },
};

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

    const MAX_CURRENT_GUESS_LENGTH = 500;
    const currentGuess = args.currentGuess.trim();
    if (
      currentGuess.length === 0 ||
      currentGuess.length > MAX_CURRENT_GUESS_LENGTH
    ) {
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
