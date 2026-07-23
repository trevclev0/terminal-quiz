import { env } from "cloudflare:workers";
import {
  GET_IN_PROGRESS_PROGRAM_QUERY,
  GET_PROGRAM_PROGRESSION_QUERY,
  GET_PROGRAMS_QUERY,
} from "@shared/gqlQueries";
import { sessionCompletedGates, sessionProgress } from "@shared/schema";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { type GqlResponse, gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

const db = drizzle(env.DB);

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";
const E2E_GATE_2_ID = "e2e00002-0000-0000-0000-000000000002";
const E2E_GATE_3_ID = "e2e00003-0000-0000-0000-000000000003";

function makeSessionId(label: string): string {
  return `programs-${label}-${crypto.randomUUID()}`;
}

/** Insert a fresh session_progress row for the E2E program. */
async function insertSession(
  sessionId: string,
  gateId: string | null,
  overrides: {
    status?: string;
    attemptCount?: number;
  } = {},
): Promise<string> {
  const [progress] = await db
    .insert(sessionProgress)
    .values({
      sessionId,
      programId: E2E_PROGRAM_ID,
      currentGateId: gateId,
      status: overrides.status ?? "in_progress",
      attemptCount: overrides.attemptCount ?? 0,
    })
    .returning({ id: sessionProgress.id });
  return progress.id;
}

describe("program queries", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
  });

  it("getPrograms returns seeded programs", async () => {
    const sessionId = makeSessionId("list");

    const response: GqlResponse = await gqlRequest(GET_PROGRAMS_QUERY, {
      sessionId,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as {
      programs: { id: string; name: string }[];
    };
    expect(data.programs.length).toBeGreaterThanOrEqual(1);

    const e2eProgram = data.programs.find((p) => p.name === "E2E Test Program");
    expect(e2eProgram).toBeDefined();
    expect(e2eProgram!.id).toBe(E2E_PROGRAM_ID);
  });

  it("getProgramProgression auto-creates session at gate 1", async () => {
    const sessionId = makeSessionId("auto-create");

    // No session_progress row exists — query should auto-create one
    const response: GqlResponse = await gqlRequest(
      GET_PROGRAM_PROGRESSION_QUERY,
      {
        sessionId,
        variables: { programId: E2E_PROGRAM_ID },
      },
    );

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as {
      getProgramProgression: {
        currentGate: { id: string; label: string; question: string } | null;
        completedGates: unknown[];
        status: string;
      };
    };
    expect(data.getProgramProgression.currentGate).not.toBeNull();
    expect(data.getProgramProgression.currentGate!.id).toBe(E2E_GATE_1_ID);
    expect(data.getProgramProgression.currentGate!.label).toBe("Gate 1");
    expect(data.getProgramProgression.completedGates).toHaveLength(0);
    expect(data.getProgramProgression.status).toBe("in_progress");
  });

  it("getProgramProgression includes completed gates with correctAnswer", async () => {
    const sessionId = makeSessionId("with-completed");
    const progressId = await insertSession(sessionId, E2E_GATE_3_ID);

    // Mark gates 1 and 2 as completed for this session
    await db.insert(sessionCompletedGates).values({
      sessionProgressId: progressId,
      gateId: E2E_GATE_1_ID,
    });
    await db.insert(sessionCompletedGates).values({
      sessionProgressId: progressId,
      gateId: E2E_GATE_2_ID,
    });

    const response: GqlResponse = await gqlRequest(
      GET_PROGRAM_PROGRESSION_QUERY,
      {
        sessionId,
        variables: { programId: E2E_PROGRAM_ID },
      },
    );

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as {
      getProgramProgression: {
        currentGate: { id: string; label: string; question: string };
        completedGates: {
          id: string;
          label: string;
          correctAnswer: string;
          successMessage: string;
        }[];
        status: string;
      };
    };

    // Current gate is Gate 3
    expect(data.getProgramProgression.currentGate.id).toBe(E2E_GATE_3_ID);

    // Completed gates are gates 1 and 2
    expect(data.getProgramProgression.completedGates).toHaveLength(2);
    const completedIds = data.getProgramProgression.completedGates.map(
      (g) => g.id,
    );
    expect(completedIds).toContain(E2E_GATE_1_ID);
    expect(completedIds).toContain(E2E_GATE_2_ID);

    // Completed gates include correctAnswer and successMessage
    const gate1Completed = data.getProgramProgression.completedGates.find(
      (g) => g.id === E2E_GATE_1_ID,
    );
    expect(gate1Completed?.correctAnswer).toBe("blue");
    expect(gate1Completed?.successMessage).toBe(
      "Correct! The sky is blue during a clear day.",
    );

    // Status is still in_progress (gate 3 not yet completed)
    expect(data.getProgramProgression.status).toBe("in_progress");
  });

  it("getInProgressProgram returns program ID when session is active", async () => {
    const sessionId = makeSessionId("in-progress");
    await insertSession(sessionId, E2E_GATE_1_ID);

    const response: GqlResponse = await gqlRequest(
      GET_IN_PROGRESS_PROGRAM_QUERY,
      {
        sessionId,
      },
    );

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as {
      getInProgressProgram: string | null;
    };
    expect(data.getInProgressProgram).toBe(E2E_PROGRAM_ID);
  });

  it("getInProgressProgram returns null when no session is active", async () => {
    const sessionId = makeSessionId("no-activity");

    // No progress rows exist for this session
    const response: GqlResponse = await gqlRequest(
      GET_IN_PROGRESS_PROGRAM_QUERY,
      {
        sessionId,
      },
    );

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as {
      getInProgressProgram: string | null;
    };
    expect(data.getInProgressProgram).toBeNull();
  });
});
