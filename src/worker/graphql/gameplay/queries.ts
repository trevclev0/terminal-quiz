import {
  gates,
  programs,
  sessionCompletedGates,
  sessionProgress,
} from "@shared/schema";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";
import { authorizeProgramMutation } from "./authorizeProgram";
import {
  type AppGraphQLContext,
  GateManagementType,
  MeType,
  ProgramListItemType,
  ProgressionPayloadType,
} from "./types";

export const me = {
  type: MeType,
  resolve: (_: unknown, __: unknown, context: AppGraphQLContext) => {
    const user = context.get("user");
    if (!user) return null;
    return user;
  },
};

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

export const getPrograms = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(ProgramListItemType)),
  ),
  resolve: async (_: unknown, __: unknown, context: AppGraphQLContext) => {
    const db = context.get("db");
    const user = context.get("user");

    const conditions = [eq(programs.visibility, "public")];
    if (user?.id) {
      conditions.push(eq(programs.authorId, user.id));
    }

    return db
      .select()
      .from(programs)
      .where(or(...conditions))
      .orderBy(asc(programs.createdAt));
  },
};

export const myPrograms = {
  type: new GraphQLList(ProgramListItemType),
  resolve: async (_: unknown, __: unknown, context: AppGraphQLContext) => {
    const db = context.get("db");
    const user = context.get("user");

    if (!user?.id) return null;

    const results = await db
      .select()
      .from(programs)
      .where(eq(programs.authorId, user.id))
      .orderBy(asc(programs.createdAt));

    return results.length > 0 ? results : [];
  },
};

export const program = {
  type: ProgramListItemType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _: unknown,
    args: { id: string },
    context: AppGraphQLContext,
  ) => {
    const db = context.get("db");
    const result = await db
      .select()
      .from(programs)
      .where(eq(programs.id, args.id))
      .limit(1);
    return result[0] ?? null;
  },
};

export const programGates = {
  type: new GraphQLNonNull(
    new GraphQLList(new GraphQLNonNull(GateManagementType)),
  ),
  args: {
    programId: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _: unknown,
    args: { programId: string },
    context: AppGraphQLContext,
  ) => {
    const db = context.get("db");
    const user = context.get("user");

    if (!user?.id) {
      throw new Error("Unauthorized: Authentication required.");
    }

    await authorizeProgramMutation(db, args.programId, user.id);

    return db
      .select()
      .from(gates)
      .where(eq(gates.programId, args.programId))
      .orderBy(asc(gates.sequenceOrder));
  },
};
