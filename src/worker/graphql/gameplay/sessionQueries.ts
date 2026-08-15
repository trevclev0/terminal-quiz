import { gates, sessionCompletedGates, sessionProgress } from "@shared/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { GraphQLNonNull, GraphQLString } from "graphql";
import { trackEvent } from "./analytics";
import { type AppGraphQLContext, ProgressionPayloadType } from "./types";

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

    let isNewSession = false;

    if (!progress) {
      isNewSession = true;
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

    if (isNewSession) {
      trackEvent(context, {
        name: "program_started",
        programId: args.programId,
        gateId: progress.currentGateId,
        outcome: "fresh",
      });
    }

    // Security: only gates from sessionCompletedGates are fetched with correctAnswer.
    const completedEntries = await db.query.sessionCompletedGates.findMany({
      where: eq(sessionCompletedGates.sessionProgressId, progress.id),
    });

    const completedGates =
      completedEntries.length === 0
        ? []
        : await db.query.gates.findMany({
            where: and(
              eq(gates.programId, args.programId),
              inArray(
                gates.id,
                completedEntries.map((e) => e.gateId),
              ),
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

export const getInProgressProgram = {
  type: GraphQLString,
  resolve: async (_: unknown, __: unknown, context: AppGraphQLContext) => {
    const db = context.get("db");
    const sessionId = context.get("sessionId");

    if (!sessionId) throw new Error("Unauthorized: Missing Session ID");

    const progress = await db.query.sessionProgress.findFirst({
      where: and(
        eq(sessionProgress.sessionId, sessionId),
        eq(sessionProgress.status, "in_progress"),
      ),
      orderBy: [desc(sessionProgress.updatedAt)],
    });

    return progress?.programId ?? null;
  },
};
