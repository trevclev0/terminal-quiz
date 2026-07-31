import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestClue } from "./requestClueMutation";
import { resetSession } from "./resetSessionMutation";
import { submitGuess } from "./submitGuessMutation";

vi.mock("@worker-utils/isGuessCloseEnough", () => ({
  default: vi.fn(),
}));

vi.mock("@worker-services/aiService", () => ({
  generateClue: vi.fn(),
}));

import { generateClue } from "@worker-services/aiService";
import { createMockGraphQLContext } from "@worker-test-utils/mockEnv";
import isGuessCloseEnough from "@worker-utils/isGuessCloseEnough";
import type { AppGraphQLContext } from "./types";

type MockDb = {
  query: {
    sessionProgress: { findFirst: ReturnType<typeof vi.fn> };
    gates: { findFirst: ReturnType<typeof vi.fn> };
    gateClues: { findMany: ReturnType<typeof vi.fn> };
  };
  update: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  batch: ReturnType<typeof vi.fn>;
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
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    batch: vi.fn().mockImplementation((statements: Promise<unknown>[]) => {
      return Promise.all(statements);
    }),
  };
}

function createMockContext(mockDb: MockDb) {
  return createMockGraphQLContext({
    db: mockDb,
    sessionId: "mock-session-456",
  });
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

  it("throws when session ID is missing for guess submission", async () => {
    const noSessionContext = createMockGraphQLContext({ db: mockDb });

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    await expect(
      submitGuess.resolve(
        null,
        { programId: "prog-1", gateId: "gate-1", guess: "banana" },
        noSessionContext,
      ),
    ).rejects.toThrow("Unauthorized: Missing Session ID");
  });

  it("throws when guess is empty", async () => {
    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    await expect(
      submitGuess.resolve(
        null,
        { programId: "prog-1", gateId: "gate-1", guess: "" },
        mockContext,
      ),
    ).rejects.toThrow("Invalid guess length.");
  });

  it("throws when guess exceeds max length", async () => {
    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    await expect(
      submitGuess.resolve(
        null,
        { programId: "prog-1", gateId: "gate-1", guess: "a".repeat(501) },
        mockContext,
      ),
    ).rejects.toThrow("Invalid guess length.");
  });

  it("throws when program is already completed", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      status: "completed",
    });

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    await expect(
      submitGuess.resolve(
        null,
        { programId: "prog-1", gateId: "gate-1", guess: "banana" },
        mockContext,
      ),
    ).rejects.toThrow("Program already completed or not started.");
  });

  it("throws when guess submitted for wrong active gate", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      currentGateId: "other-gate",
    });

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    await expect(
      submitGuess.resolve(
        null,
        { programId: "prog-1", gateId: "gate-1", guess: "banana" },
        mockContext,
      ),
    ).rejects.toThrow("Desync: Guess submitted for the wrong active gate.");
  });

  it("throws when gate does not exist", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      currentGateId: "nonexistent",
    });
    mockDb.query.gates.findFirst.mockResolvedValue(null);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    await expect(
      submitGuess.resolve(
        null,
        { programId: "prog-1", gateId: "nonexistent", guess: "banana" },
        mockContext,
      ),
    ).rejects.toThrow("Gate with ID nonexistent not found.");
  });

  it("throws when attempt count update fails after incorrect guess", async () => {
    mockDb.query.sessionProgress.findFirst
      .mockResolvedValueOnce(defaultProgress)
      .mockResolvedValueOnce(null);
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    vi.mocked(isGuessCloseEnough).mockReturnValue(false);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    await expect(
      submitGuess.resolve(
        null,
        { programId: "prog-1", gateId: "gate-1", guess: "banana" },
        mockContext,
      ),
    ).rejects.toThrow("Failed to update attempt count.");
  });

  it("transitions to next gate when correct guess and next gate exists", async () => {
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
        successMessage: "Nice!",
        guidanceEnabled: true,
        guidanceThreshold: 2,
      })
      .mockResolvedValueOnce({ id: "gate-3" });
    vi.mocked(isGuessCloseEnough).mockReturnValue(true);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    const result = await submitGuess.resolve(
      null,
      { programId: "prog-2", gateId: "gate-2", guess: "banana" },
      mockContext,
    );

    expect(result.success).toBe(true);
    const setCall = mockDb.update.mock.results[0]?.value.set;
    expect(setCall).toHaveBeenCalledWith(
      expect.objectContaining({
        currentGateId: "gate-3",
        attemptCount: 0,
        status: "in_progress",
      }),
    );
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
    const contextWithoutSession = createMockGraphQLContext({ db: mockDb });

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

  it("throws when program is completed for clue request", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      status: "completed",
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
    ).rejects.toThrow("Program already completed or not started.");
  });

  it("throws when gate does not exist for clue request", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      currentGateId: "nonexistent",
    });
    mockDb.query.gates.findFirst.mockResolvedValue(null);

    if (!requestClue.resolve) throw new Error("Resolver not defined");

    await expect(
      requestClue.resolve(
        null,
        {
          programId: "prog-1",
          gateId: "nonexistent",
          currentGuess: "banana",
        },
        mockContext,
      ),
    ).rejects.toThrow("Gate with ID nonexistent not found.");
  });

  it("handles duplicate clue insert gracefully", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      ...defaultProgress,
      attemptCount: 3,
    });
    mockDb.query.gates.findFirst.mockResolvedValue(defaultGate);
    mockDb.query.gateClues.findMany.mockResolvedValue([]);
    vi.mocked(generateClue).mockResolvedValue("A juicy hint.");

    mockDb.insert.mockReturnValue({
      values: vi.fn().mockRejectedValue(new Error("UNIQUE constraint")),
    });

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
  });
});

