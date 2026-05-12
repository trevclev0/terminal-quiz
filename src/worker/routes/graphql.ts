import { buildSchema } from "drizzle-graphql";
import { createHandler } from "graphql-http/lib/use/fetch";
import { Hono } from "hono";
import type { DbContext } from "../middleware/db";

let cachedHandler: ReturnType<typeof createHandler> | null = null;

// Exported to allow cache invalidation if needed (e.g., during testing).
// Note: This should not be used in production. In Cloudflare Workers, isolates persist module state.
// However, since drizzle-graphql builds the GraphQL schema from the statically bundled TypeScript
// schema, it only changes when new code is deployed (which naturally resets the isolate).
export const invalidateCachedHandler = () => {
  cachedHandler = null;
};

const graphQlRouter = new Hono<DbContext>().all("*", async (c) => {
  try {
    const currentDb = c.get("db");

    if (!cachedHandler) {
      const { schema } = buildSchema(currentDb);

      cachedHandler = createHandler({
        schema,
        context: {
          db: currentDb,
          env: c.env,
        },
      });
    }

    return cachedHandler(c.req.raw);
  } catch (error) {
    console.error("GraphQL error:", error);
    throw error;
  }
});

export default graphQlRouter;
