import { env } from "cloudflare:workers";
import {
  GET_PROGRAM_PROGRESSION_QUERY,
  RESET_SESSION_MUTATION,
} from "@shared/gqlQueries";
import { sessionProgress } from "@shared/schema";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { type GqlResponse, gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

const db = drizzle(env.DB);

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
  const [progress] = await db
    .insert(sessionProgress)
    .values({
      sessionId,
      programId: E2E_PROGRAM_ID,
      currentGateId: gateId,
      status: overrides.status ?? "in_progress",
      attemptCount: overrides.attemptCount ?? 0,
      ...(overrides.status === "completed" ? { completedAt: new Date() } : {}),
    })
    .returning({ id: sessionProgress.id });
  return progress.id;
}

describe("resetSession mutation", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
  });

  it("resets in-progress session to initial state (Gate 1, 0 attempts)", async () => {
    const sessionId = makeSessionId("in-progress");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID);

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

    // Verify row still exists but state is reset
    const row = await env.DB.prepare(
      `SELECT current_gate_id, attempt_count, status, completed_at
       FROM session_progress WHERE id = ?`,
    )
      .bind(progressId)
      .first<{
        current_gate_id: string;
        attempt_count: number;
        status: string;
        completed_at: unknown;
      }>();
    expect(row).not.toBeNull();
    expect(row?.current_gate_id).toBe(E2E_GATE_1_ID);
    expect(row?.attempt_count).toBe(0);
    expect(row?.status).toBe("in_progress");
    expect(row?.completed_at).toBeNull();
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
