import { gates, sessionProgress } from "@shared/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { GraphQLNonNull, GraphQLString } from "graphql";
import type { Context } from "hono";
import type { AppVariables } from "../../middleware/db";
import { ProgressionPayloadType } from "./types";

export type AppGraphQLContext = Context<AppVariables>;

export const getProgramProgression = {
  type: ProgressionPayloadType,
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

    let progress = await db.query.sessionProgress.findFirst({
      where: and(
        eq(sessionProgress.sessionId, sessionId),
        eq(sessionProgress.programId, args.programId),
      ),
    });

    if (!progress) {
      const firstGate = await db.query.gates.findFirst({
        columns: {
          correctAnswer: false,
        },
        where: eq(gates.programId, args.programId),
        orderBy: [asc(gates.sequenceOrder)],
      });

      if (!firstGate) {
        throw new Error("Program not found or has no gates.");
      }

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
    // Security: only gates in completedGateIds are fetched with correctAnswer.
    const completedGates =
      completedIds.length === 0
        ? []
        : await db.query.gates.findMany({
            where: and(
              eq(gates.programId, args.programId),
              inArray(gates.id, completedIds),
            ),
            orderBy: [asc(gates.sequenceOrder)],
          });

    const currentGate = progress.currentGateId
      ? await db.query.gates.findFirst({
          columns: {
            correctAnswer: false,
          },
          where: and(
            eq(gates.id, progress.currentGateId),
            eq(gates.programId, args.programId),
          ),
        })
      : null;

    return {
      currentGate,
      completedGates,
      status: progress.status,
    };
  },
};
