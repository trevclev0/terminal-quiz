import { Hono } from "hono";
import type { Bindings } from "../entry";

const riddlesRouter = new Hono<{ Bindings: Bindings }>();

riddlesRouter.post("/", (c) => c.json({ error: "Not implemented" }, 501));

export default riddlesRouter;
