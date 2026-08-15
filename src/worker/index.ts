import type { Ai, D1Database } from "@cloudflare/workers-types";
import { authMiddleware } from "@worker-middleware/auth";
import { type AppVariables, setupDb } from "@worker-middleware/db";
import { conditionalLogger } from "@worker-middleware/logger";
import { sessionMiddleware } from "@worker-middleware/session";
import graphQlRouter from "@worker-routes/graphql";
import { getAuth } from "@worker-services/auth";
import { formatErrorResponse, logError } from "@worker-utils/errorHandler";
import { Hono } from "hono";

export type Env = {
  Bindings: {
    DB: D1Database;
    AI?: Ai;
    ANALYTICS?: AnalyticsEngineDataset;
    ENVIRONMENT?: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    AUTH_TEST_BYPASS_ENABLED?: string;
    AUTH_TEST_BYPASS_SECRET?: string;
    // Optional cap on AI clue generations per UTC day (Workers AI free tier
    // is 10,000 neurons/day, ~200 llama-class calls). Defaults in code when
    // unset. Global across all programs/sessions.
    AI_DAILY_CLUE_BUDGET?: string;
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
  .all("/auth/*", async (c) => {
    const auth = getAuth(c);
    return auth.handler(c.req.raw);
  })
  .use("/graphql", authMiddleware)
  .route("/graphql", graphQlRouter);

// Must use chaining in order for Hono RPC to work
const routes = app.basePath("/api").route("/", api);

export type AppType = typeof routes;

export default app;
