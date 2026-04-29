import { Hono } from "hono";
import programsRouter from "./routes/programs";
import riddlesRouter from "./routes/riddles";

export type Bindings = {
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

const routes = app
  .basePath("/api")
  .route("/programs", programsRouter)
  .route("/riddles", riddlesRouter);

app.get("*", async (c) => await c.env.ASSETS.fetch(c.req.raw));

export type AppType = typeof routes;

export default app;
