import { programs } from "@shared/schema";
import {
  createProgramInputSchema,
  parseOrThrow,
  updateProgramInputSchema,
} from "@shared/validation";
import { eq } from "drizzle-orm";
import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";
import { authorizeProgramMutation } from "./authorizeProgram";
import { definedFields, requireUser } from "./managementHelpers";
import { type AppGraphQLContext, ProgramManagementType } from "./types";

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
    const { name, visibility } = parseOrThrow(createProgramInputSchema, {
      name: args.name,
      // An explicit GraphQL null means "default", same as omitting it.
      visibility: args.visibility ?? undefined,
    });

    const db = context.get("db");
    const [result] = await db
      .insert(programs)
      .values({ name, visibility, authorId: userId })
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
    const { id, ...fields } = args;
    const updateData = definedFields(
      parseOrThrow(updateProgramInputSchema, fields),
    );
    if (Object.keys(updateData).length === 0) {
      throw new Error("No fields to update.");
    }

    const db = context.get("db");
    await authorizeProgramMutation(db, id, userId);

    const [result] = await db
      .update(programs)
      .set(updateData)
      .where(eq(programs.id, id))
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
