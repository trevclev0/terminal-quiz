import { Hono } from "hono";
import programsRouter from "./routes/programs";
import riddlesRouter from "./routes/riddles";

export type Generics = {
  Bindings: {
    ASSETS: Fetcher;
  };
};

const app = new Hono<Generics>();

// Must use chaining in order for Hono RPC to work
const routes = app
  .basePath("/api")
  .route("/programs", programsRouter)
  .route("/riddles", riddlesRouter);

// Separate the API routs from the static assets for simpler Hono RPC
app.get("*", async (c) => await c.env.ASSETS.fetch(c.req.raw));

export type AppType = typeof routes;

export default app;
