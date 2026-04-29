import { Hono } from "hono";
import programs from "../../.generated/programs.json" with { type: "json" };
import type { Bindings } from "../entry";

const programsRouter = new Hono<{ Bindings: Bindings }>();

programsRouter.get("/", (c) => c.json(programs));

export default programsRouter;
