import type { DrizzleD1Database } from "drizzle-orm/d1";
import { describe, expect, it, vi } from "vitest";
import type * as schema from "../db/schema";
import { type GuessResponse, processGateGuess } from "./gateService";

function createMockGateDb() {
  const findFirstMock = vi.fn();
  const returningMock = vi.fn();
  const setMock = vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      returning: returningMock,
    }),
  });
  const updateMock = vi.fn().mockReturnValue({
    set: setMock,
  });

  const mockDb = {
    query: {
      gates: {
        findFirst: findFirstMock,
      },
    },
    update: updateMock,
  } as unknown as DrizzleD1Database<typeof schema>;

  // Return the db AND the mocks so tests can configure them
  return {
    db: mockDb,
    findFirst: findFirstMock,
    update: updateMock,
    set: setMock,
    returning: returningMock,
  };
}

// Usage:

describe("processGateGuess", () => {
  describe("error cases", () => {
    it("returns error if gate not found", async () => {
      const { db, findFirst } = createMockGateDb();
      findFirst.mockResolvedValue(null);

      const result = await processGateGuess(db, "invalid-id", "guess");
      expect(result).toEqual({
        status: "error",
        message: "Gate not found",
        code: "NOT_FOUND",
      });
    });

    it("returns error if gate is already solved", async () => {
      const { db, findFirst } = createMockGateDb();
      findFirst.mockResolvedValue({
        id: "gate-1",
        isSolved: true,
      });

      const result = await processGateGuess(db, "gate-1", "guess");
      expect(result).toEqual({
        status: "error",
        message: "Gate is already solved",
        code: "ALREADY_SOLVED",
      });
    });
  });

  describe("correct guess", () => {
    it("returns success with next gate ID", async () => {
      const { db, findFirst, returning } = createMockGateDb();
      findFirst
        .mockResolvedValueOnce({
          id: "gate-1",
          isSolved: false,
          correctAnswer: "ANSWER",
          programId: "prog-1",
          sequenceOrder: 1,
          successMessage: "Great job!",
          guidanceEnabled: false,
          guidanceThreshold: 3,
          attemptCount: 0,
        })
        .mockResolvedValueOnce({ id: "gate-2" });
      returning.mockResolvedValue([{ id: "gate-1" }]);

      const result = await processGateGuess(db, "gate-1", "answer");

      expect(result).toEqual({
        status: "correct",
        message: "Great job!",
        nextGateId: "gate-2",
      });
    });

    it("handles concurrent solve race condition", async () => {
      const { db, findFirst, returning } = createMockGateDb();
      findFirst.mockResolvedValue({
        id: "gate-1",
        isSolved: false,
        correctAnswer: "ANSWER",
      });
      returning.mockResolvedValue([]); // No rows updated = race condition

      const result = await processGateGuess(db, "gate-1", "answer");

      expect(result).toEqual({
        status: "error",
        message: "Gate is already solved",
        code: "ALREADY_SOLVED",
      });
    });
  });

  describe("incorrect guess", () => {
    it("increments attempt count", async () => {
      const { db, findFirst, returning, update } = createMockGateDb();
      findFirst.mockResolvedValue({
        id: "gate-1",
        isSolved: false,
        correctAnswer: "ANSWER",
        guidanceEnabled: false,
        attemptCount: 0,
      });
      returning.mockResolvedValue([{ attemptCount: 1 }]);

      const result = await processGateGuess(db, "gate-1", "wrong");

      expect(result).toEqual({
        status: "incorrect",
        message: "Access Denied",
        clue: "",
      });
      expect(update).toHaveBeenCalled();
    });

    it("shows guidance at threshold", async () => {
      const { db, findFirst, returning } = createMockGateDb();
      findFirst.mockResolvedValue({
        id: "gate-1",
        isSolved: false,
        correctAnswer: "ANSWER",
        guidanceEnabled: true,
        guidanceThreshold: 3,
        guidancePrompt: "Try again!",
        attemptCount: 2, // Will be incremented to 3
      });
      returning.mockResolvedValue([{ attemptCount: 3 }]);

      const result: GuessResponse = await processGateGuess(
        db,
        "gate-1",
        "wrong",
      );

      expect(result).toEqual({
        status: "incorrect",
        message: "Access Denied",
        clue: "Try again!",
      });
    });

    it("shows default hint when prompt is missing", async () => {
      const { db, findFirst, returning } = createMockGateDb();
      findFirst.mockResolvedValue({
        id: "gate-1",
        isSolved: false,
        correctAnswer: "ANSWER",
        guidanceEnabled: true,
        guidanceThreshold: 3,
        guidancePrompt: null,
        attemptCount: 2,
      });
      returning.mockResolvedValue([{ attemptCount: 3 }]);

      const result = await processGateGuess(db, "gate-1", "wrong");

      expect(result).toEqual({
        status: "incorrect",
        message: "Access Denied",
        clue: "Hint: The AI integration is pending, but keep trying!",
      });
    });

    it("suppresses guidance when disabled", async () => {
      const { db, findFirst, returning } = createMockGateDb();
      findFirst.mockResolvedValue({
        id: "gate-1",
        isSolved: false,
        correctAnswer: "ANSWER",
        guidanceEnabled: false, // Disabled!
        guidanceThreshold: 3,
        guidancePrompt: "Try again!",
        attemptCount: 3,
      });
      returning.mockResolvedValue([{ attemptCount: 4 }]);

      const result: GuessResponse = await processGateGuess(
        db,
        "gate-1",
        "wrong",
      );

      expect(result).toEqual({
        status: "incorrect",
        message: "Access Denied",
        clue: "",
      });
    });
  });

  it("throws on database error", async () => {
    const { db, findFirst } = createMockGateDb();
    findFirst.mockRejectedValue(new Error("DB failure"));

    await expect(processGateGuess(db, "gate-1", "guess")).rejects.toThrow(
      "DB failure",
    );
  });
});
