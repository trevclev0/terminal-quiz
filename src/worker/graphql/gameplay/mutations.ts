import { gates, sessionProgress } from "@shared/schema";
import { and, asc, eq, gt } from "drizzle-orm";
import { GraphQLNonNull, GraphQLString } from "graphql";
import isGuessCloseEnough from "../../utils/isGuessCloseEnough";
import type { AppGraphQLContext } from "./queries";
import { SubmitGuessPayloadType } from "./types";

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
      return {
        success: false,
        message: "ACCESS DENIED. INCORRECT SYNTAX OR VALUE.",
        nextGate: null,
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
        ...(newStatus === "completed" ? { completedAt: new Date() } : {}),
      })
      .where(eq(sessionProgress.id, progress.id));

    return {
      success: true,
      message: activeGate.successMessage,
      nextGate,
    };
  },
};
