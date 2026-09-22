import { gates } from "@shared/schema";
import {
  createGateInputSchema,
  parseOrThrow,
  updateGateInputSchema,
} from "@shared/validation";
import { and, eq } from "drizzle-orm";
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";
import { authorizeProgramMutation } from "./authorizeProgram";
import { definedFields, requireUser } from "./managementHelpers";
import { type AppGraphQLContext, GateManagementType } from "./types";

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
    const input = parseOrThrow(createGateInputSchema, {
      label: args.label,
      question: args.question,
      correctAnswer: args.correctAnswer,
      successMessage: args.successMessage,
      sequenceOrder: args.sequenceOrder,
      // An explicit GraphQL null means "column default", same as omitting.
      acceptanceThreshold: args.acceptanceThreshold ?? undefined,
      guidanceEnabled: args.guidanceEnabled ?? undefined,
      guidanceThreshold: args.guidanceThreshold ?? undefined,
    });

    const db = context.get("db");
    await authorizeProgramMutation(db, args.programId, userId);

    const existing = await db.query.gates.findFirst({
      where: and(
        eq(gates.programId, args.programId),
        eq(gates.sequenceOrder, input.sequenceOrder),
      ),
    });
    if (existing) {
      throw new Error(
        `Sequence order ${input.sequenceOrder} is already taken for this program.`,
      );
    }

    const [result] = await db
      .insert(gates)
      .values({ programId: args.programId, ...input })
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
    const { id, ...fields } = args;
    const updateData = definedFields(
      parseOrThrow(updateGateInputSchema, fields),
    );
    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update.");
    }

    const db = context.get("db");
    const gate = await db.query.gates.findFirst({
      where: eq(gates.id, id),
    });
    if (!gate) throw new Error("Gate not found.");

    await authorizeProgramMutation(db, gate.programId, userId);

    const { sequenceOrder } = updateData;
    if (sequenceOrder !== undefined && sequenceOrder !== gate.sequenceOrder) {
      const collision = await db.query.gates.findFirst({
        where: and(
          eq(gates.programId, gate.programId),
          eq(gates.sequenceOrder, sequenceOrder),
        ),
      });
      if (collision) {
        throw new Error(
          `Sequence order ${sequenceOrder} is already taken for this program.`,
        );
      }
    }

    const [result] = await db
      .update(gates)
      .set(updateData)
      .where(eq(gates.id, id))
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
