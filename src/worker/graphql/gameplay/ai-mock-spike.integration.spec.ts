import { env } from "cloudflare:workers";
import { REQUEST_CLUE_MUTATION } from "@shared/gqlQueries";
import { sessionProgress } from "@shared/schema";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const db = drizzle(env.DB);

// SPIKE: Test whether vi.mock() works under the workerd runtime.
// If this works, requestClue integration tests can mock generateClue
// the same way existing unit tests do.
// If it fails, we need to override the AI binding in the pool config instead.
vi.mock("@worker-services/aiService", () => ({
  generateClue: vi.fn().mockResolvedValue("mock clue from vi.mock"),
}));

import { generateClue } from "@worker-services/aiService";

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";

describe("AI mock spike: vi.mock() under workerd", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
    vi.mocked(generateClue).mockReset();
    vi.mocked(generateClue).mockResolvedValue("mock clue from vi.mock");
  });

  it("returns mocked clue text if vi.mock() works under workerd", async () => {
    const sessionId = `spike-${crypto.randomUUID()}`;

    // Insert session at gate 1 with attemptCount=2 (meets guidanceThreshold=2)
    await db.insert(sessionProgress).values({
      sessionId,
      programId: E2E_PROGRAM_ID,
      currentGateId: E2E_GATE_1_ID,
      status: "in_progress",
      attemptCount: 2,
    });

    const response = await gqlRequest(REQUEST_CLUE_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        currentGuess: "red",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();

    const data = response.body.data as {
      requestClue: { clueText: string | null; isClueLimitReached: boolean };
    };

    // If vi.mock() works, clueText is "mock clue from vi.mock"
    // If vi.mock() doesn't work, clueText is null (AI binding missing)
    expect(data.requestClue.clueText).toBe("mock clue from vi.mock");
    expect(vi.mocked(generateClue)).toHaveBeenCalled();
  });
});
