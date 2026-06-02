import { graphqlServer } from "@hono/graphql-server";
import { buildSchema } from "drizzle-graphql";
import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { Hono } from "hono";
import { submitGuess } from "../graphql/gameplay/mutations";
import { getProgramProgression } from "../graphql/gameplay/queries";
import type { DbContext } from "../middleware/db";

let cachedSchema: GraphQLSchema | null = null;

// Exported to allow schema cache invalidation if needed (e.g., during testing).
// Note: This should not be used in production. In Cloudflare Workers, isolates persist module state.
// However, since drizzle-graphql builds the GraphQL schema from the statically bundled TypeScript
// schema, it only changes when new code is deployed (which naturally resets the isolate).
// Only the schema is cached, not the handlers nor the context.
export const invalidateCachedSchema = () => {
  cachedSchema = null;
};

const graphQlRouter = new Hono<DbContext>().use("*", async (c, next) => {
  const isProduction = c.env.ENVIRONMENT === "production";

  if (!cachedSchema) {
    try {
      const currentDb = c.get("db");
      const { entities } = buildSchema(currentDb);

      cachedSchema = new GraphQLSchema({
        query: new GraphQLObjectType({
          name: "Query",
          fields: {
            ...entities.queries,
            getProgramProgression,
          },
        }),
        mutation: new GraphQLObjectType({
          name: "Mutation",
          fields: {
            ...entities.mutations,
            submitGuess,
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
  })(c, next);
});

export default graphQlRouter;
