import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import * as schema from "../db/schema";
import type { Env } from "../entry";

// Must use chaining in order for Hono RPC to work
const programsRouter = new Hono<Env>().get("/", async (c) => {
  try {
    const db = drizzle(c.env.DB, { schema });
    const result = await db.query.programs.findMany({
      with: { gates: true },
    });
    return c.json(result);
  } catch (error: any) {
    console.error("Failed to fetch programs:", error);
    if (error.cause) {
      console.error("Underlying D1 Error:", error.cause.message || error.cause);
    }
    return c.json({ error: "Failed to fetch programs" }, 500);
  }
});

export default programsRouter;
