import {
  gateClues,
  gates,
  sessionCompletedGates,
  sessionProgress,
} from "@shared/schema";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { GraphQLNonNull, GraphQLString } from "graphql";
import { trackEvent } from "./analytics";
import { type AppGraphQLContext, ProgressionPayloadType } from "./types";

type SessionProgressRow = typeof sessionProgress.$inferSelect;

// Guesses and time are null (unknown) rather than zero when the run can't
// vouch for them: a NULL totalGuesses predates tracking, and a NULL
// runStartedAt means the clock never started (the run was reset and finished
// without a progression fetch in between).
async function computeRunStats(
  db: AppGraphQLContext["var"]["db"],
  progress: SessionProgressRow,
) {
  const { totalGuesses, runStartedAt, completedAt } = progress;
  const cluesUsed = await db.$count(
    gateClues,
    eq(gateClues.sessionProgressId, progress.id),
  );
  const elapsedSeconds =
    totalGuesses === null || runStartedAt === null || completedAt === null
      ? null
      : Math.max(
          0,
          Math.round((completedAt.getTime() - runStartedAt.getTime()) / 1000),
        );
  return { totalGuesses, cluesUsed, elapsedSeconds };
}

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

    let didCreateProgress = false;

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
          })
          .returning();
        progress = newProgress[0];
        didCreateProgress = progress !== undefined;
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

    if (didCreateProgress) {
      trackEvent(context, {
        name: "program_started",
        programId: args.programId,
        gateId: progress.currentGateId,
        outcome: "fresh",
      });
    }

    // Stamp the run start for rows that have none (replays after a reset and
    // rows that predate tracking). Only in_progress: stamping a completed run
    // would put runStartedAt after completedAt and make elapsed time negative.
    // The `run_started_at IS NULL` guard keeps concurrent fetches from moving
    // a start another request already stamped.
    if (progress.status === "in_progress" && progress.runStartedAt === null) {
      const stampedAt = new Date();
      await db
        .update(sessionProgress)
        .set({ runStartedAt: stampedAt })
        .where(
          and(
            eq(sessionProgress.id, progress.id),
            isNull(sessionProgress.runStartedAt),
          ),
        );
      progress.runStartedAt = stampedAt;
    }

    // Security: only gates from sessionCompletedGates are fetched with correctAnswer.
    const [completedEntries, totalGates] = await Promise.all([
      db.query.sessionCompletedGates.findMany({
        where: eq(sessionCompletedGates.sessionProgressId, progress.id),
      }),
      db.$count(gates, eq(gates.programId, args.programId)),
    ]);

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
      totalGates,
      status: progress.status,
      stats:
        progress.status === "completed"
          ? await computeRunStats(db, progress)
          : null,
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
