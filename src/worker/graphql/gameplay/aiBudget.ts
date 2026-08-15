import { aiUsage } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import type { AppGraphQLContext } from "./types";

export const DEFAULT_AI_DAILY_CLUE_BUDGET = 150;

export function getUsageDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getDailyAiBudget(raw: string | undefined): number {
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_AI_DAILY_CLUE_BUDGET;
}

/**
 * Atomically claims one unit of the daily AI budget and returns the new
 * total (completed + in-flight reservations). D1 is single-writer, so the
 * upsert+return is race-free: concurrent requests get strictly increasing
 * counts, so the caller's `count > budget` check can never let two requests
 * both proceed once the cap is reached.
 */
export async function reserveAiUsage(
  db: AppGraphQLContext["var"]["db"],
  usageDateKey: string,
): Promise<number> {
  const [row] = await db
    .insert(aiUsage)
    .values({ usageDate: usageDateKey, requestCount: 1 })
    .onConflictDoUpdate({
      target: aiUsage.usageDate,
      set: { requestCount: sql`${aiUsage.requestCount} + 1` },
    })
    .returning({ requestCount: aiUsage.requestCount });
  return row.requestCount;
}

/**
 * Releases a reservation that never reached the AI (e.g. a rate-limit
 * rejection or an over-budget race loser). Reservations are intentionally
 * NOT released on generation/storage failure — those calls may have billed,
 * so keeping them counted is the conservative choice.
 */
export async function releaseAiUsage(
  db: AppGraphQLContext["var"]["db"],
  usageDateKey: string,
): Promise<void> {
  await db
    .update(aiUsage)
    .set({ requestCount: sql`MAX(0, ${aiUsage.requestCount} - 1)` })
    .where(eq(aiUsage.usageDate, usageDateKey));
}
