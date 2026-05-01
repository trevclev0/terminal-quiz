import type { D1Database } from "@cloudflare/workers-types";
import { Hono } from "hono";
import programsRouter from "./routes/programs";
import riddlesRouter from "./routes/riddles";

export type Env = {
  Bindings: {
    ASSETS: Fetcher;
    DB: D1Database;
  };
};

const app = new Hono<Env>();

// Must use chaining in order for Hono RPC to work
const routes = app
  .basePath("/api")
  .route("/programs", programsRouter)
  .route("/riddles", riddlesRouter);

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
