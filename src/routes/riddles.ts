import { Hono } from "hono";
import type { Generics } from "../entry";

// Must use chaining in order for Hono RPC to work
const riddlesRouter = new Hono<Generics>().post("/", (c) => {
  return c.json({ error: "Not implemented" }, 501);
});

export default riddlesRouter;
