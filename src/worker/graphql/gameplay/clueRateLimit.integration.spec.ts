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
): Promise<void> {
  await db.insert(clueRateLimits).values({
    sessionProgressId: progressId,
    requestedAt,
  });
}

function claim(progressId: string): Promise<ClueRateLimitClaim> {
  return claimClueRateLimit(db as never, progressId);
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

  it("claims up to the cap within the window, then rejects", async () => {
    const progressId = await insertProgress(makeSessionId("at-cap"));
    for (let i = 0; i < CLUE_RATE_LIMIT_MAX_REQUESTS; i++) {
      const result = await claim(progressId);
      expect(result.claimed).toBe(true);
    }
    const rejected = await claim(progressId);
    expect(rejected.claimed).toBe(false);
    expect(rejected.retryAfterMs).toBeGreaterThan(0);
    expect(rejected.retryAfterMs).toBeLessThanOrEqual(
      CLUE_RATE_LIMIT_WINDOW_MS,
    );
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

  it("rejects when pre-seeded at cap and reports retryAfterMs from the oldest row", async () => {
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
