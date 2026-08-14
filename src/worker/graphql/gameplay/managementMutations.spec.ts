import { createMockGraphQLContext } from "@worker-test-utils/mockEnv";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGate, deleteGate, updateGate } from "./gateMutations";
import {
  createProgram,
  deleteProgram,
  updateProgram,
} from "./programMutations";
import { reorderGates } from "./reorderGatesMutation";
import type { AppGraphQLContext } from "./types";

type MockDb = {
  query: {
    programs: { findFirst: ReturnType<typeof vi.fn> };
    gates: {
      findFirst: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  batch: ReturnType<typeof vi.fn>;
};

function createMockDb(): MockDb {
  return {
    query: {
      programs: { findFirst: vi.fn() },
      gates: { findFirst: vi.fn(), findMany: vi.fn() },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn(),
        }),
      }),
    }),
    batch: vi
      .fn()
      .mockImplementation((statements: Promise<unknown>[]) =>
        Promise.all(statements),
      ),
  };
}

const USER = { id: "user-1", email: "a@b.com", name: "User One" };
const OTHER_USER = { id: "user-2", email: "c@d.com", name: "User Two" };
const OWNED_PROGRAM = {
  id: "prog-1",
  name: "My Program",
  authorId: USER.id,
  visibility: "public",
  createdAt: new Date(),
};

function resolveField<T, TArgs extends unknown[]>(
  field: { resolve?: (...args: TArgs) => T },
  ...args: TArgs
): T {
  if (!field.resolve) throw new Error("Resolver not defined");
  return field.resolve(...args);
}

describe("createProgram", () => {
  let mockDb: MockDb;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = createMockDb();
    mockContext = createMockGraphQLContext({ db: mockDb, user: USER });
  });

  it("throws when unauthenticated", async () => {
    const ctx = createMockGraphQLContext({ db: mockDb });

    await expect(
      resolveField(createProgram, null, { name: "Test" }, ctx),
    ).rejects.toThrow("Authentication required");
  });

  it("creates a program with default visibility", async () => {
    const returning = vi.fn().mockResolvedValue([OWNED_PROGRAM]);
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning }),
    });

    const result = await resolveField(
      createProgram,
      null,
      { name: "My Program" },
      mockContext,
    );

    expect(result.id).toBe("prog-1");
    expect(result.authorId).toBe(USER.id);
    expect(result.visibility).toBe("public");
  });

  it("creates a program with custom visibility", async () => {
    const returning = vi
      .fn()
      .mockResolvedValue([{ ...OWNED_PROGRAM, visibility: "unlisted" }]);
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning }),
    });

    const result = await resolveField(
      createProgram,
      null,
      { name: "My Program", visibility: "unlisted" },
      mockContext,
    );

    expect(result.visibility).toBe("unlisted");
  });

  it("throws on invalid visibility", async () => {
    await expect(
      resolveField(
        createProgram,
        null,
        { name: "Test", visibility: "secret" },
        mockContext,
      ),
    ).rejects.toThrow('Invalid visibility "secret"');
  });

  it("throws when name is blank", async () => {
    await expect(
      resolveField(createProgram, null, { name: "   " }, mockContext),
    ).rejects.toThrow("name is required.");
  });
});

describe("updateProgram", () => {
  let mockDb: MockDb;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = createMockDb();
    mockContext = createMockGraphQLContext({ db: mockDb, user: USER });
  });

  it("throws when unauthenticated", async () => {
    const ctx = createMockGraphQLContext({ db: mockDb });

    await expect(
      resolveField(updateProgram, null, { id: "prog-1", name: "New" }, ctx),
    ).rejects.toThrow("Authentication required");
  });

  it("throws when user does not own the program", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue({
      ...OWNED_PROGRAM,
      authorId: OTHER_USER.id,
    });

    await expect(
      resolveField(
        updateProgram,
        null,
        { id: "prog-1", name: "New" },
        mockContext,
      ),
    ).rejects.toThrow("You do not own this program");
  });

  it("updates program name", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);
    const returning = vi
      .fn()
      .mockResolvedValue([{ ...OWNED_PROGRAM, name: "Updated" }]);
    mockDb.update.mockReturnValue({
      set: vi
        .fn()
        .mockReturnValue({ where: vi.fn().mockReturnValue({ returning }) }),
    });

    const result = await resolveField(
      updateProgram,
      null,
      { id: "prog-1", name: "Updated" },
      mockContext,
    );

    expect(result.name).toBe("Updated");
  });

  it("throws on invalid visibility", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(
        updateProgram,
        null,
        { id: "prog-1", visibility: "invalid" },
        mockContext,
      ),
    ).rejects.toThrow('Invalid visibility "invalid"');
  });

  it("throws when no fields to update", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(updateProgram, null, { id: "prog-1" }, mockContext),
    ).rejects.toThrow("No fields to update.");
  });

  it("throws when name is blank", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(
        updateProgram,
        null,
        { id: "prog-1", name: "   " },
        mockContext,
      ),
    ).rejects.toThrow("name is required.");
  });
});

