import { clueRateLimits } from "@shared/schema";
import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import type { AppGraphQLContext } from "./types";

export const CLUE_RATE_LIMIT_WINDOW_MS = 60_000;
export const CLUE_RATE_LIMIT_MAX_REQUESTS = 3;

export type ClueRateLimitClaim = {
  claimed: boolean;
  retryAfterMs: number | null;
};

export function computeRetryAfterMs(
  oldestRequestedAt: Date,
  nowMs: number,
  windowMs: number = CLUE_RATE_LIMIT_WINDOW_MS,
): number {
  return Math.max(0, oldestRequestedAt.getTime() + windowMs - nowMs);
}

/**
 * Atomically claims one of the session's rolling clue-request slots,
 * reserving it for a specific attempt.
 *
 * The claim is a count-guarded conditional insert with a per-attempt
 * reservation:
 *   INSERT INTO clue_rate_limits (id, session_progress_id, gate_id,
 *                                 attempt_count_at_request, requested_at)
 *   SELECT <uuid>, <sessionProgressId>, <gateId>, <attemptCountAtRequest>, <nowMs>
 *   WHERE (SELECT COUNT(*) FROM clue_rate_limits
 *          WHERE session_progress_id = <sessionProgressId>
 *            AND requested_at > <cutoffMs>) < CLUE_RATE_LIMIT_MAX_REQUESTS
 *     AND NOT EXISTS (SELECT 1 FROM clue_rate_limits
 *          WHERE session_progress_id = <sessionProgressId>
 *            AND gate_id = <gateId>
 *            AND attempt_count_at_request = <attemptCountAtRequest>
 *            AND requested_at > <cutoffMs>)
 *   RETURNING id
 *
 * The NOT EXISTS arm is the per-attempt reservation (#221): within a window,
 * only one claim may exist per (session, gate, attempt) — the same key as
 * `unique_clue_per_attempt` on gate_clues. Three concurrent requests at the
 * same (gate, attemptCount) therefore win at most one slot — the rest are
 * rejected before any AI spend, instead of each calling generateClue and
 * only one surviving the `unique_clue_per_attempt` insert. The gateId is
 * part of the key because `attempt_count` resets on gate advance: keying by
 * attempt alone would falsely block a later gate that reaches the same
 * attempt number within the window.
 *
 * Drizzle 0.45.2 has no standalone `.where()` on insert; the `.select()`
 * builder form emits `INSERT ... SELECT ... WHERE ...`. SQLite serializes
 * writes, and the D1 write path is serialized too, so two concurrent
 * requests cannot both win the last slot — exactly one AI call runs per slot.
 *
 * Timestamps are stored as raw milliseconds (`mode: "timestamp_ms"`), so the
 * guard compares exact `Date.now()` values and the rolling window is precise
 * to the millisecond (no second-flooring drift).
 *
 * Expired rows are pruned globally (all sessions) in the same `db.batch`,
 * served by the `requested_at` index, so abandoned sessions cannot leak rows
 * forever. On the rejection path `retryAfterMs` is read advisory: from the
 * attempt's own reservation row when that is what blocked the claim, else
 * from the oldest in-window row, else the full window (a prune raced the
 * claim).
 */
export async function claimClueRateLimit(
  db: AppGraphQLContext["var"]["db"],
  sessionProgressId: string,
  gateId: string,
  attemptCountAtRequest: number,
): Promise<ClueRateLimitClaim> {
  const nowMs = Date.now();
  const cutoffMs = nowMs - CLUE_RATE_LIMIT_WINDOW_MS;

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
            gateId: sql`${gateId}`.as("gate_id"),
            attemptCountAtRequest: sql`${attemptCountAtRequest}`.as(
              "attempt_count_at_request",
            ),
            requestedAt: sql`${nowMs}`.as("requested_at"),
          })
          .from(sql`(select 1)`)
          .where(
            sql`(
              SELECT COUNT(*) FROM clue_rate_limits
              WHERE session_progress_id = ${sessionProgressId}
                AND requested_at > ${cutoffMs}
            ) < ${CLUE_RATE_LIMIT_MAX_REQUESTS}
            AND NOT EXISTS (
              SELECT 1 FROM clue_rate_limits
              WHERE session_progress_id = ${sessionProgressId}
                AND gate_id = ${gateId}
                AND attempt_count_at_request = ${attemptCountAtRequest}
                AND requested_at > ${cutoffMs}
            )`,
          ),
      )
      .returning({ id: clueRateLimits.id }),
    db
      .delete(clueRateLimits)
      .where(lt(clueRateLimits.requestedAt, new Date(cutoffMs))),
  ]);

  if (claimed.length > 0) {
    return { claimed: true, retryAfterMs: null };
  }

  // Rejection path: prefer the reservation row for this attempt — that is
  // what a retry at the same attempt is blocked on. Its expiry (not the
  // oldest in-window row's) is the honest cooldown for this request.
  const attemptReservation = await db
    .select({ requestedAt: clueRateLimits.requestedAt })
    .from(clueRateLimits)
    .where(
      and(
        eq(clueRateLimits.sessionProgressId, sessionProgressId),
        eq(clueRateLimits.gateId, gateId),
        eq(clueRateLimits.attemptCountAtRequest, attemptCountAtRequest),
        gte(clueRateLimits.requestedAt, new Date(cutoffMs)),
      ),
    )
    .orderBy(asc(clueRateLimits.requestedAt))
    .limit(1);

  if (attemptReservation.length > 0) {
    return {
      claimed: false,
      retryAfterMs: computeRetryAfterMs(
        attemptReservation[0].requestedAt,
        Date.now(),
      ),
    };
  }

  const oldest = await db
    .select({ requestedAt: clueRateLimits.requestedAt })
    .from(clueRateLimits)
    .where(
      and(
        eq(clueRateLimits.sessionProgressId, sessionProgressId),
        gte(clueRateLimits.requestedAt, new Date(cutoffMs)),
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
