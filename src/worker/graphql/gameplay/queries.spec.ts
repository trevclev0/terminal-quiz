import type { Program } from "@shared/types";
import type { AuthUser } from "@worker-middleware/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { me } from "./authQueries";
import {
  getPrograms,
  myPrograms,
  program,
  programGates,
} from "./programQueries";
import { getInProgressProgram, getProgramProgression } from "./sessionQueries";
import type { AppGraphQLContext } from "./types";

function createMockDb() {
  const mockOrderBy = vi.fn();
  const mockLimit = vi.fn();
  const mockWhere = vi.fn().mockReturnValue({
    orderBy: mockOrderBy,
    limit: mockLimit,
  });
  const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
  return {
    query: {
      sessionProgress: { findFirst: vi.fn() },
      programs: { findFirst: vi.fn() },
      gates: { findFirst: vi.fn(), findMany: vi.fn() },
      sessionCompletedGates: { findMany: vi.fn() },
    },
    select: vi.fn().mockReturnValue({ from: mockFrom }),
    mockOrderBy,
    mockWhere,
    mockFrom,
    mockLimit,
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn(),
      }),
    }),
  };
}

type MockDb = ReturnType<typeof createMockDb>;

const defaultGate = {
  id: "gate-1",
  label: "Gate 1",
  question: "Question 1",
  sequenceOrder: 1,
  correctAnswer: "answer-1",
  successMessage: "OK",
};

const defaultProgress = {
  id: "progress-1",
  currentGateId: "gate-1",
  status: "in_progress",
};

function contextWith(
  db: MockDb,
  sessionId?: string,
  user?: AuthUser,
): AppGraphQLContext {
  return {
    get: vi.fn((key: string) => {
      if (key === "db") return db;
      if (key === "sessionId") return sessionId;
      if (key === "user") return user;
      return undefined;
    }),
  } as unknown as AppGraphQLContext;
}

const SID = "mock-session-id";

function resolveField<T, TArgs extends unknown[]>(
  field: { resolve?: (...args: TArgs) => T },
  ...args: TArgs
): T {
  if (!field.resolve) throw new Error("Resolver not defined");
  return field.resolve(...args);
}

describe("getProgramProgression", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it("throws when sessionId is missing", async () => {
    const ctx = contextWith(mockDb, undefined);

    await expect(
      resolveField(getProgramProgression, null, { programId: "prog-1" }, ctx),
    ).rejects.toThrow(/Unauthorized/);
  });

  it("returns progression for existing session with completed gates", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      currentGateId: "gate-2",
    });
    mockDb.query.sessionCompletedGates.findMany.mockResolvedValue([
      { gateId: "gate-1" },
    ]);
    mockDb.query.gates.findMany.mockResolvedValue([defaultGate]);
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-2",
      label: "Gate 2",
      question: "Question 2",
      sequenceOrder: 2,
    });

    const result = await resolveField(
      getProgramProgression,
      null,
      { programId: "prog-1" },
      contextWith(mockDb, SID),
    );

    expect(result.completedGates).toHaveLength(1);
    expect(result.completedGates[0].id).toBe("gate-1");
    expect(result.currentGate?.id).toBe("gate-2");
    expect(result.status).toBe("in_progress");
  });

  it("skips completed gate query when none are completed", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue(defaultProgress);
    mockDb.query.sessionCompletedGates.findMany.mockResolvedValue([]);
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);

    const result = await resolveField(
      getProgramProgression,
      null,
      { programId: "prog-1" },
      contextWith(mockDb, SID),
    );

    expect(result.completedGates).toEqual([]);
    expect(mockDb.query.gates.findMany).not.toHaveBeenCalled();
  });

  it("returns null currentGate when currentGateId is null (program completed)", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      currentGateId: null,
      status: "completed",
    });
    mockDb.query.sessionCompletedGates.findMany.mockResolvedValue([]);

    const result = await resolveField(
      getProgramProgression,
      null,
      { programId: "prog-1" },
      contextWith(mockDb, SID),
    );

    expect(result.currentGate).toBeNull();
    expect(result.status).toBe("completed");
  });

  it("initializes new session when none exists", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue(null);
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);

    const returning = vi.fn().mockResolvedValue([
      {
        id: "new-progress-1",
        currentGateId: "gate-1",
        status: "in_progress",
      },
    ]);
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning }),
    });

    mockDb.query.sessionCompletedGates.findMany.mockResolvedValue([]);

    const result = await resolveField(
      getProgramProgression,
      null,
      { programId: "prog-1" },
      contextWith(mockDb, SID),
    );

    expect(result.currentGate?.id).toBe("gate-1");
    expect(result.completedGates).toEqual([]);
    expect(mockDb.query.gates.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        columns: { correctAnswer: false },
        where: expect.anything(),
      }),
    );
  });

  it("retries fetch on concurrent insert conflict", async () => {
    const existingProgress = {
      id: "existing-progress-1",
      currentGateId: "gate-1",
      status: "in_progress",
    };

    mockDb.query.sessionProgress.findFirst
      .mockResolvedValueOnce(null) // first check: no session
      .mockResolvedValueOnce(existingProgress); // retry after conflict
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);

    const returning = vi.fn().mockRejectedValue(new Error("UNIQUE constraint"));
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning }),
    });

    mockDb.query.sessionCompletedGates.findMany.mockResolvedValue([]);

    const result = await resolveField(
      getProgramProgression,
      null,
      { programId: "prog-1" },
      contextWith(mockDb, SID),
    );

    expect(result.currentGate?.id).toBe("gate-1");
  });

  it("throws when session init fails on both insert and retry", async () => {
    mockDb.query.sessionProgress.findFirst
      .mockResolvedValueOnce(null) // first check
      .mockResolvedValueOnce(null); // retry still fails

    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);

    const returning = vi.fn().mockRejectedValue(new Error("UNIQUE constraint"));
    mockDb.insert.mockReturnValue({
      values: vi.fn().mockReturnValue({ returning }),
    });

    await expect(
      resolveField(
        getProgramProgression,
        null,
        { programId: "prog-1" },
        contextWith(mockDb, SID),
      ),
    ).rejects.toThrow("Failed to initialize session progression.");
  });

  it("throws when program has no gates", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue(null);
    mockDb.query.gates.findFirst.mockResolvedValue(null);

    await expect(
      resolveField(
        getProgramProgression,
        null,
        { programId: "prog-1" },
        contextWith(mockDb, SID),
      ),
    ).rejects.toThrow("Program not found or has no gates.");
  });
});

