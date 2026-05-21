import { Hono } from "hono";
import type { DbContext } from "../middleware/db";

const programsRouter = new Hono<DbContext>().get("/", async (c) => {
  const db = c.get("db");
  const result = await db.query.programs.findMany({
    with: { gates: true },
  });
  return c.json(result);
});

export default programsRouter;
