import { gates } from "@shared/schema";
import {
  createGateInputSchema,
  findAnswerConflict,
  parseOrThrow,
  updateGateInputSchema,
} from "@shared/validation";
import { and, eq } from "drizzle-orm";
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";
import { authorizeProgramMutation } from "./authorizeProgram";
import { definedFields, requireUser } from "./managementHelpers";
import { type AppGraphQLContext, GateManagementType } from "./types";

const acceptedAnswersType = new GraphQLList(new GraphQLNonNull(GraphQLString));

export const createGate = {
  type: GateManagementType,
  args: {
    programId: { type: new GraphQLNonNull(GraphQLString) },
    label: { type: new GraphQLNonNull(GraphQLString) },
    question: { type: new GraphQLNonNull(GraphQLString) },
    correctAnswer: { type: new GraphQLNonNull(GraphQLString) },
    acceptedAnswers: { type: acceptedAnswersType },
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
      acceptedAnswers?: string[] | null;
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
      acceptedAnswers: args.acceptedAnswers ?? undefined,
      successMessage: args.successMessage,
      sequenceOrder: args.sequenceOrder,
      // An explicit GraphQL null means "column default", same as omitting.
      acceptanceThreshold: args.acceptanceThreshold ?? undefined,
      guidanceEnabled: args.guidanceEnabled ?? undefined,
      guidanceThreshold: args.guidanceThreshold ?? undefined,
    });

    const conflict = findAnswerConflict(
      input.correctAnswer,
      input.acceptedAnswers ?? [],
    );
    if (conflict) throw new Error(conflict);

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
    acceptedAnswers: { type: acceptedAnswersType },
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
      acceptedAnswers?: string[] | null;
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
      parseOrThrow(updateGateInputSchema, {
        ...fields,
        // A GraphQL null means "no change", same as omitting the arg.
        acceptedAnswers: fields.acceptedAnswers ?? undefined,
      }),
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

    // A partial update carries only one side of the pair, so check the new
    // value against what is stored for the other. After authorization so a
    // non-owner learns nothing about the stored answers.
    const conflict = findAnswerConflict(
      updateData.correctAnswer ?? gate.correctAnswer,
      updateData.acceptedAnswers ?? gate.acceptedAnswers ?? [],
    );
    if (conflict) throw new Error(conflict);

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
