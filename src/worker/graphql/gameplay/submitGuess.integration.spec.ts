import { env } from "cloudflare:workers";
import {
  GET_PROGRAM_PROGRESSION_QUERY,
  SUBMIT_GUESS_MUTATION,
} from "@shared/gqlQueries";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { type GqlResponse, gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";
const E2E_GATE_2_ID = "e2e00002-0000-0000-0000-000000000002";
const E2E_GATE_3_ID = "e2e00003-0000-0000-0000-000000000003";

function makeSessionId(label: string): string {
  return `submit-guess-${label}-${crypto.randomUUID()}`;
}

/** Insert a fresh session_progress row for the E2E program. */
async function insertSession(
  sessionId: string,
  gateId: string,
  overrides: { attemptCount?: number } = {},
): Promise<string> {
  const progressId = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO session_progress (id, session_id, program_id, current_gate_id, status, attempt_count, started_at, updated_at)
     VALUES (?, ?, ?, ?, 'in_progress', ?, ?, ?)`,
  )
    .bind(
      progressId,
      sessionId,
      E2E_PROGRAM_ID,
      gateId,
      overrides.attemptCount ?? 0,
      now,
      now,
    )
    .run();
  return progressId;
}

interface SubmitGuessData {
  submitGuess: {
    success: boolean;
    message: string | null;
    canRequestClue: boolean;
    nextGate: { id: string; label: string; question: string } | null;
  };
}

describe("submitGuess mutation", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
  });

  it("correct guess advances to next gate", async () => {
    const sessionId = makeSessionId("correct-advances");
    await insertSession(sessionId, E2E_GATE_1_ID);

    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "blue",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as SubmitGuessData;
    expect(data.submitGuess.success).toBe(true);
    expect(data.submitGuess.message).toBe(
      "Correct! The sky is blue during a clear day.",
    );
    expect(data.submitGuess.canRequestClue).toBe(false);
    expect(data.submitGuess.nextGate).not.toBeNull();
    expect(data.submitGuess.nextGate!.id).toBe(E2E_GATE_2_ID);

    // Verify progression via query — current gate moved to Gate 2
    const progResponse = await gqlRequest(GET_PROGRAM_PROGRESSION_QUERY, {
      sessionId,
      variables: { programId: E2E_PROGRAM_ID },
    });
    const progData = progResponse.body.data as {
      getProgramProgression: {
        currentGate: { id: string } | null;
        completedGates: { id: string }[];
        status: string;
      };
    };
    expect(progData.getProgramProgression.currentGate?.id).toBe(E2E_GATE_2_ID);
    expect(progData.getProgramProgression.status).toBe("in_progress");
  });

  it("wrong guess increments attempt count", async () => {
    const sessionId = makeSessionId("wrong-increments");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID);

    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as SubmitGuessData;
    expect(data.submitGuess.success).toBe(false);
    expect(data.submitGuess.nextGate).toBeNull();
    expect(data.submitGuess.canRequestClue).toBe(false);

    // Verify attempt_count incremented via direct DB query
    const row = await env.DB.prepare(
      `SELECT attempt_count FROM session_progress WHERE id = ?`,
    )
      .bind(progressId)
      .first<{ attempt_count: number }>();
    expect(row?.attempt_count).toBe(1);
  });

  /** Insert a gate_clues row for a session_progress + gate combination. */
  async function insertClue(
    progressId: string,
    attemptCountAtRequest: number,
  ): Promise<void> {
    await env.DB.prepare(
      `INSERT INTO gate_clues (id, session_progress_id, gate_id, clue_text, attempt_count_at_request, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        crypto.randomUUID(),
        progressId,
        E2E_GATE_1_ID,
        "test clue text",
        attemptCountAtRequest,
        Date.now(),
      )
      .run();
  }

  it("wrong guess at attempt threshold enables clue", async () => {
    // Gate 1: guidanceEnabled=true, guidanceThreshold=2
    // Pre-seed with attemptCount=2 so next wrong guess meets threshold
    const sessionId = makeSessionId("wrong-at-threshold");
    await insertSession(sessionId, E2E_GATE_1_ID, { attemptCount: 2 });

    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as SubmitGuessData;
    expect(data.submitGuess.success).toBe(false);
    expect(data.submitGuess.nextGate).toBeNull();
    // attemptCount=3 now meets threshold=2, guidance is enabled → clue available
    expect(data.submitGuess.canRequestClue).toBe(true);
  });

  it("clue cap: no more clues once MAX_CLUES_PER_GATE reached", async () => {
    // Seed a session at threshold and 3 existing clues — hitting
    // MAX_CLUES_PER_GATE=3 → computeCanRequestClue returns false
    const sessionId = makeSessionId("clue-cap");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID, {
      attemptCount: 2,
    });

    for (let i = 0; i < 3; i++) {
      await insertClue(progressId, i + 1);
    }

    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as SubmitGuessData;
    expect(data.submitGuess.success).toBe(false);
    // All 3 clue slots consumed → canRequestClue must be false
    expect(data.submitGuess.canRequestClue).toBe(false);
  });

  it("no duplicate clue for the same attempt count", async () => {
    // Seed a clue whose attemptCountAtRequest matches the attempt count
    // the session will have AFTER the wrong guess increments it.
    // Check: newAttemptCount (5) <= mostRecentClueAttemptCount (5) → false.
    const sessionId = makeSessionId("duplicate-attempt");
    const progressId = await insertSession(sessionId, E2E_GATE_1_ID, {
      attemptCount: 4,
    });
    // Seed clue at attemptCountAtRequest=5 — the value the session will
    // reach after the wrong guess increments attemptCount from 4 to 5.
    await insertClue(progressId, 5);

    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as SubmitGuessData;
    expect(data.submitGuess.success).toBe(false);
    // attemptCount became 5 <= mostRecentClueAttemptCount (5) → blocked
    expect(data.submitGuess.canRequestClue).toBe(false);
  });

  it("case-insensitive guess is accepted", async () => {
    const sessionId = makeSessionId("case-insensitive");
    await insertSession(sessionId, E2E_GATE_1_ID);

    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "BLUE",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as SubmitGuessData;
    expect(data.submitGuess.success).toBe(true);
    expect(data.submitGuess.nextGate).not.toBeNull();
  });

  it("trailing whitespace is trimmed before comparison", async () => {
    const sessionId = makeSessionId("whitespace-trimmed");
    await insertSession(sessionId, E2E_GATE_1_ID);

    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "  blue  ",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as SubmitGuessData;
    expect(data.submitGuess.success).toBe(true);
  });

  it("desync: guess for wrong gate is rejected", async () => {
    const sessionId = makeSessionId("desync-wrong-gate");
    await insertSession(sessionId, E2E_GATE_1_ID);

    // Session is at Gate 1 — guess for Gate 2 should fail
    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_2_ID,
        guess: "4",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors![0].message).toBe(
      "Desync: Guess submitted for the wrong active gate.",
    );
  });

  it("completed program rejects further guesses", async () => {
    const sessionId = makeSessionId("completed-rejects");

    // Play through all 3 gates in sequence
    await insertSession(sessionId, E2E_GATE_1_ID);

    // Gate 1 → correct
    const gate1Response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "blue",
      },
    });
    expect(gate1Response.body.errors).toBeUndefined();
    expect(
      (gate1Response.body.data as SubmitGuessData).submitGuess.success,
    ).toBe(true);

    // Gate 2 → correct
    const gate2Response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_2_ID,
        guess: "4",
      },
    });
    expect(gate2Response.body.errors).toBeUndefined();
    expect(
      (gate2Response.body.data as SubmitGuessData).submitGuess.success,
    ).toBe(true);

    // Gate 3 → correct → program completed
    const finalResponse: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_3_ID,
        guess: "cold",
      },
    });
    const finalData = finalResponse.body.data as SubmitGuessData;
    expect(finalData.submitGuess.success).toBe(true);
    expect(finalData.submitGuess.nextGate).toBeNull(); // no gates remain

    // Any further guess should fail
    const afterCompletion: GqlResponse = await gqlRequest(
      SUBMIT_GUESS_MUTATION,
      {
        sessionId,
        variables: {
          programId: E2E_PROGRAM_ID,
          gateId: E2E_GATE_3_ID,
          guess: "cold",
        },
      },
    );

    expect(afterCompletion.status).toBe(200);
    expect(afterCompletion.body.errors).toBeDefined();
    expect(afterCompletion.body.errors![0].message).toBe(
      "Invalid state: Program already completed or not started.",
    );
  });

  it("no session progress rejects guess", async () => {
    // Fresh session ID with no progress row
    const sessionId = makeSessionId("no-progress");

    const response: GqlResponse = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "blue",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors![0].message).toBe(
      "Invalid state: Program already completed or not started.",
    );
  });
});
