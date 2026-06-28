import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestClue, submitGuess } from "./mutations";
import type { AppGraphQLContext } from "./queries";

vi.mock("../../utils/isGuessCloseEnough", () => ({
  default: vi.fn(),
}));

vi.mock("../../services/aiService", () => ({
  generateClue: vi.fn(),
}));

import { generateClue } from "../../services/aiService";
import isGuessCloseEnough from "../../utils/isGuessCloseEnough";

type MockDb = {
  query: {
    sessionProgress: { findFirst: ReturnType<typeof vi.fn> };
    gates: { findFirst: ReturnType<typeof vi.fn> };
    gateClues: { findMany: ReturnType<typeof vi.fn> };
  };
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
};

function createMockDb(): MockDb {
  return {
    query: {
      sessionProgress: { findFirst: vi.fn() },
      gates: { findFirst: vi.fn() },
      gateClues: { findMany: vi.fn().mockResolvedValue([]) },
    },
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
  };
}

function createMockContext(mockDb: MockDb): AppGraphQLContext {
  return {
    get: vi.fn((key: string) => {
      if (key === "db") return mockDb;
      if (key === "sessionId") return "mock-session-123";
      return undefined;
    }),
  } as unknown as AppGraphQLContext;
}

const defaultGate = {
  id: "gate-1",
  correctAnswer: "apple",
  sequenceOrder: 1,
  successMessage: "OK",
  guidanceEnabled: true,
  guidanceThreshold: 2,
  question: "What fruit keeps the doctor away?",
};

const defaultProgress = {
  id: "progress-1",
  status: "in_progress",
  currentGateId: "gate-1",
  completedGateIds: "[]",
  attemptCount: 0,
};

describe("Gameplay Mutations: submitGuess", () => {
  let mockDb: MockDb;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = createMockDb();
    mockContext = createMockContext(mockDb);
    vi.mocked(isGuessCloseEnough).mockReset();
    vi.mocked(generateClue).mockReset();
  });

  it("returns false and increments attemptCount if guess is incorrect", async () => {
    mockDb.query.sessionProgress.findFirst
      .mockResolvedValueOnce(defaultProgress)
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 1,
      });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    vi.mocked(isGuessCloseEnough).mockReturnValue(false);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    const result = await submitGuess.resolve(
      null,
      { programId: "prog-1", gateId: "gate-1", guess: "banana" },
      mockContext,
    );

    expect(result.success).toBe(false);
    expect(result.canRequestClue).toBe(false);
    expect(mockDb.update).toHaveBeenCalled();
    const setCall = mockDb.update.mock.results[0]?.value.set;
    expect(setCall).toHaveBeenCalledWith(
      expect.objectContaining({
        attemptCount: expect.anything(),
      }),
    );
  });

  it("returns canRequestClue true when guidance threshold is met", async () => {
    mockDb.query.sessionProgress.findFirst
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 1,
      })
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 2,
      });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    mockDb.query.gateClues.findMany.mockResolvedValue([]);
    vi.mocked(isGuessCloseEnough).mockReturnValue(false);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    const result = await submitGuess.resolve(
      null,
      { programId: "prog-1", gateId: "gate-1", guess: "banana" },
      mockContext,
    );

    expect(result.canRequestClue).toBe(true);
  });

  it("returns canRequestClue false when guidance is disabled", async () => {
    mockDb.query.sessionProgress.findFirst
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 5,
      })
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 6,
      });
    mockDb.query.gates.findFirst.mockResolvedValue({
      ...defaultGate,
      guidanceEnabled: false,
    });
    mockDb.query.gateClues.findMany.mockResolvedValue([]);
    vi.mocked(isGuessCloseEnough).mockReturnValue(false);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    const result = await submitGuess.resolve(
      null,
      { programId: "prog-1", gateId: "gate-1", guess: "banana" },
      mockContext,
    );

    expect(result.canRequestClue).toBe(false);
  });

  it("returns canRequestClue false when max clues reached", async () => {
    mockDb.query.sessionProgress.findFirst
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 5,
      })
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 6,
      });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    mockDb.query.gateClues.findMany.mockResolvedValue([
      { attemptCountAtRequest: 2 },
      { attemptCountAtRequest: 3 },
      { attemptCountAtRequest: 4 },
    ]);
    vi.mocked(isGuessCloseEnough).mockReturnValue(false);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    const result = await submitGuess.resolve(
      null,
      { programId: "prog-1", gateId: "gate-1", guess: "banana" },
      mockContext,
    );

    expect(result.canRequestClue).toBe(false);
  });

  it("returns canRequestClue false when no new attempt since last clue", async () => {
    mockDb.query.sessionProgress.findFirst
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 2,
      })
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 3,
      });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    mockDb.query.gateClues.findMany.mockResolvedValue([
      { attemptCountAtRequest: 3 },
    ]);
    vi.mocked(isGuessCloseEnough).mockReturnValue(false);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    const result = await submitGuess.resolve(
      null,
      { programId: "prog-1", gateId: "gate-1", guess: "banana" },
      mockContext,
    );

    expect(result.canRequestClue).toBe(false);
  });

  it("returns canRequestClue true after a new attempt since last clue", async () => {
    mockDb.query.sessionProgress.findFirst
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 3,
      })
      .mockResolvedValueOnce({
        ...defaultProgress,
        attemptCount: 4,
      });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    mockDb.query.gateClues.findMany.mockResolvedValue([
      { attemptCountAtRequest: 3 },
    ]);
    vi.mocked(isGuessCloseEnough).mockReturnValue(false);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    const result = await submitGuess.resolve(
      null,
      { programId: "prog-1", gateId: "gate-1", guess: "banana" },
      mockContext,
    );

    expect(result.canRequestClue).toBe(true);
  });

  it("returns true, resets attemptCount, and sets canRequestClue false on correct guess", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      currentGateId: "gate-2",
      attemptCount: 4,
    });
    mockDb.query.gates.findFirst
      .mockResolvedValueOnce({
        id: "gate-2",
        correctAnswer: "banana",
        sequenceOrder: 2,
        successMessage: "Well done!",
        guidanceEnabled: true,
        guidanceThreshold: 2,
      })
      .mockResolvedValueOnce(null);
    vi.mocked(isGuessCloseEnough).mockReturnValue(true);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    const result = await submitGuess.resolve(
      null,
      { programId: "prog-2", gateId: "gate-2", guess: "banana" },
      mockContext,
    );

    expect(result.success).toBe(true);
    expect(result.canRequestClue).toBe(false);
    const setCall = mockDb.update.mock.results[0]?.value.set;
    expect(setCall).toHaveBeenCalledWith(
      expect.objectContaining({ attemptCount: 0 }),
    );
  });
});