describe("getInProgressProgram", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it("throws when sessionId is missing", async () => {
    const ctx = contextWith(mockDb, undefined);

    await expect(
      resolveField(getInProgressProgram, null, {}, ctx),
    ).rejects.toThrow(/Unauthorized/);
  });

  it("returns programId when in-progress session exists", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      programId: "prog-1",
    });

    const result = await resolveField(
      getInProgressProgram,
      null,
      {},
      contextWith(mockDb, SID),
    );

    expect(result).toBe("prog-1");
  });

  it("returns null when no in-progress session exists", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue(null);

    const result = await resolveField(
      getInProgressProgram,
      null,
      {},
      contextWith(mockDb, SID),
    );

    expect(result).toBeNull();
  });
});

describe("getPrograms", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it("returns public programs when unauthenticated", async () => {
    const publicPrograms = [
      { id: "prog-1", name: "Program 1", visibility: "public", authorId: null },
      { id: "prog-2", name: "Program 2", visibility: "public", authorId: null },
    ];
    mockDb.mockOrderBy.mockResolvedValue(publicPrograms);

    const result = await resolveField(
      getPrograms,
      null,
      {},
      contextWith(mockDb),
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("prog-1");
  });

  it("includes owned programs when authenticated", async () => {
    const user: AuthUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test",
    };
    const programs = [
      { id: "prog-1", name: "Public", visibility: "public", authorId: null },
      {
        id: "prog-2",
        name: "Owned",
        visibility: "unlisted",
        authorId: "user-1",
      },
    ];
    mockDb.mockOrderBy.mockResolvedValue(programs);

    const result = await resolveField(
      getPrograms,
      null,
      {},
      contextWith(mockDb, undefined, user),
    );

    expect(result).toHaveLength(2);
  });

  it("calls db.select with or filter for public or owned", async () => {
    const user: AuthUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test",
    };
    mockDb.mockOrderBy.mockResolvedValue([]);

    await resolveField(
      getPrograms,
      null,
      {},
      contextWith(mockDb, undefined, user),
    );

    expect(mockDb.mockWhere).toHaveBeenCalledOnce();
  });
});

describe("myPrograms", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it("returns null when unauthenticated", async () => {
    const result = await resolveField(
      myPrograms,
      null,
      {},
      contextWith(mockDb),
    );

    expect(result).toBeNull();
  });

  it("returns empty array when authenticated but has no programs", async () => {
    const user: AuthUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test",
    };
    mockDb.mockOrderBy.mockResolvedValue([]);

    const result = await resolveField(
      myPrograms,
      null,
      {},
      contextWith(mockDb, undefined, user),
    );

    expect(result).toEqual([]);
  });

  it("returns list of owned programs", async () => {
    const user: AuthUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test",
    };
    const owned = [
      {
        id: "prog-1",
        name: "My Program",
        visibility: "public",
        authorId: "user-1",
      },
      {
        id: "prog-2",
        name: "Secret Program",
        visibility: "unlisted",
        authorId: "user-1",
      },
    ];
    mockDb.mockOrderBy.mockResolvedValue(owned);

    const result = await resolveField(
      myPrograms,
      null,
      {},
      contextWith(mockDb, undefined, user),
    );

    const programs = result as Program[];
    expect(programs).toHaveLength(2);
    expect(programs[0].id).toBe("prog-1");
    expect(programs[1].visibility).toBe("unlisted");
  });

  it("filters by authorId", async () => {
    const user: AuthUser = {
      id: "user-42",
      email: "test@example.com",
      name: "Test",
    };
    mockDb.mockOrderBy.mockResolvedValue([]);

    await resolveField(
      myPrograms,
      null,
      {},
      contextWith(mockDb, undefined, user),
    );

    expect(mockDb.mockWhere).toHaveBeenCalledOnce();
  });
});

