import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import type { Context, Next } from "hono";
import type { Env } from "..";
import * as schema from "../db/schema";

export type DbContext = Env & {
  Variables: { db: DrizzleD1Database<typeof schema> };
};

export async function setupDb(c: Context<DbContext>, next: Next) {
  c.set("db", drizzle(c.env.DB, { schema }));
  return next();
}
