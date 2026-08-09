import { env } from "cloudflare:workers";
import { REQUEST_CLUE_MUTATION } from "@shared/gqlQueries";
import { clueRateLimits, gateClues, sessionProgress } from "@shared/schema";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { type GqlResponse, gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Module-level mock — replaces generateClue in the workerd import graph
vi.mock("@worker-services/aiService", () => ({
  generateClue: vi.fn().mockResolvedValue("mock clue from vi.mock"),
}));

import { generateClue } from "@worker-services/aiService";

const db = drizzle(env.DB);

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";
const E2E_GATE_2_ID = "e2e00002-0000-0000-0000-000000000002";

function makeSessionId(label: string): string {
  return `request-clue-${label}-${crypto.randomUUID()}`;
}

/** Insert a fresh session_progress row for the E2E program. */
async function insertSession(
  sessionId: string,
  gateId: string | null,
  overrides: { attemptCount?: number } = {},
): Promise<string> {
  const [progress] = await db
    .insert(sessionProgress)
    .values({
      sessionId,
      programId: E2E_PROGRAM_ID,
      currentGateId: gateId,
      status: "in_progress",
      attemptCount: overrides.attemptCount ?? 0,
    })
    .returning({ id: sessionProgress.id });
  return progress.id;
}

/** Insert a gate_clues row for a session_progress + gate combination. */
async function insertClue(
  progressId: string,
  attemptCountAtRequest: number,
): Promise<void> {
  await db.insert(gateClues).values({
    sessionProgressId: progressId,
    gateId: E2E_GATE_1_ID,
    clueText: "test clue text",
    attemptCountAtRequest,
  });
}

interface RequestClueData {
  requestClue: {
    clueText: string | null;
    isClueLimitReached: boolean;
    cluesRemaining: number;
    isRateLimited: boolean;
    retryAfterMs: number | null;
  };
}

/** Insert a rate-limit history row at an absolute time (unix ms). */
async function insertRateRow(
  progressId: string,
  requestedAtMs: number,
): Promise<void> {
  await db.insert(clueRateLimits).values({
    sessionProgressId: progressId,
    requestedAt: new Date(requestedAtMs),
  });
}

describe("requestClue mutation", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
    vi.mocked(generateClue).mockReset();
    vi.mocked(generateClue).mockResolvedValue("mock clue from vi.mock");
  });

  it("returns clue text when eligible", async () => {
    // Gate 1: guidanceEnabled=true, guidanceThreshold=2
    // Set attemptCount=2 to meet threshold
    const sessionId = makeSessionId("eligible");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID, {
      attemptCount: 2,
    });

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as RequestClueData;
    expect(data.requestClue.clueText).toBe("mock clue from vi.mock");
    expect(data.requestClue.isClueLimitReached).toBe(false);
    expect(data.requestClue.cluesRemaining).toBe(2); // MAX=3, 1 used

    // Verify generateClue was called with correct args
    expect(vi.mocked(generateClue)).toHaveBeenCalledTimes(1);

    // Verify a gate_clues row was inserted
    const clueRow = await env.DB.prepare(
      `SELECT clue_text, attempt_count_at_request FROM gate_clues WHERE session_progress_id = ? AND gate_id = ?`,
    )
      .bind(progressId, E2E_GATE_1_ID)
      .first<{ clue_text: string; attempt_count_at_request: number }>();
    expect(clueRow?.clue_text).toBe("mock clue from vi.mock");
    expect(clueRow?.attempt_count_at_request).toBe(2);
  });

  it("not eligible when attemptCount below threshold", async () => {
    // attemptCount=0 < guidanceThreshold=2
    const sessionId = makeSessionId("below-threshold");
    await insertSession(sessionId, E2E_GATE_1_ID, { attemptCount: 0 });

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as RequestClueData;
    expect(data.requestClue.clueText).toBeNull();
    expect(data.requestClue.isClueLimitReached).toBe(false);
    expect(data.requestClue.cluesRemaining).toBe(3);

    // AI should NOT have been called
    expect(vi.mocked(generateClue)).not.toHaveBeenCalled();
  });

  it("not eligible when guidance is disabled", async () => {
    // Gate 2: guidanceEnabled=0 → computeCanRequestClue returns false
    // regardless of attempt count
    const sessionId = makeSessionId("guidance-disabled");
    await insertSession(sessionId, E2E_GATE_2_ID, { attemptCount: 3 });

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_2_ID,
        currentGuess: "5",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as RequestClueData;
    expect(data.requestClue.clueText).toBeNull();
    expect(data.requestClue.isClueLimitReached).toBe(false);
    expect(data.requestClue.cluesRemaining).toBe(3);

    expect(vi.mocked(generateClue)).not.toHaveBeenCalled();
  });

  it("clue cap reached: isClueLimitReached=true when 3 clues exist", async () => {
    const sessionId = makeSessionId("clue-cap");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID, {
      attemptCount: 2,
    });

    // Seed MAX_CLUES_PER_GATE=3 existing clues
    for (let i = 0; i < 3; i++) {
      await insertClue(progressId, i + 1);
    }

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as RequestClueData;
    expect(data.requestClue.clueText).toBeNull();
    expect(data.requestClue.isClueLimitReached).toBe(true);
    expect(data.requestClue.cluesRemaining).toBe(0);

    expect(vi.mocked(generateClue)).not.toHaveBeenCalled();
  });

  it("duplicate attempt: cluesRemaining idle when same attempt already has a clue", async () => {
    // Seed a clue at attemptCountAtRequest=2 — same as session's current attemptCount
    const sessionId = makeSessionId("duplicate-attempt");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID, {
      attemptCount: 2,
    });
    await insertClue(progressId, 2);

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as RequestClueData;
    expect(data.requestClue.clueText).toBeNull();
    expect(data.requestClue.isClueLimitReached).toBe(false);
    expect(data.requestClue.cluesRemaining).toBe(2); // 3 total, 1 used

    expect(vi.mocked(generateClue)).not.toHaveBeenCalled();
  });

  it("desync: clue for wrong gate is rejected", async () => {
    const sessionId = makeSessionId("desync");
    await insertSession(sessionId, E2E_GATE_1_ID, { attemptCount: 2 });

    // Session at Gate 1 — request clue for Gate 2
    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_2_ID,
        currentGuess: "5",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors?.[0].message).toBe(
      "Desync: Clue requested for the wrong active gate.",
    );

    expect(vi.mocked(generateClue)).not.toHaveBeenCalled();
  });

  it("no session progress rejects clue request", async () => {
    const sessionId = makeSessionId("no-progress");

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors?.[0].message).toBe(
      "Invalid state: Program already completed or not started.",
    );
  });

  it("AI returning null is handled gracefully", async () => {
    vi.mocked(generateClue).mockResolvedValue(null);

    const sessionId = makeSessionId("ai-null");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID, {
      attemptCount: 2,
    });

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as RequestClueData;
    expect(data.requestClue.clueText).toBeNull();
    expect(data.requestClue.isClueLimitReached).toBe(false);
    expect(data.requestClue.cluesRemaining).toBe(3);

    expect(vi.mocked(generateClue)).toHaveBeenCalledTimes(1);

    // Verify no clue row was inserted
    const clueCount = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM gate_clues WHERE session_progress_id = ?`,
    )
      .bind(progressId)
      .first<{ cnt: number }>();
    expect(clueCount?.cnt).toBe(0);
  });

  it("rate limit: in-window cap rejects with retryAfterMs", async () => {
    const sessionId = makeSessionId("rate-limited");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID, {
      attemptCount: 2,
    });

    // Seed 3 in-window rate-limit rows → session at cap
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      await insertRateRow(progressId, now - i * 1_000);
    }

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as RequestClueData;
    expect(data.requestClue.clueText).toBeNull();
    expect(data.requestClue.isClueLimitReached).toBe(false);
    expect(data.requestClue.cluesRemaining).toBe(3);
    expect(data.requestClue.isRateLimited).toBe(true);
    // Oldest seeded row is ~3s ago → ~57s remain in the window
    expect(data.requestClue.retryAfterMs).toBeGreaterThan(55_000);
    expect(data.requestClue.retryAfterMs).toBeLessThanOrEqual(60_000);

    // No AI call, no clue row
    expect(vi.mocked(generateClue)).not.toHaveBeenCalled();
    const clueCount = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM gate_clues WHERE session_progress_id = ?`,
    )
      .bind(progressId)
      .first<{ cnt: number }>();
    expect(clueCount?.cnt).toBe(0);
  });

  it("rate limit: expired rows do not count against the window", async () => {
    const sessionId = makeSessionId("rate-expired");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID, {
      attemptCount: 2,
    });

    // Seed 3 rows all older than the 60s window
    const old = Date.now() - 60_001;
    for (let i = 0; i < 3; i++) {
      await insertRateRow(progressId, old);
    }

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as RequestClueData;
    expect(data.requestClue.clueText).toBe("mock clue from vi.mock");
    expect(data.requestClue.isRateLimited).toBe(false);
    expect(data.requestClue.retryAfterMs).toBeNull();
    expect(vi.mocked(generateClue)).toHaveBeenCalledTimes(1);
  });

  it("rate limit: per-gate clue cap is distinct from rate limiting", async () => {
    // MAX_CLUES_PER_GATE = 3 equals the rate cap, so the 4th request is
    // stopped by computeCanRequestClue BEFORE the rate limiter runs.
    const sessionId = makeSessionId("rate-clue-cap-distinct");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID, {
      attemptCount: 2,
    });

    // Seed MAX_CLUES_PER_GATE=3 clues (no rate-limit rows)
    for (let i = 0; i < 3; i++) {
      await insertClue(progressId, i + 1);
    }

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as RequestClueData;
    expect(data.requestClue.isClueLimitReached).toBe(true);
    expect(data.requestClue.isRateLimited).toBe(false);
    expect(data.requestClue.retryAfterMs).toBeNull();
    expect(vi.mocked(generateClue)).not.toHaveBeenCalled();
  });
});
