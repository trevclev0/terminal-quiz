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
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      get: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      execute: vi.fn(),
    } as unknown;

    mockContext = {
      get: vi.fn((key: string) => (key === "db" ? mockDb : "mock-session-123")),
    } as unknown as AppGraphQLContext;
  });

  it("returns false and does not update DB if guess is incorrect", async () => {
    // @ts-expect-error - mocking nested functions safely for tests
    mockDb.get.mockResolvedValue({ id: "gate-1", correctAnswer: "apple" });
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
    mockDb.get.mockResolvedValue({ id: "gate-1", correctAnswer: "banana" });
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
