import { Hono } from "hono";
import type { AppVariables } from "../middleware/db";

const programsRouter = new Hono<AppVariables>().get("/", async (c) => {
  const db = c.get("db");
  const result = await db.query.programs.findMany({
    with: { gates: true },
  });
  return c.json(result);
});

export default programsRouter;
