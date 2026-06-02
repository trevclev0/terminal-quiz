import * as schema from "@shared/schema";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import type { Context, Next } from "hono";
import type { Env } from "..";

export type AppVariables = Env & {
  Variables: {
    db: DrizzleD1Database<typeof schema>;
    sessionId?: string;
  };
};

export async function setupDb(c: Context<AppVariables>, next: Next) {
  c.set("db", drizzle(c.env.DB, { schema }));
  return next();
}
