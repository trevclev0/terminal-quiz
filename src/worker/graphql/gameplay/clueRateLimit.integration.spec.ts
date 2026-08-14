import { env } from "cloudflare:workers";
import { clueRateLimits, sessionProgress } from "@shared/schema";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  CLUE_RATE_LIMIT_MAX_REQUESTS,
  CLUE_RATE_LIMIT_WINDOW_MS,
  type ClueRateLimitClaim,
  claimClueRateLimit,
} from "./clueRateLimit";

const db = drizzle(env.DB);

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";
const E2E_GATE_2_ID = "e2e00002-0000-0000-0000-000000000002";

function makeSessionId(label: string): string {
  return `rate-limit-${label}-${crypto.randomUUID()}`;
}

async function insertProgress(sessionId: string): Promise<string> {
  const [progress] = await db
    .insert(sessionProgress)
    .values({
      sessionId,
      programId: E2E_PROGRAM_ID,
      currentGateId: E2E_GATE_1_ID,
      status: "in_progress",
    })
    .returning({ id: sessionProgress.id });
  return progress.id;
}

async function insertRateRow(
  progressId: string,
  requestedAt: Date,
  gateId = E2E_GATE_1_ID,
  attemptCountAtRequest?: number,
): Promise<void> {
  await db.insert(clueRateLimits).values({
    sessionProgressId: progressId,
    gateId,
    attemptCountAtRequest: attemptCountAtRequest ?? null,
    requestedAt,
  });
}

function claim(
  progressId: string,
  gateId = E2E_GATE_1_ID,
  attemptCountAtRequest = 1,
): Promise<ClueRateLimitClaim> {
  return claimClueRateLimit(
    db as never,
    progressId,
    gateId,
    attemptCountAtRequest,
  );
}

