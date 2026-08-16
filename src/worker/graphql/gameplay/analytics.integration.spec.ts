import { env, exports } from "cloudflare:workers";
import {
  GET_PROGRAM_PROGRESSION_QUERY,
  REQUEST_CLUE_MUTATION,
  RESET_SESSION_MUTATION,
  SUBMIT_GUESS_MUTATION,
} from "@shared/gqlQueries";
import { sessionCompletedGates, sessionProgress } from "@shared/schema";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { type GqlResponse, gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// Module-level mock — trackEvent is fire-and-forget with no read-back API,
// so integration specs assert the resolver emits the expected events.
vi.mock("@worker-graphql/gameplay/analytics", () => ({
  trackEvent: vi.fn(),
}));

// The test pool has no AI binding — mock a successful generation so the
// eligible clue path emits a "success" outcome.
vi.mock("@worker-services/aiService", () => ({
  generateClue: vi.fn().mockResolvedValue({
    clueText: "mock clue",
    reason: "success",
    latencyMs: 0,
  }),
}));

import { trackEvent } from "@worker-graphql/gameplay/analytics";

const db = drizzle(env.DB);

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";
const E2E_GATE_3_ID = "e2e00003-0000-0000-0000-000000000003";

function makeSessionId(label: string): string {
  return `analytics-${label}-${crypto.randomUUID()}`;
}

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

function emitted(name: string) {
  return vi.mocked(trackEvent).mock.calls.filter(([c, event]) => {
    void c;
    return event.name === name;
  });
}

describe("analytics event emission", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
    vi.mocked(trackEvent).mockClear();
  });

  it("emits program_started when a fresh session initializes progression", async () => {
    const sessionId = makeSessionId("started");
    const response: GqlResponse = await gqlRequest(
      GET_PROGRAM_PROGRESSION_QUERY,
      { sessionId, variables: { programId: E2E_PROGRAM_ID } },
    );

    expect(response.body.errors).toBeUndefined();
    const calls = emitted("program_started");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({
      name: "program_started",
      programId: E2E_PROGRAM_ID,
      gateId: E2E_GATE_1_ID,
      outcome: "fresh",
    });
  });

  it("does not re-emit program_started for an existing session", async () => {
    const sessionId = makeSessionId("already-started");
    await insertSession(sessionId, E2E_GATE_1_ID);

    await gqlRequest(GET_PROGRAM_PROGRESSION_QUERY, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    expect(emitted("program_started")).toHaveLength(0);
  });

  it("emits gate_attempt for an incorrect guess", async () => {
    const sessionId = makeSessionId("attempt");
    await insertSession(sessionId, E2E_GATE_1_ID);

    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "definitely-wrong",
      },
    });

    expect(response.body.errors).toBeUndefined();
    const calls = emitted("gate_attempt");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({
      name: "gate_attempt",
      programId: E2E_PROGRAM_ID,
      gateId: E2E_GATE_1_ID,
      outcome: "incorrect",
      attemptCount: 1,
    });
  });

  it("emits gate_completed and program_completed on the final correct guess", async () => {
    const sessionId = makeSessionId("complete");
    await insertSession(sessionId, E2E_GATE_3_ID);

    // Gate 3's correct answer is "cold" (case-insensitive).
    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_3_ID,
        guess: "cold",
      },
    });

    expect(response.body.errors).toBeUndefined();
    const completed = emitted("gate_completed");
    const completedProgram = emitted("program_completed");
    expect(completed).toHaveLength(1);
    expect(completed[0][1]).toMatchObject({
      name: "gate_completed",
      programId: E2E_PROGRAM_ID,
      gateId: E2E_GATE_3_ID,
      outcome: "correct",
      attemptCount: 0,
      isCorrect: true,
    });
    expect(completedProgram).toHaveLength(1);
    expect(completedProgram[0][1]).toMatchObject({
      name: "program_completed",
      programId: E2E_PROGRAM_ID,
      outcome: "complete",
    });
  });

  it("emits nothing when the completion was already persisted by a concurrent guess", async () => {
    const sessionId = makeSessionId("dup-complete");
    const progressId = await insertSession(sessionId, E2E_GATE_3_ID);
    await db.insert(sessionCompletedGates).values({
      sessionProgressId: progressId,
      gateId: E2E_GATE_3_ID,
    });

    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_3_ID,
        guess: "cold",
      },
    });

    expect(response.body.errors).toBeUndefined();
    expect(emitted("gate_completed")).toHaveLength(0);
    expect(emitted("program_completed")).toHaveLength(0);
  });

  it("emits clue_requested with success outcome and latency", async () => {
    const sessionId = makeSessionId("clue");
    await insertSession(sessionId, E2E_GATE_1_ID, { attemptCount: 2 });

    const response: GqlResponse = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.body.errors).toBeUndefined();
    const calls = emitted("clue_requested");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({
      name: "clue_requested",
      programId: E2E_PROGRAM_ID,
      gateId: E2E_GATE_1_ID,
      outcome: "success",
      attemptCount: 2,
    });
    expect(typeof calls[0][1].aiLatencyMs).toBe("number");
  });

  it("emits session_reset when a session row exists", async () => {
    const sessionId = makeSessionId("reset");
    await insertSession(sessionId, E2E_GATE_1_ID);

    const response: GqlResponse = await gqlRequest(RESET_SESSION_MUTATION, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    expect(response.body.errors).toBeUndefined();
    const calls = emitted("session_reset");
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({
      name: "session_reset",
      programId: E2E_PROGRAM_ID,
      outcome: "reset",
    });
  });

  it("emits nothing on session_reset for a missing session (no-op)", async () => {
    const sessionId = makeSessionId("noop-reset");

    const response: GqlResponse = await gqlRequest(RESET_SESSION_MUTATION, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    expect(response.body.errors).toBeUndefined();
    expect(vi.mocked(trackEvent)).not.toHaveBeenCalled();
  });
});

