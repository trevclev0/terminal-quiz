import { buildSchema } from "drizzle-graphql";
import { createHandler } from "graphql-http/lib/use/fetch";
import { Hono } from "hono";
import type { DbContext } from "../middleware/db";

let cachedSchema: ReturnType<typeof buildSchema>["schema"] | null = null;

// Exported to allow schema cache invalidation if needed (e.g., during testing).
// Note: This should not be used in production. In Cloudflare Workers, isolates persist module state.
// However, since drizzle-graphql builds the GraphQL schema from the statically bundled TypeScript
// schema, it only changes when new code is deployed (which naturally resets the isolate).
// Only the schema is cached, not the handlers nor the context.
export const invalidateCachedSchema = () => {
  cachedSchema = null;
};

const graphQlRouter = new Hono<DbContext>().all("*", async (c) => {
  try {
    const currentDb = c.get("db");

    if (!cachedSchema) {
      const { schema } = buildSchema(currentDb);
      cachedSchema = schema;
    }

    const handler = createHandler({
      schema: cachedSchema,
      context: {
        db: currentDb,
        env: c.env,
      },
    });

    return handler(c.req.raw);
  } catch (error) {
    console.error("GraphQL error:", error);
    throw error;
  }
});

export default graphQlRouter;