describe("Gameplay Mutations: resetSession", () => {
  let mockDb: MockDb;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = createMockDb();
    mockContext = createMockContext(mockDb);
    // Suppress console.error — resolver's catch block logs on DB errors
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("throws when session ID is missing", async () => {
    const noSessionContext = createMockGraphQLContext({ db: mockDb });

    if (!resetSession.resolve) throw new Error("Resolver not defined");

    await expect(
      resetSession.resolve(null, { programId: "prog-1" }, noSessionContext),
    ).rejects.toThrow("Unauthorized: Missing Session ID");
  });

  it("resets session to initial state when session exists", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValueOnce({
      id: "progress-1",
    });
    mockDb.query.gates.findFirst.mockResolvedValueOnce({ id: "gate-1" });

    if (!resetSession.resolve) throw new Error("Resolver not defined");

    const result = await resetSession.resolve(
      null,
      { programId: "prog-1" },
      mockContext,
    );

    expect(result).toBe(true);

    expect(mockDb.batch).toHaveBeenCalledTimes(1);
    expect(mockDb.delete).toHaveBeenCalledTimes(2);
    expect(mockDb.update).toHaveBeenCalledTimes(1);

    const setCall = mockDb.update.mock.results[0]?.value.set;
    expect(setCall).toHaveBeenCalledWith({
      currentGateId: "gate-1",
      attemptCount: 0,
      status: "in_progress",
      completedAt: null,
    });
  });

  it("succeeds as no-op when no session exists", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValue(null);

    if (!resetSession.resolve) throw new Error("Resolver not defined");

    const result = await resetSession.resolve(
      null,
      { programId: "prog-1" },
      mockContext,
    );

    expect(result).toBe(true);
    // Should not touch the database if no session exists
    expect(mockDb.batch).not.toHaveBeenCalled();
    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("handles database error gracefully", async () => {
    mockDb.query.sessionProgress.findFirst.mockRejectedValue(
      new Error("DB connection lost"),
    );

    if (!resetSession.resolve) throw new Error("Resolver not defined");

    const result = await resetSession.resolve(
      null,
      { programId: "prog-1" },
      mockContext,
    );

    expect(result).toBe(false);
  });

  it("resets to null currentGate when no first gate is found", async () => {
    mockDb.query.sessionProgress.findFirst.mockResolvedValueOnce({
      id: "progress-1",
    });
    mockDb.query.gates.findFirst.mockResolvedValueOnce(null);

    if (!resetSession.resolve) throw new Error("Resolver not defined");

    const result = await resetSession.resolve(
      null,
      { programId: "prog-empty" },
      mockContext,
    );

    expect(result).toBe(true);
    const setCall = mockDb.update.mock.results[0]?.value.set;
    expect(setCall).toHaveBeenCalledWith(
      expect.objectContaining({ currentGateId: null }),
    );
  });
});
