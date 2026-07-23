import { env } from "cloudflare:workers";
import {
  GET_PROGRAM_PROGRESSION_QUERY,
  RESET_SESSION_MUTATION,
} from "@shared/gqlQueries";
import {
  gateClues,
  sessionCompletedGates,
  sessionProgress,
} from "@shared/schema";
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

/** Insert a session_completed_gates row. */
async function insertCompletedGate(
  sessionProgressId: string,
  gateId: string,
): Promise<void> {
  await db.insert(sessionCompletedGates).values({
    sessionProgressId,
    gateId,
  });
}

/** Insert a gate_clues row. */
async function insertGateClue(
  sessionProgressId: string,
  gateId: string,
  clueText: string,
  attemptCountAtRequest: number,
): Promise<void> {
  await db.insert(gateClues).values({
    sessionProgressId,
    gateId,
    clueText,
    attemptCountAtRequest,
  });
}

describe("resetSession mutation", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
  });

  it("resets to baseline: Gate 1, 0 attempts, child rows removed", async () => {
    const sessionId = makeSessionId("non-baseline");
    // Seed non-baseline progress: at Gate 3, 5 attempts
    const progressId = await insertSession(sessionId, E2E_GATE_3_ID, {
      attemptCount: 5,
    });

    // Seed child rows
    await insertCompletedGate(progressId, E2E_GATE_1_ID);
    await insertGateClue(progressId, E2E_GATE_1_ID, "some hint", 2);

    // Verify child rows exist before reset
    const completedBefore = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM session_completed_gates WHERE session_progress_id = ?`,
    )
      .bind(progressId)
      .first<{ cnt: number }>();
    expect(completedBefore?.cnt).toBe(1);

    const cluesBefore = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM gate_clues WHERE session_progress_id = ?`,
    )
      .bind(progressId)
      .first<{ cnt: number }>();
    expect(cluesBefore?.cnt).toBe(1);

    // Reset
    const response: GqlResponse = await gqlRequest(RESET_SESSION_MUTATION, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toEqual({ resetSession: true });

    // Verify progress reset to baseline
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

    // Verify child rows removed
    const completedAfter = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM session_completed_gates WHERE session_progress_id = ?`,
    )
      .bind(progressId)
      .first<{ cnt: number }>();
    expect(completedAfter?.cnt).toBe(0);

    const cluesAfter = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM gate_clues WHERE session_progress_id = ?`,
    )
      .bind(progressId)
      .first<{ cnt: number }>();
    expect(cluesAfter?.cnt).toBe(0);
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
