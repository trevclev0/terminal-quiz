import { env } from "cloudflare:workers";
import {
  GET_PROGRAM_PROGRESSION_QUERY,
  RESET_SESSION_MUTATION,
} from "@shared/gqlQueries";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { type GqlResponse, gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";
const E2E_GATE_3_ID = "e2e00003-0000-0000-0000-000000000003";

function makeSessionId(label: string): string {
  return `reset-session-${label}-${crypto.randomUUID()}`;
}

/** Insert a fresh session_progress row for the E2E program. */
async function insertSession(
  sessionId: string,
  gateId: string | null,
  overrides: { status?: string; attemptCount?: number } = {},
): Promise<string> {
  const progressId = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO session_progress (id, session_id, program_id, current_gate_id, status, attempt_count, started_at, updated_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      progressId,
      sessionId,
      E2E_PROGRAM_ID,
      gateId,
      overrides.status ?? "in_progress",
      overrides.attemptCount ?? 0,
      now,
      now,
      overrides.status === "completed" ? now : null,
    )
    .run();
  return progressId;
}

describe("resetSession mutation", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
  });

  it("resets in-progress session — deletes progress row", async () => {
    const sessionId = makeSessionId("in-progress");
    await insertSession(sessionId, E2E_GATE_1_ID);

    // Verify row exists before reset
    const before = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM session_progress WHERE session_id = ? AND program_id = ?`,
    )
      .bind(sessionId, E2E_PROGRAM_ID)
      .first<{ cnt: number }>();
    expect(before?.cnt).toBe(1);

    // Reset
    const response: GqlResponse = await gqlRequest(RESET_SESSION_MUTATION, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({ resetSession: true });

    // Verify row deleted
    const after = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM session_progress WHERE session_id = ? AND program_id = ?`,
    )
      .bind(sessionId, E2E_PROGRAM_ID)
      .first<{ cnt: number }>();
    expect(after?.cnt).toBe(0);
  });

  it("reset allows fresh start from gate 1", async () => {
    const sessionId = makeSessionId("fresh-start");
    await insertSession(sessionId, E2E_GATE_3_ID);

    // Reset
    await gqlRequest(RESET_SESSION_MUTATION, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    // Query progression — auto-creates new session at Gate 1
    const progResponse = await gqlRequest(GET_PROGRAM_PROGRESSION_QUERY, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    expect(progResponse.status).toBe(200);
    expect(progResponse.body.errors).toBeUndefined();

    const data = progResponse.body.data as {
      getProgramProgression: {
        currentGate: { id: string; label: string } | null;
        completedGates: unknown[];
        status: string;
      };
    };
    expect(data.getProgramProgression.currentGate?.id).toBe(E2E_GATE_1_ID);
    expect(data.getProgramProgression.completedGates).toHaveLength(0);
    expect(data.getProgramProgression.status).toBe("in_progress");
  });

  it("reset on non-existent session is a no-op", async () => {
    const sessionId = makeSessionId("no-session");

    // No progress inserted — clean session
    const response: GqlResponse = await gqlRequest(RESET_SESSION_MUTATION, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({ resetSession: true });
  });

  it("reset after completion allows replay from gate 1", async () => {
    const sessionId = makeSessionId("completed-reset");

    // Simulate a completed session: status=completed, currentGateId=null
    await insertSession(sessionId, null, { status: "completed" });

    // Reset
    await gqlRequest(RESET_SESSION_MUTATION, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    // Query progression — should auto-create fresh session at Gate 1
    const progResponse = await gqlRequest(GET_PROGRAM_PROGRESSION_QUERY, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    expect(progResponse.status).toBe(200);
    expect(progResponse.body.errors).toBeUndefined();

    const data = progResponse.body.data as {
      getProgramProgression: {
        currentGate: { id: string };
        completedGates: unknown[];
        status: string;
      };
    };
    expect(data.getProgramProgression.currentGate?.id).toBe(E2E_GATE_1_ID);
    expect(data.getProgramProgression.status).toBe("in_progress");
  });
});
