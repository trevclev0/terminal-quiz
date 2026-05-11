import { buildSchema } from "drizzle-graphql";
import { createYoga } from "graphql-yoga";
import { Hono } from "hono";
import type { DbContext } from "../middleware/db";

let cachedYoga: ReturnType<typeof createYoga> | null = null;

// Exported to allow cache invalidation if needed (e.g., during testing).
// Note: This should not be used in production. In Cloudflare Workers, isolates persist module state.4
// However, since drizzle-graphql builds the GraphQL schema from the statically bundled TypeScript
// schema, it only changes when new code is deployed (which naturally resets the isolate).
export const invalidateCachedYoga = () => {
  cachedYoga = null;
};

const graphQlRouter = new Hono<DbContext>().all("*", async (c) => {
  try {
    const currentDb = c.get("db");

    if (!cachedYoga) {
      const { schema } = buildSchema(currentDb);

      cachedYoga = createYoga({
        schema,
        graphqlEndpoint: "/api/graphql",
        fetchAPI: { Response, Request },
      });
    }

    return cachedYoga.fetch(c.req.raw, {
      db: currentDb,
      env: c.env,
    });
  } catch (error) {
    console.error("GraphQL error:", error);
    throw error;
  }
});

export default graphQlRouter;
