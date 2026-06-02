import { createMiddleware } from "hono/factory";
import type { DbContext } from "./db";

export const sessionMiddleware = createMiddleware<DbContext>(
  async (c, next) => {
    const sessionId = c.req.header("x-session-id");
    if (sessionId) {
      c.set("sessionId", sessionId);
    }
    await next();
  },
);
