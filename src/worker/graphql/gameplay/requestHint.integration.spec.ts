import { env } from "cloudflare:workers";
import { REQUEST_HINT_MUTATION } from "@shared/gqlQueries";
import { sessionProgress } from "@shared/schema";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { type GqlResponse, gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

const db = drizzle(env.DB);

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
// Gate 1: answer "blue", guidanceEnabled=true, guidanceThreshold=2
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";
// Gate 2: guidanceEnabled=false
const E2E_GATE_2_ID = "e2e00002-0000-0000-0000-000000000002";

interface RequestHintData {
  requestHint: {
    step: number;
    cells: (string | null)[] | null;
    isFinalStep: boolean;
  };
}

function makeSessionId(label: string): string {
  return `request-hint-${label}-${crypto.randomUUID()}`;
}

async function insertSession(
  sessionId: string,
  gateId: string,
  attemptCount: number,
): Promise<void> {
  await db.insert(sessionProgress).values({
    sessionId,
    programId: E2E_PROGRAM_ID,
    currentGateId: gateId,
    status: "in_progress",
    attemptCount,
  });
}

async function requestHint(
  sessionId: string,
  gateId = E2E_GATE_1_ID,
): Promise<GqlResponse> {
  return gqlRequest(REQUEST_HINT_MUTATION, {
    sessionId,
    variables: { programId: E2E_PROGRAM_ID, gateId },
  });
}

function hintOf(response: GqlResponse) {
  expect(response.body.errors).toBeUndefined();
  return (response.body.data as unknown as RequestHintData).requestHint;
}

describe("requestHint mutation", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
  });

  it("returns no hint below the guidance threshold", async () => {
    const sessionId = makeSessionId("below");
    await insertSession(sessionId, E2E_GATE_1_ID, 1);

    expect(hintOf(await requestHint(sessionId))).toEqual({
      step: 0,
      cells: null,
      isFinalStep: false,
    });
  });

  it("returns the masked shape at the threshold", async () => {
    const sessionId = makeSessionId("threshold");
    await insertSession(sessionId, E2E_GATE_1_ID, 2);

    expect(hintOf(await requestHint(sessionId))).toEqual({
      step: 1,
      cells: [null, null, null, null],
      isFinalStep: false,
    });
  });

  it("returns the step the attempt count has unlocked", async () => {
    const sessionId = makeSessionId("vowels");
    await insertSession(sessionId, E2E_GATE_1_ID, 4);

    expect(hintOf(await requestHint(sessionId))).toEqual({
      step: 3,
      cells: ["B", null, "U", "E"],
      isFinalStep: true,
    });
  });

  it("caps the step at the answer's last safe step", async () => {
    const sessionId = makeSessionId("capped");
    await insertSession(sessionId, E2E_GATE_1_ID, 20);

    expect(hintOf(await requestHint(sessionId))).toMatchObject({
      step: 3,
      isFinalStep: true,
    });
  });

  it("returns no hint on a gate with guidance turned off", async () => {
    const sessionId = makeSessionId("disabled");
    await insertSession(sessionId, E2E_GATE_2_ID, 20);

    expect(hintOf(await requestHint(sessionId, E2E_GATE_2_ID))).toEqual({
      step: 0,
      cells: null,
      isFinalStep: false,
    });
  });

  it("rejects a hint for a gate the session is not on", async () => {
    const sessionId = makeSessionId("desync");
    await insertSession(sessionId, E2E_GATE_1_ID, 4);

    const response = await requestHint(sessionId, E2E_GATE_2_ID);

    expect(response.body.errors?.[0]?.message).toMatch(/Desync/);
  });

  it("rejects a hint for a program the session has not started", async () => {
    const response = await requestHint(makeSessionId("unstarted"));

    expect(response.body.errors?.[0]?.message).toMatch(/Invalid state/);
  });
});
