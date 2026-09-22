import { env } from "cloudflare:workers";
import {
  CREATE_GATE_MUTATION,
  UPDATE_GATE_MUTATION,
  UPDATE_PROGRAM_MUTATION,
} from "@shared/gqlQueries";
import { gates, programs } from "@shared/schema";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { type GqlResponse, gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import {
  INTEGRATION_TEST_SECRET,
  TEST_USER_ID,
} from "@worker-test-utils/testConstants";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

// End-to-end checks that management mutations parse their input with the
// shared schemas in src/shared/validation.ts — through the real GraphQL
// stack and D1, not a mocked resolver.

const db = drizzle(env.DB);

const AUTH = { testUserId: TEST_USER_ID, testSecret: INTEGRATION_TEST_SECRET };

async function insertOwnedProgram(visibility: "public" | "unlisted") {
  const programId = crypto.randomUUID();
  const gateId = crypto.randomUUID();
  await db.insert(programs).values({
    id: programId,
    name: "Validation Program",
    visibility,
    authorId: TEST_USER_ID,
  });
  await db.insert(gates).values({
    id: gateId,
    programId,
    sequenceOrder: 1,
    label: "Gate",
    question: "Question?",
    correctAnswer: "answer",
    successMessage: "OK",
  });
  return { programId, gateId };
}

async function readGate(gateId: string) {
  const [gate] = await db.select().from(gates).where(eq(gates.id, gateId));
  return gate;
}

function firstError(response: GqlResponse): string | undefined {
  return response.body.errors?.[0]?.message;
}

describe("management mutations validate with the shared schemas", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
  });

  it("rejects an out-of-range acceptanceThreshold on updateGate and leaves the gate unchanged", async () => {
    const { gateId } = await insertOwnedProgram("public");

    const response = await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: { id: gateId, acceptanceThreshold: 1.5 },
    });

    expect(firstError(response)).toBe(
      "acceptanceThreshold must be between 0 and 1.",
    );
    expect((await readGate(gateId)).acceptanceThreshold).toBe(0.875);
  });

  it("rejects an out-of-range acceptanceThreshold on createGate without inserting", async () => {
    const { programId } = await insertOwnedProgram("public");

    const response = await gqlRequest(CREATE_GATE_MUTATION, {
      ...AUTH,
      variables: {
        programId,
        label: "Second",
        question: "Q?",
        correctAnswer: "A",
        successMessage: "OK",
        sequenceOrder: 2,
        acceptanceThreshold: -0.5,
      },
    });

    expect(firstError(response)).toBe(
      "acceptanceThreshold must be between 0 and 1.",
    );
    const stored = await db
      .select()
      .from(gates)
      .where(eq(gates.programId, programId));
    expect(stored).toHaveLength(1);
  });

  it("stores trimmed text from updateGate", async () => {
    const { gateId } = await insertOwnedProgram("public");

    const response = await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: { id: gateId, label: "  Renamed Gate  " },
    });

    expect(response.body.errors).toBeUndefined();
    expect((await readGate(gateId)).label).toBe("Renamed Gate");
  });

  it("renaming a program keeps its visibility", async () => {
    const { programId } = await insertOwnedProgram("unlisted");

    const response = await gqlRequest(UPDATE_PROGRAM_MUTATION, {
      ...AUTH,
      variables: { id: programId, name: "Renamed" },
    });

    expect(response.body.errors).toBeUndefined();
    const [program] = await db
      .select()
      .from(programs)
      .where(eq(programs.id, programId));
    expect(program).toMatchObject({ name: "Renamed", visibility: "unlisted" });
  });
});
