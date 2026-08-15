import {
  gateClues,
  gates,
  sessionCompletedGates,
  sessionProgress,
} from "@shared/schema";
import { and, asc, eq } from "drizzle-orm";
import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";
import { trackEvent } from "./analytics";
import type { AppGraphQLContext } from "./types";

export const resetSession = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    programId: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _: unknown,
    args: { programId: string },
    context: AppGraphQLContext,
  ) => {
    const db = context.get("db");
    const sessionId = context.get("sessionId");

    if (!sessionId) throw new Error("Unauthorized: Missing Session ID");

    try {
      const progress = await db.query.sessionProgress.findFirst({
        where: and(
          eq(sessionProgress.sessionId, sessionId),
          eq(sessionProgress.programId, args.programId),
        ),
        columns: { id: true },
      });

      if (!progress) {
        // No session to reset — no-op
        return true;
      }

      trackEvent(context, {
        name: "session_reset",
        programId: args.programId,
        outcome: "reset",
      });

      // Find the first gate to set as current
      const firstGate = await db.query.gates.findFirst({
        where: eq(gates.programId, args.programId),
        orderBy: [asc(gates.sequenceOrder)],
        columns: { id: true },
      });

      // Atomically clean up child rows and reset session state
      await db.batch([
        db
          .delete(sessionCompletedGates)
          .where(eq(sessionCompletedGates.sessionProgressId, progress.id)),
        db
          .delete(gateClues)
          .where(eq(gateClues.sessionProgressId, progress.id)),
        db
          .update(sessionProgress)
          .set({
            currentGateId: firstGate?.id ?? null,
            attemptCount: 0,
            status: "in_progress",
            completedAt: null,
          })
          .where(eq(sessionProgress.id, progress.id)),
      ]);

      return true;
    } catch (error) {
      console.error("Error resetting session:", error);
      return false;
    }
  },
};