describe("deleteProgram", () => {
  let mockDb: MockDb;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = createMockDb();
    mockContext = createMockGraphQLContext({ db: mockDb, user: USER });
  });

  it("throws when unauthenticated", async () => {
    const ctx = createMockGraphQLContext({ db: mockDb });

    await expect(
      resolveField(deleteProgram, null, { id: "prog-1" }, ctx),
    ).rejects.toThrow("Authentication required");
  });

  it("throws when user does not own the program", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue({
      ...OWNED_PROGRAM,
      authorId: null,
    });

    await expect(
      resolveField(deleteProgram, null, { id: "prog-1" }, mockContext),
    ).rejects.toThrow("You do not own this program");
  });

  it("deletes the program and returns true", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    const result = await resolveField(
      deleteProgram,
      null,
      { id: "prog-1" },
      mockContext,
    );

    expect(result).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
  });
});

describe("createGate", () => {
  let mockDb: MockDb;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = createMockDb();
    mockContext = createMockGraphQLContext({ db: mockDb, user: USER });
  });

  it("throws when unauthenticated", async () => {
    const ctx = createMockGraphQLContext({ db: mockDb });

    await expect(
      resolveField(
        createGate,
        null,
        {
          programId: "prog-1",
          label: "Gate 1",
          question: "Q?",
          correctAnswer: "A",
          successMessage: "OK",
          sequenceOrder: 1,
        },
        ctx,
      ),
    ).rejects.toThrow("Authentication required");
  });

  it("creates a gate when authorized", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);
    mockDb.query.gates.findFirst.mockResolvedValue(null);
    const returning = vi.fn().mockResolvedValue([
      {
        id: "gate-1",
        programId: "prog-1",
        sequenceOrder: 1,
        label: "Gate 1",
        question: "Q?",
        correctAnswer: "A",
        successMessage: "OK",
        acceptanceThreshold: 0.875,
        guidanceEnabled: false,
        guidanceThreshold: 2,
      },
    ]);
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning }),
    });

    const result = await resolveField(
      createGate,
      null,
      {
        programId: "prog-1",
        label: "Gate 1",
        question: "Q?",
        correctAnswer: "A",
        successMessage: "OK",
        sequenceOrder: 1,
      },
      mockContext,
    );

    expect(result.id).toBe("gate-1");
    expect(result.sequenceOrder).toBe(1);
  });

  it("throws when sequence order collides", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "existing-gate",
      programId: "prog-1",
      sequenceOrder: 1,
    });

    await expect(
      resolveField(
        createGate,
        null,
        {
          programId: "prog-1",
          label: "Gate 2",
          question: "Q?",
          correctAnswer: "A",
          successMessage: "OK",
          sequenceOrder: 1,
        },
        mockContext,
      ),
    ).rejects.toThrow("Sequence order 1 is already taken");
  });

  it("throws when sequenceOrder is zero", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(
        createGate,
        null,
        {
          programId: "prog-1",
          label: "Gate",
          question: "Q?",
          correctAnswer: "A",
          successMessage: "OK",
          sequenceOrder: 0,
        },
        mockContext,
      ),
    ).rejects.toThrow("sequenceOrder must be a positive integer.");
  });

  it("throws when sequenceOrder is negative", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(
        createGate,
        null,
        {
          programId: "prog-1",
          label: "Gate",
          question: "Q?",
          correctAnswer: "A",
          successMessage: "OK",
          sequenceOrder: -1,
        },
        mockContext,
      ),
    ).rejects.toThrow("sequenceOrder must be a positive integer.");
  });

  it("throws when label is blank", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(
        createGate,
        null,
        {
          programId: "prog-1",
          label: "   ",
          question: "Q?",
          correctAnswer: "A",
          successMessage: "OK",
          sequenceOrder: 1,
        },
        mockContext,
      ),
    ).rejects.toThrow("label is required.");
  });

  it("throws when guidanceThreshold is below 1", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(
        createGate,
        null,
        {
          programId: "prog-1",
          label: "Gate",
          question: "Q?",
          correctAnswer: "A",
          successMessage: "OK",
          sequenceOrder: 1,
          guidanceThreshold: 0,
        },
        mockContext,
      ),
    ).rejects.toThrow("guidanceThreshold must be an integer between 1 and 3.");
  });

  it("throws when guidanceThreshold exceeds the max clues", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(
        createGate,
        null,
        {
          programId: "prog-1",
          label: "Gate",
          question: "Q?",
          correctAnswer: "A",
          successMessage: "OK",
          sequenceOrder: 1,
          guidanceThreshold: 4,
        },
        mockContext,
      ),
    ).rejects.toThrow("guidanceThreshold must be an integer between 1 and 3.");
  });
});

