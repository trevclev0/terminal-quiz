import { graphqlServer } from "@hono/graphql-server";
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
import type { AppVariables } from "@worker-middleware/db";
import { buildSchema } from "drizzle-graphql";
import {
  GraphQLObjectType,
  GraphQLSchema,
  NoSchemaIntrospectionCustomRule,
} from "graphql";
import { Hono } from "hono";

let cachedSchema: GraphQLSchema | null = null;

type GraphQLErrorBody = {
  errors?: Array<{
    extensions?: { code?: string };
  }>;
};

/**
 * Derives the rewritten status for an auth-failure response, or null when the
 * response mixes tagged and untagged errors — a real server failure is present
 * alongside the auth error and must not be masked by a 401/403 rewrite.
 */
export function authFailureStatus(body: GraphQLErrorBody): 401 | 403 | null {
  const codes = body.errors?.map((error) => error.extensions?.code);
  if (!codes?.length) return null;

  const status =
    codes[0] === "UNAUTHENTICATED"
      ? (401 as const)
      : codes[0] === "FORBIDDEN"
        ? (403 as const)
        : null;
  if (status === null || !codes.every((code) => code === codes[0])) return null;
  return status;
}

// Exported to allow schema cache invalidation if needed (e.g., during testing).
// Note: This should not be used in production. In Cloudflare Workers, isolates persist module state.
// However, since drizzle-graphql builds the GraphQL schema from the statically bundled TypeScript
// schema, it only changes when new code is deployed (which naturally resets the isolate).
// Only the schema is cached, not the handlers nor the context.
export const invalidateCachedSchema = () => {
  cachedSchema = null;
};

const graphQlRouter = new Hono<AppVariables>().use("*", async (c, next) => {
  const isProduction = c.env.ENVIRONMENT === "production";

  if (!cachedSchema) {
    try {
      const currentDb = c.get("db");
      const { entities } = buildSchema(currentDb);

      cachedSchema = new GraphQLSchema({
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
        ],
      });
    } catch (schemaError) {
      console.error("Critical error building GraphQL Schema:", schemaError);

      return c.json(
        {
          errors: [
            { message: "Internal server error during schema generation." },
          ],
        },
        500,
      );
    }
  }

  const server = graphqlServer({
    schema: cachedSchema,
    graphiql: !isProduction,
    validationRules: isProduction ? [NoSchemaIntrospectionCustomRule] : [],
  });

  const response = (await server(c, next)) ?? c.res;

  if (response.status === 500) {
    // @hono/graphql-server hardcodes 500 when a non-null field error bubbles
    // to the root (result.data is null). Resolvers tag auth/ownership failures
    // via error extensions; rewrite those to their proper status codes.
    const body = (await response
      .clone()
      .json()
      .catch(() => null)) as GraphQLErrorBody | null;
    const status = body ? authFailureStatus(body) : null;
    if (status !== null) {
      return c.json(body, status);
    }
  }

  return response;
});

export default graphQlRouter;
