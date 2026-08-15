import { createMiddleware } from "hono/factory";
import type { AppVariables } from "./db";

const validEnvs = ["development", "preview", "production"];

export const requestIdMiddleware = createMiddleware<AppVariables>(
  async (c, next) => {
    const requestId = c.req.header("x-request-id") ?? crypto.randomUUID();
    c.set("requestId", requestId);
    c.header("x-request-id", requestId);
    await next();
  },
);

export const conditionalLogger = createMiddleware<AppVariables>(
  async (c, next) => {
    const start = performance.now();
    await next();
    const durationMs = performance.now() - start;
    if (validEnvs.includes(c.env.ENVIRONMENT || "")) {
      console.log(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "info",
          method: c.req.method,
          path: c.req.path,
          status: c.res.status,
          durationMs: Math.round(durationMs * 100) / 100,
          requestId: c.get("requestId"),
          sessionId: c.get("sessionId"),
        }),
      );
    }
  },
);
