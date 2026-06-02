import type { D1Database } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { type AppVariables, setupDb } from "./middleware/db";
import { conditionalLogger } from "./middleware/logger";
import { sessionMiddleware } from "./middleware/session";
import gatesRouter from "./routes/gates";
import graphQlRouter from "./routes/graphql";
import programsRouter from "./routes/programs";
import { formatErrorResponse, logError } from "./utils/errorHandler";

export type Env = {
  Bindings: {
    DB: D1Database;
    ENVIRONMENT?: string;
  };
};

const app = new Hono<Env>();

app.use(conditionalLogger);

app.onError((err, c) => {
  logError(err, c.req.method, c.req.path);
  return c.json(formatErrorResponse(err, c.req.path), 500);
});

const api = new Hono<AppVariables>()
  .use("*", setupDb)
  .use("*", sessionMiddleware)
  .route("/graphql", graphQlRouter)
  .route("/programs", programsRouter)
  .route("/gates", gatesRouter);

// Must use chaining in order for Hono RPC to work
const routes = app.basePath("/api").route("/", api);

export type AppType = typeof routes;

export default app;