describe("updateGate", () => {
  let mockDb: MockDb;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = createMockDb();
    mockContext = createMockGraphQLContext({ db: mockDb, user: USER });
  });

  it("throws when unauthenticated", async () => {
    const ctx = createMockGraphQLContext({ db: mockDb });

    await expect(
      resolveField(updateGate, null, { id: "gate-1", label: "New" }, ctx),
    ).rejects.toThrow("Authentication required");
  });

  it("updates gate when authorized", async () => {
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-1",
      programId: "prog-1",
      label: "Old",
    });
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);
    const returning = vi.fn().mockResolvedValue([
      {
        id: "gate-1",
        programId: "prog-1",
        sequenceOrder: 1,
        label: "New Label",
        question: "Q?",
        correctAnswer: "A",
        successMessage: "OK",
        acceptanceThreshold: 0.875,
        guidanceEnabled: false,
        guidanceThreshold: 2,
      },
    ]);
    mockDb.update.mockReturnValue({
      set: vi
        .fn()
        .mockReturnValue({ where: vi.fn().mockReturnValue({ returning }) }),
    });

    const result = await resolveField(
      updateGate,
      null,
      { id: "gate-1", label: "New Label" },
      mockContext,
    );

    expect(result.label).toBe("New Label");
  });

  it("throws when gate not found", async () => {
    mockDb.query.gates.findFirst.mockResolvedValue(null);

    await expect(
      resolveField(
        updateGate,
        null,
        { id: "missing", label: "Nope" },
        mockContext,
      ),
    ).rejects.toThrow("Gate not found.");
  });

  it("throws when user does not own the gate's program", async () => {
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-1",
      programId: "prog-1",
    });
    mockDb.query.programs.findFirst.mockResolvedValue({
      ...OWNED_PROGRAM,
      authorId: OTHER_USER.id,
    });

    await expect(
      resolveField(
        updateGate,
        null,
        { id: "gate-1", label: "Nope" },
        mockContext,
      ),
    ).rejects.toThrow("You do not own this program");
  });

  it("throws when no fields to update", async () => {
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-1",
      programId: "prog-1",
    });
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(updateGate, null, { id: "gate-1" }, mockContext),
    ).rejects.toThrow("No fields to update.");
  });

  it("throws when sequenceOrder is zero", async () => {
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-1",
      programId: "prog-1",
      sequenceOrder: 1,
    });
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(
        updateGate,
        null,
        { id: "gate-1", sequenceOrder: 0 },
        mockContext,
      ),
    ).rejects.toThrow("sequenceOrder must be a positive integer.");
  });

  it("throws when label is blank", async () => {
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-1",
      programId: "prog-1",
    });
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(
        updateGate,
        null,
        { id: "gate-1", label: "   " },
        mockContext,
      ),
    ).rejects.toThrow("label is required.");
  });

  it("throws when guidanceThreshold is out of range", async () => {
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-1",
      programId: "prog-1",
    });
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    await expect(
      resolveField(
        updateGate,
        null,
        { id: "gate-1", guidanceThreshold: 4 },
        mockContext,
      ),
    ).rejects.toThrow("guidanceThreshold must be an integer between 1 and 3.");
  });
});

