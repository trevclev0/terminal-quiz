import { gates } from "@shared/schema";
import { asc, eq } from "drizzle-orm";
import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from "graphql";
import { authorizeProgramMutation } from "./authorizeProgram";
import { requireUser } from "./managementHelpers";
import type { AppGraphQLContext } from "./types";

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

    if (existingIds.length === 0) return true;

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
