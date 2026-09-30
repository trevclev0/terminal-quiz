import type {
  Ai,
  D1Database,
  ScheduledController,
} from "@cloudflare/workers-types";
import { authMiddleware } from "@worker-middleware/auth";
import { type AppVariables, setupDb } from "@worker-middleware/db";
import {
  conditionalLogger,
  requestIdMiddleware,
} from "@worker-middleware/logger";
import { requireSessionHeader } from "@worker-middleware/requireSessionHeader";
import { sessionMiddleware } from "@worker-middleware/session";
import { errorReportingRouter } from "@worker-routes/errorReporting";
import graphQlRouter from "@worker-routes/graphql";
import { getAuth } from "@worker-services/auth";
import { runSessionCleanup } from "@worker-services/sessionCleanup";
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
    // Optional caps on the public POST /api/error beacon: accepted beacons
    // per client IP per clock hour, and across all clients per UTC day.
    // Defaults in code when unset (see services/errorBeaconLimit.ts).
    ERROR_BEACON_IP_HOURLY_LIMIT?: string;
    ERROR_BEACON_DAILY_BUDGET?: string;
    // Optional days without a guess or reset before the hourly cron deletes
    // an anonymous session's progress. Defaults in code when unset (see
    // services/sessionCleanup.ts).
    SESSION_RETENTION_DAYS?: string;
  };
};

const app = new Hono<AppVariables>();

app.use(requestIdMiddleware);
app.use(conditionalLogger);

app.onError((err, c) => {
  logError(err, c.req.method, c.req.path, c.get("requestId"));
  return c.json(formatErrorResponse(err, c.req.path), 500);
});

const api = new Hono<AppVariables>()
  .use("*", setupDb)
  .use("*", sessionMiddleware)
  .all("/auth/*", async (c) => {
    const auth = getAuth(c);
    return auth.handler(c.req.raw);
  })
  .use("/graphql", requireSessionHeader)
  .use("/graphql", authMiddleware)
  .route("/graphql", graphQlRouter)
  .route("/error", errorReportingRouter);

// Must use chaining in order for Hono RPC to work
const routes = app.basePath("/api").route("/", api);

export type AppType = typeof routes;

export default {
  fetch: app.fetch,
  // Hourly cron (triggers.crons in wrangler.jsonc): prune stale anonymous
  // sessions (#315). Awaited rather than passed to waitUntil, so a failed
  // run marks the invocation failed.
  async scheduled(controller: ScheduledController, env: Env["Bindings"]) {
    await runSessionCleanup(env, controller.scheduledTime);
  },
};