describe("Gameplay Mutations: requestClue", () => {
  let mockDb: MockDb;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = createMockDb();
    mockContext = createMockContext(mockDb);
    vi.mocked(generateClue).mockReset();
  });

  it("throws when session ID is missing", async () => {
    const contextWithoutSession = {
      get: vi.fn((key: string) => {
        if (key === "db") return mockDb;
        return undefined;
      }),
    } as unknown as AppGraphQLContext;

    if (!requestClue.resolve) throw new Error("Resolver not defined");

    await expect(
      requestClue.resolve(
        null,
        {
          programId: "prog-1",
          gateId: "gate-1",
          currentGuess: "banana",
        },
        contextWithoutSession,
      ),
    ).rejects.toThrow("Unauthorized: Missing Session ID");
  });

  it("throws when gate ID does not match current gate", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      currentGateId: "gate-other",
    });

    if (!requestClue.resolve) throw new Error("Resolver not defined");

    await expect(
      requestClue.resolve(
        null,
        {
          programId: "prog-1",
          gateId: "gate-1",
          currentGuess: "banana",
        },
        mockContext,
      ),
    ).rejects.toThrow("Desync: Clue requested for the wrong active gate.");
  });

  it("throws when currentGuess is empty", async () => {
    if (!requestClue.resolve) throw new Error("Resolver not defined");

    await expect(
      requestClue.resolve(
        null,
        {
          programId: "prog-1",
          gateId: "gate-1",
          currentGuess: "   ",
        },
        mockContext,
      ),
    ).rejects.toThrow("Invalid current guess length.");
  });

  it("throws when currentGuess exceeds max length", async () => {
    if (!requestClue.resolve) throw new Error("Resolver not defined");

    await expect(
      requestClue.resolve(
        null,
        {
          programId: "prog-1",
          gateId: "gate-1",
          currentGuess: "a".repeat(501),
        },
        mockContext,
      ),
    ).rejects.toThrow("Invalid current guess length.");
  });

  it("returns no clue when guidance is disabled", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      attemptCount: 5,
    });
    mockDb.query.gates.findFirst.mockResolvedValue({
      ...defaultGate,
      guidanceEnabled: false,
    });
    mockDb.query.gateClues.findMany.mockResolvedValue([]);

    if (!requestClue.resolve) throw new Error("Resolver not defined");

    const result = await requestClue.resolve(
      null,
      {
        programId: "prog-1",
        gateId: "gate-1",
        currentGuess: "banana",
      },
      mockContext,
    );

    expect(result).toEqual({
      clueText: null,
      isClueLimitReached: false,
      cluesRemaining: 3,
    });
    expect(generateClue).not.toHaveBeenCalled();
  });

  it("returns clue limit reached when max clues exist", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      attemptCount: 10,
    });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    mockDb.query.gateClues.findMany.mockResolvedValue([
      { clueText: "clue 1", attemptCountAtRequest: 2 },
      { clueText: "clue 2", attemptCountAtRequest: 4 },
      { clueText: "clue 3", attemptCountAtRequest: 6 },
    ]);

    if (!requestClue.resolve) throw new Error("Resolver not defined");

    const result = await requestClue.resolve(
      null,
      {
        programId: "prog-1",
        gateId: "gate-1",
        currentGuess: "banana",
      },
      mockContext,
    );

    expect(result).toEqual({
      clueText: null,
      isClueLimitReached: true,
      cluesRemaining: 0,
    });
    expect(generateClue).not.toHaveBeenCalled();
  });

  it("returns no clue when one-clue-per-attempt rule is not met", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      attemptCount: 3,
    });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    mockDb.query.gateClues.findMany.mockResolvedValue([
      { clueText: "clue 1", attemptCountAtRequest: 3 },
    ]);

    if (!requestClue.resolve) throw new Error("Resolver not defined");

    const result = await requestClue.resolve(
      null,
      {
        programId: "prog-1",
        gateId: "gate-1",
        currentGuess: "banana",
      },
      mockContext,
    );

    expect(result.clueText).toBeNull();
    expect(result.isClueLimitReached).toBe(false);
    expect(generateClue).not.toHaveBeenCalled();
  });

  it("generates, persists, and returns a new clue when eligible", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      attemptCount: 3,
    });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    mockDb.query.gateClues.findMany.mockResolvedValue([
      { clueText: "It grows on trees.", attemptCountAtRequest: 2 },
      { clueText: "Think about doctors.", attemptCountAtRequest: 1 },
    ]);
    vi.mocked(generateClue).mockResolvedValue("It is often red or green.");

    if (!requestClue.resolve) throw new Error("Resolver not defined");

    const result = await requestClue.resolve(
      null,
      {
        programId: "prog-1",
        gateId: "gate-1",
        currentGuess: "banana",
      },
      mockContext,
    );

    expect(generateClue).toHaveBeenCalledWith(
      mockContext,
      defaultGate.question,
      defaultGate.correctAnswer,
      "banana",
      ["Think about doctors.", "It grows on trees."],
    );
    expect(mockDb.insert).toHaveBeenCalled();
    const valuesCall = mockDb.insert.mock.results[0]?.value.values;
    expect(valuesCall).toHaveBeenCalledWith({
      sessionProgressId: "progress-1",
      gateId: "gate-1",
      clueText: "It is often red or green.",
      attemptCountAtRequest: 3,
    });
    expect(result).toEqual({
      clueText: "It is often red or green.",
      isClueLimitReached: true,
      cluesRemaining: 0,
    });
  });

  it("returns no clue when AI generation fails", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      attemptCount: 2,
    });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    mockDb.query.gateClues.findMany.mockResolvedValue([]);
    vi.mocked(generateClue).mockResolvedValue(null);

    if (!requestClue.resolve) throw new Error("Resolver not defined");

    const result = await requestClue.resolve(
      null,
      {
        programId: "prog-1",
        gateId: "gate-1",
        currentGuess: "banana",
      },
      mockContext,
    );

    expect(result.clueText).toBeNull();
    expect(result.isClueLimitReached).toBe(false);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("marks clue limit reached after the third clue is generated", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      attemptCount: 8,
    });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    mockDb.query.gateClues.findMany.mockResolvedValue([
      { clueText: "clue 1", attemptCountAtRequest: 2 },
      { clueText: "clue 2", attemptCountAtRequest: 5 },
    ]);
    vi.mocked(generateClue).mockResolvedValue("Final hint.");

    if (!requestClue.resolve) throw new Error("Resolver not defined");

    const result = await requestClue.resolve(
      null,
      {
        programId: "prog-1",
        gateId: "gate-1",
        currentGuess: "banana",
      },
      mockContext,
    );

    expect(result).toEqual({
      clueText: "Final hint.",
      isClueLimitReached: true,
      cluesRemaining: 0,
    });
  });
});
