import { Hono } from "hono";
import type { Env } from "../entry";

// Must use chaining in order for Hono RPC to work
const riddlesRouter = new Hono<Env>().get("/", (c) => {
  return c.json({ error: "Not implemented" }, 501);
});

export default riddlesRouter;
