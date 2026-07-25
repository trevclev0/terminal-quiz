import { describe, expect, it } from "vitest";
import { computeCanRequestClue } from "./clueEligibility";

const defaultParams = {
  isCorrectGuess: false,
  guidanceEnabled: true,
  attemptCount: 2,
  guidanceThreshold: 2,
  existingClueCount: 0,
  mostRecentClueAttemptCount: null,
};

describe("computeCanRequestClue", () => {
  it("returns false when guess is correct", () => {
    const result = computeCanRequestClue({
      ...defaultParams,
      isCorrectGuess: true,
    });
    expect(result).toBe(false);
  });

  it("returns false when guidance is disabled", () => {
    const result = computeCanRequestClue({
      ...defaultParams,
      guidanceEnabled: false,
    });
    expect(result).toBe(false);
  });

  it("returns false when attempt count is below threshold", () => {
    const result = computeCanRequestClue({ ...defaultParams, attemptCount: 1 });
    expect(result).toBe(false);
  });

  it("returns false when clue limit reached", () => {
    const result = computeCanRequestClue({
      ...defaultParams,
      existingClueCount: 3,
    });
    expect(result).toBe(false);
  });

  it("returns false when no new attempt since last clue", () => {
    const result = computeCanRequestClue({
      ...defaultParams,
      attemptCount: 3,
      mostRecentClueAttemptCount: 3,
    });
    expect(result).toBe(false);
  });

  it("returns true when eligible", () => {
    const result = computeCanRequestClue({
      ...defaultParams,
      attemptCount: 4,
      mostRecentClueAttemptCount: 3,
    });
    expect(result).toBe(true);
  });
});