describe("claimClueRateLimit", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
  });

  it("claims a slot when under the cap", async () => {
    const progressId = await insertProgress(makeSessionId("under-cap"));
    const result = await claim(progressId);
    expect(result.claimed).toBe(true);
    expect(result.retryAfterMs).toBeNull();
  });

  it("claims up to the cap across distinct attempts within the window, then rejects", async () => {
    const progressId = await insertProgress(makeSessionId("at-cap"));
    for (let i = 1; i <= CLUE_RATE_LIMIT_MAX_REQUESTS; i++) {
      const result = await claim(progressId, E2E_GATE_1_ID, i);
      expect(result.claimed).toBe(true);
    }
    const rejected = await claim(
      progressId,
      E2E_GATE_1_ID,
      CLUE_RATE_LIMIT_MAX_REQUESTS + 1,
    );
    expect(rejected.claimed).toBe(false);
    expect(rejected.retryAfterMs).toBeGreaterThan(0);
    expect(rejected.retryAfterMs).toBeLessThanOrEqual(
      CLUE_RATE_LIMIT_WINDOW_MS,
    );
  });

  it("rejects a second claim for the same attempt within the window", async () => {
    const progressId = await insertProgress(makeSessionId("same-attempt"));
    const first = await claim(progressId, E2E_GATE_1_ID, 3);
    expect(first.claimed).toBe(true);
    const second = await claim(progressId, E2E_GATE_1_ID, 3);
    expect(second.claimed).toBe(false);
    expect(second.retryAfterMs).toBeGreaterThan(0);
    expect(second.retryAfterMs).toBeLessThanOrEqual(CLUE_RATE_LIMIT_WINDOW_MS);
  });

  it("allows the same attempt on a different gate within the window", async () => {
    // attemptCount resets on gate advance, so the reservation key must be
    // (session, gate, attempt): a later gate at the same attempt number must
    // not be blocked by an earlier gate's reservation.
    const progressId = await insertProgress(makeSessionId("cross-gate"));
    const first = await claim(progressId, E2E_GATE_1_ID, 2);
    expect(first.claimed).toBe(true);
    const second = await claim(progressId, E2E_GATE_2_ID, 2);
    expect(second.claimed).toBe(true);
  });

  it("allows distinct attempts within the same window", async () => {
    const progressId = await insertProgress(makeSessionId("distinct-attempts"));
    for (const attempt of [1, 2, 3]) {
      const result = await claim(progressId, E2E_GATE_1_ID, attempt);
      expect(result.claimed).toBe(true);
    }
    // Cap reached: a 4th distinct attempt is rejected by the count guard,
    // not the per-attempt reservation.
    const rejected = await claim(progressId, E2E_GATE_1_ID, 4);
    expect(rejected.claimed).toBe(false);
  });

  it("releases the per-attempt reservation once the attempt's row ages out", async () => {
    const progressId = await insertProgress(
      makeSessionId("reservation-expired"),
    );
    const expiredAt = new Date(Date.now() - CLUE_RATE_LIMIT_WINDOW_MS - 1_000);
    await insertRateRow(progressId, expiredAt, E2E_GATE_1_ID, 3);
    const result = await claim(progressId, E2E_GATE_1_ID, 3);
    expect(result.claimed).toBe(true);
  });

  it("does not block a claim when the attempt's row is exactly at the boundary", async () => {
    const progressId = await insertProgress(makeSessionId("attempt-boundary"));
    const now = Date.now();
    const atBoundary = new Date(now - CLUE_RATE_LIMIT_WINDOW_MS);
    await insertRateRow(progressId, atBoundary, E2E_GATE_1_ID, 3);
    const result = await claim(progressId, E2E_GATE_1_ID, 3);
    expect(result.claimed).toBe(true);
  });

  it("retryAfterMs for a per-attempt rejection comes from the attempt's own row", async () => {
    const progressId = await insertProgress(
      makeSessionId("attempt-retryafter"),
    );
    const now = Date.now();
    // Older attempt-1 row — from the oldest in-window row this would report
    // ~10s. The blocking attempt-2 row's expiry (~55s) is the honest cooldown.
    await insertRateRow(progressId, new Date(now - 50_000), E2E_GATE_1_ID, 1);
    await insertRateRow(progressId, new Date(now - 5_000), E2E_GATE_1_ID, 2);
    const rejected = await claim(progressId, E2E_GATE_1_ID, 2);
    expect(rejected.claimed).toBe(false);
    expect(rejected.retryAfterMs).toBeGreaterThan(54_000);
    expect(rejected.retryAfterMs).toBeLessThanOrEqual(55_000);
  });

  it("allows claims again once rows age out of the window", async () => {
    const progressId = await insertProgress(makeSessionId("expired"));
    // Rows older than the window — they should not count against the cap
    const expiredAt = new Date(Date.now() - CLUE_RATE_LIMIT_WINDOW_MS - 1_000);
    for (let i = 0; i < CLUE_RATE_LIMIT_MAX_REQUESTS; i++) {
      await insertRateRow(progressId, expiredAt);
    }
    const result = await claim(progressId);
    expect(result.claimed).toBe(true);
  });

  it("releases the cap exactly when rows hit the window boundary", async () => {
    const progressId = await insertProgress(makeSessionId("boundary-edge"));
    const now = Date.now();
    // requested_at exactly at cutoff: the strict `> cutoff` guard must
    // exclude it. The timestamp_ms fix makes this boundary exact to the
    // millisecond — under second-flooring the row could expire up to 999ms
    // early.
    const atBoundary = new Date(now - CLUE_RATE_LIMIT_WINDOW_MS);
    for (let i = 0; i < CLUE_RATE_LIMIT_MAX_REQUESTS; i++) {
      await insertRateRow(progressId, atBoundary);
    }
    const result = await claim(progressId);
    expect(result.claimed).toBe(true);
  });

  it("blocks a claim just inside window (precise retryAfterMs)", async () => {
    const progressId = await insertProgress(makeSessionId("boundary-inside"));
    const now = Date.now();
    // 1s inside the 60s window (59,000ms old). A razor-edge 59,999ms seed
    // is untestable against a real clock — scheduling delay ages it out —
    // so use a 1s margin and assert the ms precision via retryAfterMs.
    const oneSecondInside = new Date(now - CLUE_RATE_LIMIT_WINDOW_MS + 1_000);
    for (let i = 0; i < CLUE_RATE_LIMIT_MAX_REQUESTS; i++) {
      await insertRateRow(progressId, oneSecondInside);
    }
    const rejected = await claim(progressId);
    expect(rejected.claimed).toBe(false);
    // oldest + window is ~1s out from now, precise to the millisecond
    expect(rejected.retryAfterMs).toBeGreaterThan(0);
    expect(rejected.retryAfterMs).toBeLessThanOrEqual(1_000);
  });

  it("rejects when pre-seeded at cap, retryAfterMs from oldest", async () => {
    const progressId = await insertProgress(makeSessionId("seeded-cap"));
    const now = Date.now();
    const oldest = new Date(now - 10_000); // 10s ago, expires in 50s
    await insertRateRow(progressId, oldest);
    for (let i = 1; i < CLUE_RATE_LIMIT_MAX_REQUESTS; i++) {
      await insertRateRow(progressId, new Date(now - i * 1_000));
    }
    const rejected = await claim(progressId);
    expect(rejected.claimed).toBe(false);
    // oldest + window is ~50s out from now
    expect(rejected.retryAfterMs).toBeGreaterThan(49_000);
    expect(rejected.retryAfterMs).toBeLessThanOrEqual(50_000);
  });

  it("prunes expired rows for the session on claim", async () => {
    const progressId = await insertProgress(makeSessionId("prune"));
    await insertRateRow(
      progressId,
      new Date(Date.now() - CLUE_RATE_LIMIT_WINDOW_MS - 5_000),
    );

    const countBefore = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM clue_rate_limits WHERE session_progress_id = ?`,
    )
      .bind(progressId)
      .first<{ cnt: number }>();
    expect(countBefore?.cnt).toBe(1);

    await claim(progressId);

    const countAfter = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM clue_rate_limits WHERE session_progress_id = ?`,
    )
      .bind(progressId)
      .first<{ cnt: number }>();
    // The expired row is pruned; only the fresh claim remains
    expect(countAfter?.cnt).toBe(1);
  });
});
