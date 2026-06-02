import { createMiddleware } from "hono/factory";
import { logger } from "hono/logger";

export const conditionalLogger = createMiddleware(async (c, next) => {
  const validEnvs = ["development", "preview", "production"];
  if (validEnvs.includes(c.env.ENVIRONMENT || "")) {
    return logger()(c, next);
  }
  await next();
});
