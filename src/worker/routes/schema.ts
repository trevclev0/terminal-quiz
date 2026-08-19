import { me } from "@worker-graphql/gameplay/authQueries";
import {
  createGate,
  deleteGate,
  updateGate,
} from "@worker-graphql/gameplay/gateMutations";
import {
  createProgram,
  deleteProgram,
  updateProgram,
} from "@worker-graphql/gameplay/programMutations";
import {
  getPrograms,
  myPrograms,
  program,
  programGates,
} from "@worker-graphql/gameplay/programQueries";
import { reorderGates } from "@worker-graphql/gameplay/reorderGatesMutation";
import { requestClue } from "@worker-graphql/gameplay/requestClueMutation";
import { resetSession } from "@worker-graphql/gameplay/resetSessionMutation";
import {
  getInProgressProgram,
  getProgramProgression,
} from "@worker-graphql/gameplay/sessionQueries";
import { submitGuess } from "@worker-graphql/gameplay/submitGuessMutation";
import { type AnyDrizzleDB, buildSchema } from "drizzle-graphql";
import type { GraphQLNamedType } from "graphql";
import { GraphQLObjectType, GraphQLSchema } from "graphql";

/**
 * Builds the full GraphQL schema: drizzle-graphql auto-generated entities
 * (from the Drizzle schema) wrapped with the hand-written query/mutation
 * resolvers and custom payload types.
 *
 * Shared by the worker (src/worker/routes/graphql.ts) and the offline SDL
 * dump (scripts/dump-schema.ts), which feeds graphql-codegen. Keeping this in
 * one place guarantees the committed schema.graphql matches the deployed
 * schema. Building only reads the static Drizzle schema (`db._.fullSchema`),
 * so no live connection is required.
 */
export function buildAppSchema<
  TDb extends AnyDrizzleDB<Record<string, unknown>>,
>(db: TDb): GraphQLSchema {
  const { entities } = buildSchema(db);

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Query",
      fields: {
        me,
        myPrograms,
        program,
        programs: getPrograms,
        programGates,
        getProgramProgression,
        getInProgressProgram,
      },
    }),
    mutation: new GraphQLObjectType({
      name: "Mutation",
      fields: {
        submitGuess,
        requestClue,
        resetSession,
        createProgram,
        updateProgram,
        deleteProgram,
        createGate,
        updateGate,
        deleteGate,
        reorderGates,
      },
    }),
    types: [
      ...Object.values(entities.types),
      ...Object.values(entities.inputs),
    ] as GraphQLNamedType[],
  });
}
