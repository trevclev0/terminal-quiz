import type { D1Database } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { type DbContext, setupDb } from "./middleware/db";
import gatesRouter from "./routes/gates";
import programsRouter from "./routes/programs";

export type Env = {
  Bindings: {
    DB: D1Database;
  };
};

const app = new Hono<Env>();

// Set up DB middleware for all API routes
const api = new Hono<DbContext>()
  .use("*", setupDb)
  .route("/programs", programsRouter)
  .route("/gates", gatesRouter);

// Must use chaining in order for Hono RPC to work
const routes = app.basePath("/api").route("/", api);

export type AppType = typeof routes;

export default app;
