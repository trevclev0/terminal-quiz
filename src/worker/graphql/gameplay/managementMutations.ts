import { gates, programs } from "@shared/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";
import { authorizeProgramMutation } from "./authorizeProgram";
import {
  type AppGraphQLContext,
  GateManagementType,
  ProgramManagementType,
} from "./types";

const VALID_VISIBILITY = new Set(["public", "unlisted"]);

function requireUser(user: AppGraphQLContext["var"]["user"]): string {
  if (!user?.id) {
    throw new Error("Unauthorized: Authentication required.");
  }
  return user.id;
}

function assertVisibility(value: string): void {
  if (!VALID_VISIBILITY.has(value)) {
    throw new Error(
      `Invalid visibility "${value}". Must be "public" or "unlisted".`,
    );
  }
}

export const createProgram = {
  type: ProgramManagementType,
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    visibility: { type: GraphQLString },
  },
  resolve: async (
    _: unknown,
    args: { name: string; visibility?: string },
    context: AppGraphQLContext,
  ) => {
    const userId = requireUser(context.get("user"));
    const visibility = args.visibility ?? "public";
    assertVisibility(visibility);

    const db = context.get("db");
    const [result] = await db
      .insert(programs)
      .values({ name: args.name, visibility, authorId: userId })
      .returning();

    return result;
  },
};

export const updateProgram = {
  type: ProgramManagementType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    visibility: { type: GraphQLString },
  },
  resolve: async (
    _: unknown,
    args: { id: string; name?: string; visibility?: string },
    context: AppGraphQLContext,
  ) => {
    const userId = requireUser(context.get("user"));
    const db = context.get("db");

    await authorizeProgramMutation(db, args.id, userId);

    if (args.visibility !== undefined) {
      assertVisibility(args.visibility);
    }

    const updateData: Record<string, string> = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.visibility !== undefined) updateData.visibility = args.visibility;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update.");
    }

    const [result] = await db
      .update(programs)
      .set(updateData)
      .where(eq(programs.id, args.id))
      .returning();

    return result;
  },
};

export const deleteProgram = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _: unknown,
    args: { id: string },
    context: AppGraphQLContext,
  ) => {
    const userId = requireUser(context.get("user"));
    const db = context.get("db");

    await authorizeProgramMutation(db, args.id, userId);

    await db.delete(programs).where(eq(programs.id, args.id));
    return true;
  },
};

export const createGate = {
  type: GateManagementType,
  args: {
    programId: { type: new GraphQLNonNull(GraphQLString) },
    label: { type: new GraphQLNonNull(GraphQLString) },
    question: { type: new GraphQLNonNull(GraphQLString) },
    correctAnswer: { type: new GraphQLNonNull(GraphQLString) },
    successMessage: { type: new GraphQLNonNull(GraphQLString) },
    sequenceOrder: { type: new GraphQLNonNull(GraphQLInt) },
    acceptanceThreshold: { type: GraphQLFloat },
    guidanceEnabled: { type: GraphQLBoolean },
    guidanceThreshold: { type: GraphQLInt },
  },
  resolve: async (
    _: unknown,
    args: {
      programId: string;
      label: string;
      question: string;
      correctAnswer: string;
      successMessage: string;
      sequenceOrder: number;
      acceptanceThreshold?: number;
      guidanceEnabled?: boolean;
      guidanceThreshold?: number;
    },
    context: AppGraphQLContext,
  ) => {
    const userId = requireUser(context.get("user"));
    const db = context.get("db");

    await authorizeProgramMutation(db, args.programId, userId);

    const existing = await db.query.gates.findFirst({
      where: and(
        eq(gates.programId, args.programId),
        eq(gates.sequenceOrder, args.sequenceOrder),
      ),
    });
    if (existing) {
      throw new Error(
        `Sequence order ${args.sequenceOrder} is already taken for this program.`,
      );
    }

    const [result] = await db
      .insert(gates)
      .values({
        programId: args.programId,
        label: args.label,
        question: args.question,
        correctAnswer: args.correctAnswer,
        successMessage: args.successMessage,
        sequenceOrder: args.sequenceOrder,
        acceptanceThreshold: args.acceptanceThreshold ?? undefined,
        guidanceEnabled: args.guidanceEnabled ?? undefined,
        guidanceThreshold: args.guidanceThreshold ?? undefined,
      })
      .returning();

    return result;
  },
};

