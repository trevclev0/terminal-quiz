import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitGuess } from "./mutations";
import type { AppGraphQLContext } from "./queries";

vi.mock("../../utils/isGuessCloseEnough", () => ({
  default: vi.fn(),
}));

import isGuessCloseEnough from "../../utils/isGuessCloseEnough";

describe("Gameplay Mutations: submitGuess", () => {
  let mockDb: unknown;
  let mockContext: AppGraphQLContext;

  beforeEach(() => {
    mockDb = {
      query: {
        sessionProgress: { findFirst: vi.fn() },
        gates: { findFirst: vi.fn() },
      },
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    } as unknown;

    mockContext = {
      get: vi.fn((key: string) => {
        if (key === "db") return mockDb;
        if (key === "sessionId") return "mock-session-123";
        return undefined;
      }),
    } as unknown as AppGraphQLContext;
  });

  it("returns false and does not update DB if guess is incorrect", async () => {
    // @ts-expect-error - mocking nested functions safely for tests
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      id: "progress-1",
      status: "in_progress",
      currentGateId: "gate-1",
      completedGateIds: "[]",
    });
    // @ts-expect-error
    mockDb.query.gates.findFirst.mockResolvedValue({
      id: "gate-1",
      correctAnswer: "apple",
      sequenceOrder: 1,
      successMessage: "OK",
    });
    vi.mocked(isGuessCloseEnough).mockReturnValue(false);

    if (!submitGuess.resolve) throw new Error("Resolver not defined");

    const result = await submitGuess.resolve(
      null,
      { programId: "prog-1", gateId: "gate-1", guess: "banana" },
      mockContext,
    );

    expect(result.success).toBe(false);
    // @ts-expect-error - mocking nested functions
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it("returns true and updates DB if guess is correct", async () => {
    // @ts-expect-error
    mockDb.query.sessionProgress.findFirst.mockResolvedValue({
      id: "progress-2",
      status: "in_progress",
      currentGateId: "gate-2",
      completedGateIds: "[]",
    });
    // @ts-expect-error
    mockDb.query.gates.findFirst
      .mockResolvedValueOnce({
        id: "gate-2",
        correctAnswer: "banana",
        sequenceOrder: 2,
        successMessage: "Well done!",
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
    // @ts-expect-error
    expect(mockDb.update).toHaveBeenCalled();
  });
});
