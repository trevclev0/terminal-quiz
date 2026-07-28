import { graphqlServer } from "@hono/graphql-server";
import {
  requestClue,
  resetSession,
  submitGuess,
} from "@worker-graphql/gameplay/mutations";
import {
  getInProgressProgram,
  getProgramProgression,
  getPrograms,
  me,
  myPrograms,
} from "@worker-graphql/gameplay/queries";
import type { AppVariables } from "@worker-middleware/db";
import { buildSchema } from "drizzle-graphql";
import {
  GraphQLObjectType,
  GraphQLSchema,
  NoSchemaIntrospectionCustomRule,
} from "graphql";
import { Hono } from "hono";

let cachedSchema: GraphQLSchema | null = null;

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
            programs: getPrograms,
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

  return graphqlServer({
    schema: cachedSchema,
    graphiql: !isProduction,
    validationRules: isProduction ? [NoSchemaIntrospectionCustomRule] : [],
  })(c, next);
});

export default graphQlRouter;