export const updateGate = {
  type: GateManagementType,
  args: {
    id: { type: new GraphQLNonNull(GraphQLString) },
    label: { type: GraphQLString },
    question: { type: GraphQLString },
    correctAnswer: { type: GraphQLString },
    successMessage: { type: GraphQLString },
    sequenceOrder: { type: GraphQLInt },
    acceptanceThreshold: { type: GraphQLFloat },
    guidanceEnabled: { type: GraphQLBoolean },
    guidanceThreshold: { type: GraphQLInt },
  },
  resolve: async (
    _: unknown,
    args: {
      id: string;
      label?: string;
      question?: string;
      correctAnswer?: string;
      successMessage?: string;
      sequenceOrder?: number;
      acceptanceThreshold?: number;
      guidanceEnabled?: boolean;
      guidanceThreshold?: number;
    },
    context: AppGraphQLContext,
  ) => {
    const userId = requireUser(context.get("user"));
    const db = context.get("db");

    const gate = await db.query.gates.findFirst({
      where: eq(gates.id, args.id),
    });
    if (!gate) throw new Error("Gate not found.");

    await authorizeProgramMutation(db, gate.programId, userId);

    if (
      args.sequenceOrder !== undefined &&
      args.sequenceOrder !== gate.sequenceOrder
    ) {
      const collision = await db.query.gates.findFirst({
        where: and(
          eq(gates.programId, gate.programId),
          eq(gates.sequenceOrder, args.sequenceOrder),
        ),
      });
      if (collision) {
        throw new Error(
          `Sequence order ${args.sequenceOrder} is already taken for this program.`,
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (args.label !== undefined) updateData.label = args.label;
    if (args.question !== undefined) updateData.question = args.question;
    if (args.correctAnswer !== undefined)
      updateData.correctAnswer = args.correctAnswer;
    if (args.successMessage !== undefined)
      updateData.successMessage = args.successMessage;
    if (args.sequenceOrder !== undefined)
      updateData.sequenceOrder = args.sequenceOrder;
    if (args.acceptanceThreshold !== undefined)
      updateData.acceptanceThreshold = args.acceptanceThreshold;
    if (args.guidanceEnabled !== undefined)
      updateData.guidanceEnabled = args.guidanceEnabled;
    if (args.guidanceThreshold !== undefined)
      updateData.guidanceThreshold = args.guidanceThreshold;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update.");
    }

    const [result] = await db
      .update(gates)
      .set(updateData)
      .where(eq(gates.id, args.id))
      .returning();

    return result;
  },
};

export const deleteGate = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    id: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (
    _: unknown,
    args: { id: string },
    context: AppGraphQLContext,
  ) => {
    const userId = requireUser(context.get("user"));
    const db = context.get("db");

    const gate = await db.query.gates.findFirst({
      where: eq(gates.id, args.id),
    });
    if (!gate) throw new Error("Gate not found.");

    await authorizeProgramMutation(db, gate.programId, userId);

    await db.delete(gates).where(eq(gates.id, args.id));
    return true;
  },
};

export const reorderGates = {
  type: new GraphQLNonNull(GraphQLBoolean),
  args: {
    programId: { type: new GraphQLNonNull(GraphQLString) },
    orderedGateIds: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(GraphQLString)),
      ),
    },
  },
  resolve: async (
    _: unknown,
    args: { programId: string; orderedGateIds: string[] },
    context: AppGraphQLContext,
  ) => {
    const userId = requireUser(context.get("user"));
    const db = context.get("db");

    await authorizeProgramMutation(db, args.programId, userId);

    const existingGates = await db
      .select({ id: gates.id })
      .from(gates)
      .where(eq(gates.programId, args.programId))
      .orderBy(asc(gates.sequenceOrder));

    const existingIds = existingGates.map((g) => g.id);
    const submittedIds = args.orderedGateIds;

    if (existingIds.length !== submittedIds.length) {
      throw new Error(
        `Expected ${existingIds.length} gate IDs, got ${submittedIds.length}.`,
      );
    }

    const submittedSet = new Set(submittedIds);
    if (submittedSet.size !== submittedIds.length) {
      throw new Error("Duplicate gate IDs in orderedGateIds.");
    }

    const allMatch = existingIds.every((id) => submittedSet.has(id));
    if (!allMatch) {
      throw new Error(
        "orderedGateIds must be an exact permutation of the program's gates.",
      );
    }

    // Two-pass atomic rewrite to avoid unique(programId, sequenceOrder) collisions.
    // Wrapped in a single db.batch() — D1 executes batch in one transaction.
    const tempUpdates = submittedIds.map((id, index) =>
      db
        .update(gates)
        .set({ sequenceOrder: -(index + 1) * 1000 })
        .where(eq(gates.id, id)),
    );
    const finalUpdates = submittedIds.map((id, index) =>
      db
        .update(gates)
        .set({ sequenceOrder: index + 1 })
        .where(eq(gates.id, id)),
    );
    await db.batch([...tempUpdates, ...finalUpdates] as unknown as Parameters<
      typeof db.batch
    >[0]);

    return true;
  },
};
