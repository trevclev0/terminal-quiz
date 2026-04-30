import { Hono } from "hono";
import programs from "../../.generated/programs.json" with { type: "json" };
import type { Program } from "../App.types";
import type { Generics } from "../entry";

// Must use chaining in order for Hono RPC to work
const programsRouter = new Hono<Generics>().get("/", (c) => {
  return c.json(programs as Program[]);
});

export default programsRouter;
