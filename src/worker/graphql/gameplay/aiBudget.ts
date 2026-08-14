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

export async function isAiBudgetExceeded(
  db: AppGraphQLContext["var"]["db"],
  usageDateKey: string,
  budget: number,
): Promise<boolean> {
  const [row] = await db
    .select({ requestCount: aiUsage.requestCount })
    .from(aiUsage)
    .where(eq(aiUsage.usageDate, usageDateKey));
  return row !== undefined && row.requestCount >= budget;
}

export async function recordAiUsage(
  db: AppGraphQLContext["var"]["db"],
  usageDateKey: string,
): Promise<void> {
  await db
    .insert(aiUsage)
    .values({ usageDate: usageDateKey, requestCount: 1 })
    .onConflictDoUpdate({
      target: aiUsage.usageDate,
      set: { requestCount: sql`${aiUsage.requestCount} + 1` },
    });
}
