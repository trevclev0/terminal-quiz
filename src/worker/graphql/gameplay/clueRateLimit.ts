import { clueRateLimits } from "@shared/schema";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import type { AppGraphQLContext } from "./types";

export const CLUE_RATE_LIMIT_WINDOW_MS = 60_000;
export const CLUE_RATE_LIMIT_MAX_REQUESTS = 3;

export type ClueRateLimitClaim = {
  claimed: boolean;
  retryAfterMs: number | null;
};

// `clue_rate_limits.requested_at` is stored as unix seconds (drizzle sqlite
// `mode: "timestamp"` maps Date <-> seconds), so every timestamp in the raw
// SQL below is converted to seconds to keep comparisons in one unit.
function toUnixSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}

export function computeRetryAfterMs(
  oldestRequestedAt: Date,
  nowMs: number,
  windowMs: number = CLUE_RATE_LIMIT_WINDOW_MS,
): number {
  return Math.max(0, oldestRequestedAt.getTime() + windowMs - nowMs);
}

/**
 * Atomically claims one of the session's rolling clue-request slots.
 *
 * The claim is a count-guarded conditional insert:
 *   INSERT INTO clue_rate_limits (id, session_progress_id, requested_at)
 *   SELECT <uuid>, <sessionProgressId>, <nowSeconds>
 *   WHERE (SELECT COUNT(*) FROM clue_rate_limits
 *          WHERE session_progress_id = <sessionProgressId>
 *            AND requested_at > <cutoffSeconds>) < CLUE_RATE_LIMIT_MAX_REQUESTS
 *   RETURNING id
 *
 * Drizzle 0.45.2 has no standalone `.where()` on insert; the `.select()`
 * builder form emits `INSERT ... SELECT ... WHERE ...`. SQLite serializes
 * writes, and the D1 write path is serialized too, so two concurrent
 * requests cannot both win the last slot — exactly one AI call runs per slot.
 *
 * Expired rows are pruned for the session in the same `db.batch`, so the
 * table cannot grow unbounded. `retryAfterMs` is computed from the oldest
 * in-window row, read only on the rejection path.
 */
export async function claimClueRateLimit(
  db: AppGraphQLContext["var"]["db"],
  sessionProgressId: string,
): Promise<ClueRateLimitClaim> {
  const nowMs = Date.now();
  const cutoffSeconds = toUnixSeconds(nowMs - CLUE_RATE_LIMIT_WINDOW_MS);
  const nowSeconds = toUnixSeconds(nowMs);

  const [claimed] = await db.batch([
    db
      .insert(clueRateLimits)
      .select((qb) =>
        qb
          .select({
            id: sql`${crypto.randomUUID()}`.as("id"),
            sessionProgressId: sql`${sessionProgressId}`.as(
              "session_progress_id",
            ),
            requestedAt: sql`${nowSeconds}`.as("requested_at"),
          })
          .from(sql`(select 1)`)
          .where(
            sql`(
              SELECT COUNT(*) FROM clue_rate_limits
              WHERE session_progress_id = ${sessionProgressId}
                AND requested_at > ${cutoffSeconds}
            ) < ${CLUE_RATE_LIMIT_MAX_REQUESTS}`,
          ),
      )
      .returning({ id: clueRateLimits.id }),
    db
      .delete(clueRateLimits)
      .where(
        and(
          eq(clueRateLimits.sessionProgressId, sessionProgressId),
          lt(clueRateLimits.requestedAt, new Date(cutoffSeconds * 1000)),
        ),
      ),
  ]);

  if (claimed.length > 0) {
    return { claimed: true, retryAfterMs: null };
  }

  const oldest = await db
    .select({ requestedAt: clueRateLimits.requestedAt })
    .from(clueRateLimits)
    .where(
      and(
        eq(clueRateLimits.sessionProgressId, sessionProgressId),
        gte(clueRateLimits.requestedAt, new Date(cutoffSeconds * 1000)),
      ),
    )
    .orderBy(asc(clueRateLimits.requestedAt))
    .limit(1);

  if (oldest.length === 0) {
    // No in-window rows but the claim was rejected — a prune raced the
    // claim. Fall back to the full window rather than a bogus retryAfter.
    return { claimed: false, retryAfterMs: CLUE_RATE_LIMIT_WINDOW_MS };
  }

  return {
    claimed: false,
    retryAfterMs: computeRetryAfterMs(oldest[0].requestedAt, Date.now()),
  };
}
