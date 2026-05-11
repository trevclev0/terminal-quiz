import { buildSchema } from "drizzle-graphql";
import { createYoga } from "graphql-yoga";
import { Hono } from "hono";
import type { DbContext } from "../middleware/db";

let cachedYoga: ReturnType<typeof createYoga> | null = null;

const graphQlRouter = new Hono<DbContext>().all("/", async (c) => {
  try {
    const currentDb = c.get("db");

    if (!cachedYoga) {
      const { schema } = buildSchema(currentDb);

      cachedYoga = createYoga({
        schema,
        graphqlEndpoint: "/graphql",
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
