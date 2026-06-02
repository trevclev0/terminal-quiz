import type * as schema from "@shared/schema";
import { gates, sessionProgress } from "@shared/schema";
import { and, asc, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { GraphQLNonNull, GraphQLString } from "graphql";
import { ProgressionPayloadType } from "./types";

export interface AppGraphQLContext {
  db: DrizzleD1Database<typeof schema>;
  sessionId?: string;
}

export const getProgramProgression = {
  type: ProgressionPayloadType,
  args: {
    programId: { type: new GraphQLNonNull(GraphQLString) },
  },
  // Update the signature with unknown and our strict context
  resolve: async (
    _: unknown,
    args: { programId: string },
    context: AppGraphQLContext,
  ) => {
    const { db, sessionId } = context;
    if (!sessionId) throw new Error("Unauthorized: Missing Session ID");

    // Fetch the raw blueprint (all gates for this program)
    const programGates = await db.query.gates.findMany({
      where: eq(gates.programId, args.programId),
      orderBy: [asc(gates.sequenceOrder)],
    });

    if (programGates.length === 0)
      throw new Error("Program not found or has no gates.");

    // Look up user's ledger
    let progress = await db.query.sessionProgress.findFirst({
      where: and(
        eq(sessionProgress.sessionId, sessionId),
        eq(sessionProgress.programId, args.programId),
      ),
    });

    // Lazy Initialization: If they don't have progress yet, start them at Gate 1
    if (!progress) {
      const firstGate = programGates[0];
      try {
        const newProgress = await db
          .insert(sessionProgress)
          .values({
            sessionId,
            programId: args.programId,
            currentGateId: firstGate.id,
            completedGateIds: "[]",
          })
          .returning();
        progress = newProgress[0];
      } catch {
        progress = await db.query.sessionProgress.findFirst({
          where: and(
            eq(sessionProgress.sessionId, sessionId),
            eq(sessionProgress.programId, args.programId),
          ),
        });
      }
      if (!progress) {
        throw new Error("Failed to initialize session progression.");
      }
    }

    // Assemble the safe payload
    const completedIds: string[] = JSON.parse(
      progress.completedGateIds || "[]",
    );
    const completedGates = programGates.filter((g) =>
      completedIds.includes(g.id),
    );
    const currentGate =
      programGates.find((g) => g.id === progress.currentGateId) || null;

    return {
      currentGate,
      completedGates,
      status: progress.status,
    };
  },
};
