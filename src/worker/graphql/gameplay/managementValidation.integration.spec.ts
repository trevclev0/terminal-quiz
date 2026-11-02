import { env } from "cloudflare:workers";
import {
  CREATE_GATE_MUTATION,
  PROGRAM_GATES_QUERY,
  UPDATE_GATE_MUTATION,
  UPDATE_PROGRAM_MUTATION,
} from "@shared/gqlQueries";
import { gates, programs } from "@shared/schema";
import {
  ANSWER_CONFLICT_ERROR,
  RESERVED_ALIAS_ERROR,
  RESERVED_ANSWER_ERROR,
} from "@shared/validation";
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

  it("rejects a reserved correctAnswer on updateGate and leaves the gate unchanged", async () => {
    const { gateId } = await insertOwnedProgram("public");

    const response = await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: { id: gateId, correctAnswer: "/clue" },
    });

    expect(firstError(response)).toBe(RESERVED_ANSWER_ERROR);
    expect((await readGate(gateId)).correctAnswer).toBe("answer");
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

describe("accepted-answer aliases over the management API", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
  });

  async function listedAliases(programId: string) {
    const response = await gqlRequest(PROGRAM_GATES_QUERY, {
      ...AUTH,
      variables: { programId },
    });
    expect(response.body.errors).toBeUndefined();
    const data = response.body.data as {
      programGates: { id: string; acceptedAnswers: string[] }[];
    };
    return new Map(
      data.programGates.map((gate) => [gate.id, gate.acceptedAnswers]),
    );
  }

  function createVariables(programId: string, overrides = {}) {
    return {
      programId,
      label: "Second",
      question: "Q?",
      correctAnswer: "NYC",
      successMessage: "OK",
      sequenceOrder: 2,
      ...overrides,
    };
  }

  async function storeAliases(gateId: string, aliases: string[]) {
    await db
      .update(gates)
      .set({ acceptedAnswers: aliases })
      .where(eq(gates.id, gateId));
  }

  it("createGate stores trimmed aliases that programGates lists", async () => {
    const { programId } = await insertOwnedProgram("public");

    const response = await gqlRequest(CREATE_GATE_MUTATION, {
      ...AUTH,
      variables: createVariables(programId, {
        correctAnswer: "New York City",
        acceptedAnswers: [" NYC ", "New York"],
      }),
    });

    expect(response.body.errors).toBeUndefined();
    const created = (response.body.data as { createGate: { id: string } })
      .createGate;
    expect((await listedAliases(programId)).get(created.id)).toEqual([
      "NYC",
      "New York",
    ]);
  });

  it("lists [] for gates created without aliases and for NULL rows", async () => {
    const { programId, gateId } = await insertOwnedProgram("public");

    const response = await gqlRequest(CREATE_GATE_MUTATION, {
      ...AUTH,
      variables: createVariables(programId),
    });

    expect(response.body.errors).toBeUndefined();
    const created = (response.body.data as { createGate: { id: string } })
      .createGate;
    const listed = await listedAliases(programId);
    expect(listed.get(created.id)).toEqual([]);
    expect(listed.get(gateId)).toEqual([]);
    expect((await readGate(gateId)).acceptedAnswers).toBeNull();
  });

  it("updateGate replaces the list wholesale and [] clears it", async () => {
    const { programId, gateId } = await insertOwnedProgram("public");

    await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: { id: gateId, acceptedAnswers: ["four"] },
    });
    expect((await listedAliases(programId)).get(gateId)).toEqual(["four"]);

    const cleared = await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: { id: gateId, acceptedAnswers: [] },
    });
    expect(cleared.body.errors).toBeUndefined();
    expect((await listedAliases(programId)).get(gateId)).toEqual([]);
    expect((await readGate(gateId)).acceptedAnswers).toEqual([]);
  });

  it("updateGate without acceptedAnswers leaves stored aliases alone", async () => {
    const { programId, gateId } = await insertOwnedProgram("public");
    await storeAliases(gateId, ["four"]);

    const omitted = await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: { id: gateId, label: "Renamed" },
    });
    expect(omitted.body.errors).toBeUndefined();

    const explicitNull = await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: { id: gateId, label: "Again", acceptedAnswers: null },
    });
    expect(explicitNull.body.errors).toBeUndefined();

    expect((await listedAliases(programId)).get(gateId)).toEqual(["four"]);
  });

  it("createGate rejects an alias equal to correctAnswer", async () => {
    const { programId } = await insertOwnedProgram("public");

    const response = await gqlRequest(CREATE_GATE_MUTATION, {
      ...AUTH,
      variables: createVariables(programId, { acceptedAnswers: ["nyc"] }),
    });

    expect(firstError(response)).toBe(ANSWER_CONFLICT_ERROR);
    const stored = await db
      .select()
      .from(gates)
      .where(eq(gates.programId, programId));
    expect(stored).toHaveLength(1);
  });

  it("updateGate rejects a new correctAnswer that matches a stored alias", async () => {
    const { gateId } = await insertOwnedProgram("public");
    await storeAliases(gateId, ["four"]);

    const response = await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: { id: gateId, correctAnswer: "FOUR" },
    });

    expect(firstError(response)).toBe(ANSWER_CONFLICT_ERROR);
    expect((await readGate(gateId)).correctAnswer).toBe("answer");
  });

  it("updateGate rejects new aliases that match the stored correctAnswer", async () => {
    const { gateId } = await insertOwnedProgram("public");
    await db
      .update(gates)
      .set({ correctAnswer: "4" })
      .where(eq(gates.id, gateId));

    const response = await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: { id: gateId, acceptedAnswers: [" 4"] },
    });

    expect(firstError(response)).toBe(ANSWER_CONFLICT_ERROR);
    expect((await readGate(gateId)).acceptedAnswers).toBeNull();
  });

  it("rejects a reserved command as an alias", async () => {
    const { gateId } = await insertOwnedProgram("public");

    const response = await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: { id: gateId, acceptedAnswers: ["/clue"] },
    });

    expect(firstError(response)).toBe(RESERVED_ALIAS_ERROR);
    expect((await readGate(gateId)).acceptedAnswers).toBeNull();
  });

  it("rejects a non-owner's alias update before any answer check", async () => {
    const { programId, gateId } = await insertOwnedProgram("public");
    await storeAliases(gateId, ["four"]);
    // An unowned (NULL authorId) program is editable by no one, so the
    // conflicting correctAnswer must surface the ownership error instead.
    await db
      .update(programs)
      .set({ authorId: null })
      .where(eq(programs.id, programId));

    const response = await gqlRequest(UPDATE_GATE_MUTATION, {
      ...AUTH,
      variables: {
        id: gateId,
        correctAnswer: "four",
        acceptedAnswers: ["five"],
      },
    });

    expect(firstError(response)).toContain("do not own");
    expect((await readGate(gateId)).acceptedAnswers).toEqual(["four"]);
  });
});
