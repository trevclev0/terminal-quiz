import { Hono } from "hono";
import programs from "../.generated/programs.json" with { type: "json" };

type Bindings = {
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

const routes = app
  .get("/api/programs", (c) => {
    return c.json(programs);
  })
  .post("/api/hints", async (c) => {
    return c.json({ error: "Not implemented" }, 501);
  })
  .all("*", (c) => {
    return c.env.ASSETS.fetch(c.req.raw);
  });

export type AppType = typeof routes;

export default app;
