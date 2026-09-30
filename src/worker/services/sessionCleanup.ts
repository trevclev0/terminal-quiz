import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "@shared/schema";
import { sessionProgress } from "@shared/schema";
import { inArray, lt } from "drizzle-orm";
import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";

export const DEFAULT_SESSION_RETENTION_DAYS = 30;

// Bounded so one run stays well inside D1's per-invocation query limit (50
// on the Workers Free plan) and never spends a burst of the rows-written
// budget gameplay needs: each session also cascades its completed-gate,
// clue and rate-limit rows. The cron runs hourly, so the ceiling is 48,000
// sessions a day, well above any plausible rate of new stale sessions; a
// backlog (such as the first run's) drains over the following hours.
export const SESSION_CLEANUP_BATCH_SIZE = 200;
export const SESSION_CLEANUP_MAX_BATCHES = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

export function getSessionRetentionDays(raw: string | undefined): number {
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : DEFAULT_SESSION_RETENTION_DAYS;
}

export type SessionCleanupResult = {
  deleted: number;
  batches: number;
  /** True when the batch cap stopped the run with stale rows likely left. */
  hitBatchCap: boolean;
};

/**
 * Deletes `session_progress` rows with no activity since `cutoff` (#315).
 * `updated_at` moves on every guess and reset, so a session is stale once
 * nobody has played it for the retention window. `ON DELETE CASCADE`
 * removes its `session_completed_gates`, `gate_clues` and
 * `clue_rate_limits` rows.
 *
 * Every cookie-less visit to a program mints a session, so this table grows
 * with traffic rather than with real players; it was the one table with no
 * TTL.
 */
export async function pruneStaleSessions(
  db: DrizzleD1Database<typeof schema>,
  cutoff: Date,
  batchSize = SESSION_CLEANUP_BATCH_SIZE,
  maxBatches = SESSION_CLEANUP_MAX_BATCHES,
): Promise<SessionCleanupResult> {
  let deleted = 0;
  let batches = 0;

  while (batches < maxBatches) {
    // Stock SQLite has no DELETE ... LIMIT (it is a compile-time option), so
    // each batch is picked by a limited subquery instead.
    const stale = db
      .select({ id: sessionProgress.id })
      .from(sessionProgress)
      .where(lt(sessionProgress.updatedAt, cutoff))
      .limit(batchSize);
    const rows = await db
      .delete(sessionProgress)
      .where(inArray(sessionProgress.id, stale))
      .returning({ id: sessionProgress.id });

    batches++;
    deleted += rows.length;
    if (rows.length < batchSize) {
      return { deleted, batches, hitBatchCap: false };
    }
  }

  return { deleted, batches, hitBatchCap: true };
}

type CleanupEnv = {
  DB: D1Database;
  SESSION_RETENTION_DAYS?: string;
};

/**
 * Cron entry point: prunes stale sessions and writes one structured log
 * line per run, in the same JSON shape as the request logger, so Workers
 * Logs can report rows deleted over time.
 */
export async function runSessionCleanup(
  env: CleanupEnv,
  scheduledTime: number,
): Promise<SessionCleanupResult> {
  const start = performance.now();
  const retentionDays = getSessionRetentionDays(env.SESSION_RETENTION_DAYS);
  const cutoff = new Date(scheduledTime - retentionDays * DAY_MS);

  try {
    const result = await pruneStaleSessions(
      drizzle(env.DB, { schema }),
      cutoff,
    );
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "info",
        event: "session_cleanup",
        retentionDays,
        cutoff: cutoff.toISOString(),
        ...result,
        durationMs: Math.round(performance.now() - start),
      }),
    );
    return result;
  } catch (error) {
    console.error(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: "error",
        event: "session_cleanup",
        retentionDays,
        cutoff: cutoff.toISOString(),
        message: error instanceof Error ? error.message : String(error),
        durationMs: Math.round(performance.now() - start),
      }),
    );
    // Rethrow so the cron invocation is marked failed in the dashboard.
    throw error;
  }
}
