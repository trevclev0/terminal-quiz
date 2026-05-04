import type { D1Database } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { type DbContext, setupDb } from "./middleware/db";
import gatesRouter from "./routes/gates";
import programsRouter from "./routes/programs";

export type Env = {
  Bindings: {
    ASSETS: Fetcher;
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

// Separate the API routes from the static assets for simpler Hono RPC
app.get("*", async (c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.notFound();
  }
  try {
    return await c.env.ASSETS.fetch(c.req.raw);
  } catch (e) {
    console.error("Failed to fetch static asset:", e);
    return c.notFound();
  }
});

export type AppType = typeof routes;

export default app;
