import { env } from "cloudflare:workers";
import {
  GET_PROGRAM_PROGRESSION_QUERY,
  REQUEST_CLUE_MUTATION,
  RESET_SESSION_MUTATION,
  SUBMIT_GUESS_MUTATION,
} from "@shared/gqlQueries";
import { aiUsage, gateClues, sessionProgress } from "@shared/schema";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import type { ClueResult } from "@worker-services/aiService";
import { gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getUsageDateKey } from "./aiBudget";

// Module-level mock — never spend real Workers AI neurons in tests
vi.mock("@worker-services/aiService", () => ({
  generateClue: vi.fn().mockResolvedValue({
    clueText: "mock clue from vi.mock",
    reason: "success",
    latencyMs: 0,
  }),
}));

import { generateClue } from "@worker-services/aiService";

const db = drizzle(env.DB);

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";
const E2E_GATE_2_ID = "e2e00002-0000-0000-0000-000000000002";
const E2E_GATE_3_ID = "e2e00003-0000-0000-0000-000000000003";

// Correct answers in seedE2eData, in gate order.
const RUN: [string, string][] = [
  [E2E_GATE_1_ID, "blue"],
  [E2E_GATE_2_ID, "4"],
  [E2E_GATE_3_ID, "cold"],
];

function makeSessionId(label: string): string {
  return `run-stats-${label}-${crypto.randomUUID()}`;
}

interface Stats {
  totalGuesses: number | null;
  cluesUsed: number;
  elapsedSeconds: number | null;
}

async function fetchStats(sessionId: string): Promise<Stats | null> {
  const response = await gqlRequest(GET_PROGRAM_PROGRESSION_QUERY, {
    sessionId,
    variables: { programId: E2E_PROGRAM_ID },
  });
  expect(response.body.errors).toBeUndefined();
  const data = response.body.data as {
    getProgramProgression: { stats: Stats | null };
  };
  return data.getProgramProgression.stats;
}

async function guess(
  sessionId: string,
  gateId: string,
  text: string,
): Promise<void> {
  const response = await gqlRequest(SUBMIT_GUESS_MUTATION, {
    sessionId,
    variables: { programId: E2E_PROGRAM_ID, gateId, guess: text },
  });
  expect(response.body.errors).toBeUndefined();
}

async function playThrough(sessionId: string): Promise<void> {
  for (const [gateId, answer] of RUN) {
    await guess(sessionId, gateId, answer);
  }
}

async function setRunStartedAt(sessionId: string, at: Date): Promise<void> {
  await db
    .update(sessionProgress)
    .set({ runStartedAt: at })
    .where(eq(sessionProgress.sessionId, sessionId));
}

describe("run stats on getProgramProgression", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    invalidateCachedSchema();
    vi.mocked(generateClue).mockReset();
    vi.mocked(generateClue).mockResolvedValue({
      clueText: "mock clue from vi.mock",
      reason: "success",
      latencyMs: 0,
    } satisfies ClueResult);
    // Fresh AI budget per test — the integration budget is tiny (3), so a
    // leftover count would refuse the clue.
    await db.delete(aiUsage).where(eq(aiUsage.usageDate, getUsageDateKey()));
  });

  it("reports guesses, clues and time for a completed multi-gate run", async () => {
    const sessionId = makeSessionId("multi-gate");
    expect(await fetchStats(sessionId)).toBeNull();
    await setRunStartedAt(sessionId, new Date(Date.now() - 125_000));

    // Gate 1: two wrong guesses reach the clue threshold (2)
    await guess(sessionId, E2E_GATE_1_ID, "red");
    await guess(sessionId, E2E_GATE_1_ID, "green");
    const clue = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "green",
      },
    });
    expect(clue.body.errors).toBeUndefined();
    await playThrough(sessionId);

    const stats = await fetchStats(sessionId);
    expect(stats?.totalGuesses).toBe(5);
    expect(stats?.cluesUsed).toBe(1);
    expect(stats?.elapsedSeconds).toBeGreaterThanOrEqual(125);
    expect(stats?.elapsedSeconds).toBeLessThan(135);
  });

  it("a replay reports only the second run", async () => {
    const sessionId = makeSessionId("replay");
    await fetchStats(sessionId);
    await guess(sessionId, E2E_GATE_1_ID, "red");
    await playThrough(sessionId);
    expect((await fetchStats(sessionId))?.totalGuesses).toBe(4);

    const reset = await gqlRequest(RESET_SESSION_MUTATION, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });
    expect(reset.body.errors).toBeUndefined();
    expect(await fetchStats(sessionId)).toBeNull();
    await playThrough(sessionId);

    const stats = await fetchStats(sessionId);
    expect(stats).toMatchObject({ totalGuesses: 3, cluesUsed: 0 });
    expect(stats?.elapsedSeconds).toBeLessThan(10);
  });

  it("is null while in progress", async () => {
    expect(await fetchStats(makeSessionId("in-progress"))).toBeNull();
  });

  it("is null for an in-progress run with no current gate", async () => {
    const sessionId = makeSessionId("no-gate");
    await db.insert(sessionProgress).values({
      sessionId,
      programId: E2E_PROGRAM_ID,
      currentGateId: null,
      status: "in_progress",
    });
    expect(await fetchStats(sessionId)).toBeNull();
  });

  it("untracked completed run hides guesses and time", async () => {
    const sessionId = makeSessionId("untracked");
    const [row] = await db
      .insert(sessionProgress)
      .values({
        sessionId,
        programId: E2E_PROGRAM_ID,
        currentGateId: null,
        status: "completed",
        totalGuesses: null,
        runStartedAt: new Date(Date.now() - 60_000),
        completedAt: new Date(),
      })
      .returning({ id: sessionProgress.id });
    await db.insert(gateClues).values({
      sessionProgressId: row.id,
      gateId: E2E_GATE_1_ID,
      clueText: "old clue",
      attemptCountAtRequest: 2,
    });

    expect(await fetchStats(sessionId)).toEqual({
      totalGuesses: null,
      cluesUsed: 1,
      elapsedSeconds: null,
    });
  });

  it("completion without a fetch after reset hides time", async () => {
    const sessionId = makeSessionId("no-fetch-after-reset");
    await fetchStats(sessionId);
    const reset = await gqlRequest(RESET_SESSION_MUTATION, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });
    expect(reset.body.errors).toBeUndefined();

    // No progression fetch between reset and completion, so run_started_at
    // is still NULL: the clock never started and must not be guessed at.
    await playThrough(sessionId);

    const stats = await fetchStats(sessionId);
    expect(stats?.elapsedSeconds).toBeNull();
    expect(stats?.totalGuesses).toBe(3);
  });
});
