import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import type { Context, Next } from "hono";
import * as schema from "../db/schema";
import type { Env } from "../entry";

export type DbContext = Env & {
  Variables: { db: DrizzleD1Database<typeof schema> };
};

export async function setupDb(c: Context<DbContext>, next: Next) {
  c.set("db", drizzle(c.env.DB, { schema }));
  return next();
}
