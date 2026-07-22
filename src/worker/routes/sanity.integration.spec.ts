import { GET_PROGRAMS_QUERY } from "@shared/gqlQueries";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Sanity: integration test infrastructure", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    // Clear cached GraphQL schema between tests so each test
    // rebuilds against the current D1 state
    invalidateCachedSchema();
  });

  it("returns seeded programs via GraphQL", async () => {
    const response = await gqlRequest(GET_PROGRAMS_QUERY, {
      sessionId: "sanity-test-session",
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data).toBeDefined();

    const programs = (
      response.body.data as { programs: { id: string; name: string }[] }
    ).programs;
    const e2eProgram = programs.find((p) => p.name === "E2E Test Program");

    expect(e2eProgram).toBeDefined();
    expect(e2eProgram?.id).toBe("e2e00000-0000-0000-0000-000000000001");
  });
});
