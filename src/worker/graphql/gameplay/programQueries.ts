import { gates, programs } from "@shared/schema";
import { asc, eq, or } from "drizzle-orm";
import { GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";
import { authorizeProgramMutation } from "./authorizeProgram";
import {
  type AppGraphQLContext,
  GateManagementType,
  ProgramListItemType,
} from "./types";

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
