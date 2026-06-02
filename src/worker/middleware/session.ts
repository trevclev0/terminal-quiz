import { createMiddleware } from "hono/factory";
import type { AppVariables } from "./db";

export const sessionMiddleware = createMiddleware<AppVariables>(
  async (c, next) => {
    const sessionId = c.req.header("x-session-id");
    if (sessionId) {
      c.set("sessionId", sessionId);
    }
    await next();
  },
);
