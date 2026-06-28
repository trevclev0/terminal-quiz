import { gateClues, gates, sessionProgress } from "@shared/schema";
import { and, asc, desc, eq, gt } from "drizzle-orm";
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
      const newAttemptCount = progress.attemptCount + 1;

      await db
        .update(sessionProgress)
        .set({ attemptCount: newAttemptCount })
        .where(eq(sessionProgress.id, progress.id));

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
        attemptCount: newAttemptCount,
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

    if (!activeGate.guidanceEnabled) {
      return {
        clueText: null,
        isClueLimitReached: false,
        cluesRemaining,
      };
    }

    if (existingClues.length >= MAX_CLUES_PER_GATE) {
      return {
        clueText: null,
        isClueLimitReached: true,
        cluesRemaining: 0,
      };
    }

    if (
      mostRecentClueAttemptCount !== null &&
      progress.attemptCount <= mostRecentClueAttemptCount
    ) {
      return {
        clueText: null,
        isClueLimitReached: false,
        cluesRemaining,
      };
    }

    if (progress.attemptCount < activeGate.guidanceThreshold) {
      return {
        clueText: null,
        isClueLimitReached: false,
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
      args.currentGuess,
      previousClueTexts,
    );

    if (!clueText) {
      return {
        clueText: null,
        isClueLimitReached: false,
        cluesRemaining,
      };
    }

    await db.insert(gateClues).values({
      sessionProgressId: progress.id,
      gateId: args.gateId,
      clueText,
      attemptCountAtRequest: progress.attemptCount,
    });

    const newCluesRemaining = computeCluesRemaining(existingClues.length + 1);

    return {
      clueText,
      isClueLimitReached: newCluesRemaining === 0,
      cluesRemaining: newCluesRemaining,
    };
  },
};