describe("POST /api/error telemetry", () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  function postError(body: string): Promise<Response> {
    return exports.default.fetch(
      new Request("http://localhost/api/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      }),
    );
  }

  it("emits client_error with sanitized detail and body-supplied session id", async () => {
    const sessionId = makeSessionId("beacon");
    const response = await postError(
      JSON.stringify({
        sessionId,
        source: "boundary",
        message: "boom token=secret",
        stack: "Error: boom\n  at fn (app.js:1:1)",
        path: "/programs/p1",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const calls = emitted("client_error");
    expect(calls).toHaveLength(1);
    expect(calls[0][0].get("sessionId")).toBe(sessionId);
    expect(calls[0][1]).toMatchObject({ outcome: "boundary" });
    expect(calls[0][1].detail).toContain("token=[REDACTED]");
    expect(calls[0][1].detail).not.toContain("secret");
  });

  it("rejects an oversized body", async () => {
    const response = await postError(
      JSON.stringify({ message: "x".repeat(4096) }),
    );
    expect(response.status).toBe(413);
    expect(vi.mocked(trackEvent)).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await postError("{not-json");
    expect(response.status).toBe(400);
    expect(vi.mocked(trackEvent)).not.toHaveBeenCalled();
  });

  it("rejects null, array, and primitive bodies", async () => {
    for (const body of ["null", "[]", "42", '"str"']) {
      const response = await postError(body);
      expect(response.status).toBe(400);
    }
    expect(vi.mocked(trackEvent)).not.toHaveBeenCalled();
  });

  it("rejects an unknown source instead of defaulting to boundary", async () => {
    const response = await postError(
      JSON.stringify({ source: "mystery", message: "boom" }),
    );
    expect(response.status).toBe(400);
    expect(vi.mocked(trackEvent)).not.toHaveBeenCalled();
  });
});
