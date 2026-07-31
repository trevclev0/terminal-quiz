import { programs } from "@shared/schema";
import { eq } from "drizzle-orm";
import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql";
import { authorizeProgramMutation } from "./authorizeProgram";
import { assertVisibility, requireUser } from "./managementHelpers";
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
