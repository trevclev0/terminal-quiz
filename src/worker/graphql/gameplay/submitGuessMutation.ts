import { gates, sessionCompletedGates, sessionProgress } from "@shared/schema";
import isGuessCloseEnough from "@worker-utils/isGuessCloseEnough";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { GraphQLNonNull, GraphQLString } from "graphql";
import { loadActiveSession } from "./activeSession";
import {
  computeCanRequestClue,
  getExistingCluesForGate,
} from "./clueEligibility";
import { MAX_GUESS_LENGTH } from "./guessValidation";
import { type AppGraphQLContext, SubmitGuessPayloadType } from "./types";

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
    if (
      args.guess.trim().length === 0 ||
      args.guess.length > MAX_GUESS_LENGTH
    ) {
      throw new Error("Invalid guess length.");
    }

    const db = context.get("db");
    const sessionId = context.get("sessionId");

    if (!sessionId) throw new Error("Unauthorized: Missing Session ID");

    // NOTE: D1 does not support SQL BEGIN/SAVEPOINT, so db.transaction()
    // always fails here. Reads run directly on `db`; writes that must
    // land together are grouped with db.batch() instead.
    const { progress, activeGate } = await loadActiveSession(
      db,
      sessionId,
      args.programId,
      args.gateId,
      "Desync: Guess submitted for the wrong active gate.",
    );

    if (
      !isGuessCloseEnough(
        args.guess,
        activeGate.correctAnswer,
        activeGate.acceptanceThreshold,
      )
    ) {
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

    const newStatus = nextGate ? "in_progress" : "completed";

    // Both writes must land together — group via D1 batch (sequential,
    // all-or-nothing), since db.transaction() isn't supported.
    await db.batch([
      db
        .insert(sessionCompletedGates)
        .values({
          sessionProgressId: progress.id,
          gateId: activeGate.id,
        })
        .onConflictDoNothing(),
      db
        .update(sessionProgress)
        .set({
          currentGateId: nextGate ? nextGate.id : null,
          status: newStatus,
          attemptCount: 0,
          ...(newStatus === "completed" ? { completedAt: new Date() } : {}),
        })
        .where(eq(sessionProgress.id, progress.id)),
    ]);

    return {
      success: true,
      message: activeGate.successMessage,
      nextGate,
      canRequestClue: false,
    };
  },
};
