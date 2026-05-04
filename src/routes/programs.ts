import { Hono } from "hono";
import type { DbContext } from "../middleware/db";

interface D1Error {
  message?: string;
  cause?: unknown;
  code?: string;
}

const programsRouter = new Hono<DbContext>().get("/", async (c) => {
  try {
    const db = c.get("db");
    const result = await db.query.programs.findMany({
      with: { gates: true },
    });
    return c.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Failed to fetch programs:", error.message);
      if (error.cause) {
        const cause = error.cause as D1Error;
        console.error("Underlying D1 Error:", cause.message || cause);
      }
    } else {
      console.error("An unexpected error occurred:", error);
    }
    return c.json({ error: "Failed to fetch programs" }, 500);
  }
});

export default programsRouter;
