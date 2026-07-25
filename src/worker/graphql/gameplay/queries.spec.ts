import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getInProgressProgram,
  getProgramProgression,
  getPrograms,
} from "./queries";
import type { AppGraphQLContext } from "./types";

function createMockDb() {
  return {
    query: {
      sessionProgress: { findFirst: vi.fn() },
      gates: { findFirst: vi.fn(), findMany: vi.fn() },
      sessionCompletedGates: { findMany: vi.fn() },
      programs: { findMany: vi.fn() },
    },
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

function contextWith(db: MockDb, sessionId?: string): AppGraphQLContext {
  return {
    get: vi.fn((key: string) => {
      if (key === "db") return db;
      if (key === "sessionId") return sessionId;
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

  it("throws when sessionId is missing", async () => {
    const ctx = contextWith(mockDb, undefined);

    await expect(resolveField(getPrograms, null, {}, ctx)).rejects.toThrow(
      /Unauthorized/,
    );
  });

  it("returns list of programs", async () => {
    mockDb.query.programs.findMany.mockResolvedValue([
      { id: "prog-1", name: "Program 1" },
      { id: "prog-2", name: "Program 2" },
    ]);

    const result = await resolveField(
      getPrograms,
      null,
      {},
      contextWith(mockDb, SID),
    );

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("prog-1");
  });
});