describe("deleteGate", () => {
  let mockDb: MockDb;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = createMockDb();
    mockContext = createMockGraphQLContext({ db: mockDb, user: USER });
  });

  it("throws when unauthenticated", async () => {
    const ctx = createMockGraphQLContext({ db: mockDb });

    await expect(
      resolveField(deleteGate, null, { id: "gate-1" }, ctx),
    ).rejects.toThrow("Authentication required");
  });

  it("deletes gate when authorized", async () => {
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-1",
      programId: "prog-1",
    });
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);

    const result = await resolveField(
      deleteGate,
      null,
      { id: "gate-1" },
      mockContext,
    );

    expect(result).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
  });

  it("throws when gate not found", async () => {
    mockDb.query.gates.findFirst.mockResolvedValue(null);

    await expect(
      resolveField(deleteGate, null, { id: "missing" }, mockContext),
    ).rejects.toThrow("Gate not found.");
  });

  it("throws when user does not own the gate's program", async () => {
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-1",
      programId: "prog-1",
    });
    mockDb.query.programs.findFirst.mockResolvedValue({
      ...OWNED_PROGRAM,
      authorId: OTHER_USER.id,
    });

    await expect(
      resolveField(deleteGate, null, { id: "gate-1" }, mockContext),
    ).rejects.toThrow("You do not own this program");
  });
});

describe("reorderGates", () => {
  let mockDb: MockDb;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = createMockDb();
    mockContext = createMockGraphQLContext({ db: mockDb, user: USER });
  });

  it("throws when unauthenticated", async () => {
    const ctx = createMockGraphQLContext({ db: mockDb });

    await expect(
      resolveField(
        reorderGates,
        null,
        { programId: "prog-1", orderedGateIds: ["a", "b"] },
        ctx,
      ),
    ).rejects.toThrow("Authentication required");
  });

  it("reorders gates atomically via single db.batch", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);
    const mockOrderBy = vi
      .fn()
      .mockResolvedValue([
        { id: "gate-a" },
        { id: "gate-b" },
        { id: "gate-c" },
      ]);
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: mockOrderBy,
        }),
      }),
    });

    const result = await resolveField(
      reorderGates,
      null,
      { programId: "prog-1", orderedGateIds: ["gate-c", "gate-a", "gate-b"] },
      mockContext,
    );

    expect(result).toBe(true);
    expect(mockDb.update).toHaveBeenCalledTimes(6);
    expect(mockDb.batch).toHaveBeenCalledTimes(1);
  });

  it("throws on wrong number of gate IDs", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);
    const mockOrderBy = vi
      .fn()
      .mockResolvedValue([{ id: "gate-a" }, { id: "gate-b" }]);
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: mockOrderBy,
        }),
      }),
    });

    await expect(
      resolveField(
        reorderGates,
        null,
        { programId: "prog-1", orderedGateIds: ["gate-a"] },
        mockContext,
      ),
    ).rejects.toThrow("Expected 2 gate IDs, got 1");
  });

  it("throws on duplicate gate IDs", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);
    const mockOrderBy = vi
      .fn()
      .mockResolvedValue([{ id: "gate-a" }, { id: "gate-b" }]);
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: mockOrderBy,
        }),
      }),
    });

    await expect(
      resolveField(
        reorderGates,
        null,
        { programId: "prog-1", orderedGateIds: ["gate-a", "gate-a"] },
        mockContext,
      ),
    ).rejects.toThrow("Duplicate gate IDs");
  });

  it("throws on non-permutation gate IDs", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);
    const mockOrderBy = vi
      .fn()
      .mockResolvedValue([{ id: "gate-a" }, { id: "gate-b" }]);
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: mockOrderBy,
        }),
      }),
    });

    await expect(
      resolveField(
        reorderGates,
        null,
        { programId: "prog-1", orderedGateIds: ["gate-a", "gate-x"] },
        mockContext,
      ),
    ).rejects.toThrow("exact permutation");
  });

  it("returns true immediately for zero-gate program", async () => {
    mockDb.query.programs.findFirst.mockResolvedValue(OWNED_PROGRAM);
    const mockOrderBy = vi.fn().mockResolvedValue([]);
    mockDb.select.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: mockOrderBy,
        }),
      }),
    });

    const result = await resolveField(
      reorderGates,
      null,
      { programId: "prog-1", orderedGateIds: [] },
      mockContext,
    );

    expect(result).toBe(true);
    expect(mockDb.batch).not.toHaveBeenCalled();
  });
});