describe("program", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  const unlistedProgram = {
    id: "prog-1",
    name: "Unlisted Program",
    visibility: "unlisted",
    authorId: null,
  };

  it("returns a program by ID", async () => {
    mockDb.mockLimit.mockResolvedValue([unlistedProgram]);

    const result = await resolveField(
      program,
      null,
      { id: "prog-1" },
      contextWith(mockDb),
    );

    expect(result).toEqual(unlistedProgram);
  });

  it("returns null when no program matches", async () => {
    mockDb.mockLimit.mockResolvedValue([]);

    const result = await resolveField(
      program,
      null,
      { id: "missing" },
      contextWith(mockDb),
    );

    expect(result).toBeNull();
  });

  it("returns an unlisted program to an anonymous caller", async () => {
    mockDb.mockLimit.mockResolvedValue([unlistedProgram]);

    const result = await resolveField(
      program,
      null,
      { id: "prog-1" },
      contextWith(mockDb),
    );

    expect(result).toEqual(unlistedProgram);
  });

  it("filters by the requested ID", async () => {
    mockDb.mockLimit.mockResolvedValue([]);

    await resolveField(program, null, { id: "prog-42" }, contextWith(mockDb));

    expect(mockDb.mockWhere).toHaveBeenCalledOnce();
  });
});

describe("me", () => {
  it("returns null when no user in context", async () => {
    const ctx = contextWith(createMockDb());

    const result = await resolveField(me, null, {}, ctx);

    expect(result).toBeNull();
  });

  it("returns user when user is set in context", async () => {
    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      name: "Test",
      image: null,
    };
    const ctx = {
      get: vi.fn((key: string) => {
        if (key === "user") return mockUser;
        return undefined;
      }),
    } as unknown as AppGraphQLContext;

    const result = await resolveField(me, null, {}, ctx);

    expect(result).toEqual(mockUser);
  });
});

describe("programGates", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  it("throws when unauthenticated", async () => {
    await expect(
      resolveField(
        programGates,
        null,
        { programId: "prog-1" },
        contextWith(mockDb),
      ),
    ).rejects.toThrow("Unauthorized: Authentication required.");
  });

  it("returns gates when authorized", async () => {
    const user = {
      id: "user-1",
      email: "test@example.com",
      name: "Test",
    };
    const ownedProgram = {
      id: "prog-1",
      name: "My Program",
      authorId: "user-1",
      visibility: "public",
      createdAt: new Date(),
    };
    const gateRows = [
      {
        id: "gate-1",
        programId: "prog-1",
        sequenceOrder: 1,
        label: "Gate 1",
        question: "Question 1",
        correctAnswer: "answer-1",
        successMessage: "OK",
        acceptanceThreshold: 0.875,
        guidanceEnabled: false,
        guidanceThreshold: 3,
      },
      {
        id: "gate-2",
        programId: "prog-1",
        sequenceOrder: 2,
        label: "Gate 2",
        question: "Question 2",
        correctAnswer: "answer-2",
        successMessage: "OK",
        acceptanceThreshold: 0.875,
        guidanceEnabled: false,
        guidanceThreshold: 3,
      },
    ];

    mockDb.query.programs.findFirst.mockResolvedValue(ownedProgram);
    mockDb.mockOrderBy.mockResolvedValue(gateRows);

    const result = await resolveField(
      programGates,
      null,
      { programId: "prog-1" },
      contextWith(mockDb, undefined, user),
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("gate-1");
    expect(result[1].id).toBe("gate-2");
    expect(result[0].sequenceOrder).toBe(1);
  });

  it("orders gates by sequenceOrder", async () => {
    const user = {
      id: "user-1",
      email: "test@example.com",
      name: "Test",
    };
    mockDb.query.programs.findFirst.mockResolvedValue({
      id: "prog-1",
      name: "My Program",
      authorId: "user-1",
      visibility: "public",
      createdAt: new Date(),
    });

    await resolveField(
      programGates,
      null,
      { programId: "prog-1" },
      contextWith(mockDb, undefined, user),
    );

    expect(mockDb.mockOrderBy).toHaveBeenCalledOnce();
  });
});
