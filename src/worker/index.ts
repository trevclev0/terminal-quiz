import type { D1Database } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { type DbContext, setupDb } from "./middleware/db";
import gatesRouter from "./routes/gates";
import graphQlRouter from "./routes/graphql";
import programsRouter from "./routes/programs";

export type Env = {
  Bindings: {
    DB: D1Database;
    ENVIRONMENT?: string;
  };
};

interface D1Error {
  message?: string;
  cause?: unknown;
  code?: string;
}

const app = new Hono<Env>();

// biome-ignore lint/suspicious/noExplicitAny: Allows checking process.env.NODE_ENV in Cloudflare runtime
const globalObj = globalThis as any;

if (
  typeof globalObj.process !== "undefined" &&
  globalObj.process.env?.NODE_ENV !== "test"
) {
  app.use(logger());
}

app.onError((err, c) => {
  console.error(
    `[Error on ${c.req.method} ${c.req.path}]:`,
    err.message || err,
  );

  if (err.cause) {
    const cause = err.cause as D1Error;
    console.error("Underlying D1 Cause:", cause.message || cause);
  }

  if (c.req.path.startsWith("/api/graphql")) {
    return c.json(
      { errors: [{ message: err.message || "Internal Server Error" }] },
      500,
    );
  }

  return c.json(
    {
      status: "error",
      message: "Server Error",
      code: "INTERNAL_SERVER_ERROR",
    },
    500,
  );
});

// Set up DB middleware for all API routes
const api = new Hono<DbContext>()
  .use("*", setupDb)
  .route("/graphql", graphQlRouter)
  .route("/programs", programsRouter)
  .route("/gates", gatesRouter);

// Must use chaining in order for Hono RPC to work
const routes = app.basePath("/api").route("/", api);

export type AppType = typeof routes;

export default app;
