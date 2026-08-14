import { gates } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";
import { authorizeProgramMutation } from "./authorizeProgram";
import {
  assertGuidanceThreshold,
  assertRequiredText,
  requireUser,
} from "./managementHelpers";
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
    const db = context.get("db");

    await authorizeProgramMutation(db, args.programId, userId);

    const label = assertRequiredText(args.label, "label");
    const question = assertRequiredText(args.question, "question");
    const correctAnswer = assertRequiredText(
      args.correctAnswer,
      "correctAnswer",
    );
    const successMessage = assertRequiredText(
      args.successMessage,
      "successMessage",
    );
    if (args.guidanceThreshold !== undefined) {
      assertGuidanceThreshold(args.guidanceThreshold);
    }

    if (args.sequenceOrder < 1) {
      throw new Error("sequenceOrder must be a positive integer.");
    }

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
        label,
        question,
        correctAnswer,
        successMessage,
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

    if (args.sequenceOrder !== undefined) {
      if (args.sequenceOrder < 1) {
        throw new Error("sequenceOrder must be a positive integer.");
      }
      if (args.sequenceOrder !== gate.sequenceOrder) {
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
    }

    const updateData: Record<string, unknown> = {};
    if (args.label !== undefined)
      updateData.label = assertRequiredText(args.label, "label");
    if (args.question !== undefined)
      updateData.question = assertRequiredText(args.question, "question");
    if (args.correctAnswer !== undefined)
      updateData.correctAnswer = assertRequiredText(
        args.correctAnswer,
        "correctAnswer",
      );
    if (args.successMessage !== undefined)
      updateData.successMessage = assertRequiredText(
        args.successMessage,
        "successMessage",
      );
    if (args.sequenceOrder !== undefined)
      updateData.sequenceOrder = args.sequenceOrder;
    if (args.acceptanceThreshold !== undefined)
      updateData.acceptanceThreshold = args.acceptanceThreshold;
    if (args.guidanceEnabled !== undefined)
      updateData.guidanceEnabled = args.guidanceEnabled;
    if (args.guidanceThreshold !== undefined) {
      assertGuidanceThreshold(args.guidanceThreshold);
      updateData.guidanceThreshold = args.guidanceThreshold;
    }

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
