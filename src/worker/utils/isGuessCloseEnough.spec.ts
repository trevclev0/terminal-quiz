import { describe, expect, it } from "vitest";
import isGuessCloseEnough, { isGuessAccepted } from "./isGuessCloseEnough";

describe("isGuessCloseEnough", () => {
  describe("default threshold (0.875)", () => {
    it("returns true for exact match", () => {
      expect(isGuessCloseEnough("hello", "hello")).toBe(true);
    });

    it("returns true for close match above threshold", () => {
      expect(isGuessCloseEnough("abcdefgh", "abcdefgi")).toBe(true);
    });

    it("returns false when guess is empty but answer is not", () => {
      expect(isGuessCloseEnough("", "hello")).toBe(false);
    });

    it("returns false when answer is empty but guess is not", () => {
      expect(isGuessCloseEnough("hello", "")).toBe(false);
    });

    it("measures similarity against the longer string", () => {
      // 1 edit over 8 chars = 0.875 (accepted); over the shorter 7 it
      // would be ~0.857 (rejected).
      expect(isGuessCloseEnough("abcdefg", "abcdefgh")).toBe(true);
      expect(isGuessCloseEnough("abcdefgh", "abcdefg")).toBe(true);
    });
  });

  describe("explicit threshold", () => {
    const threshold = 0.75;

    // "abcd" vs "abXd": distance=1, longerLength=4, similarity=0.75
    it("returns true when similarity equals threshold", () => {
      expect(isGuessCloseEnough("abcd", "abXd", threshold)).toBe(true);
    });

    // "abcd" vs "abXY": distance=2, longerLength=4, similarity=0.5
    it("returns false when similarity is below threshold", () => {
      expect(isGuessCloseEnough("abcd", "abXY", threshold)).toBe(false);
    });
  });

  it("returns true when both strings are empty", () => {
    expect(isGuessCloseEnough("", "")).toBe(true);
  });

  it("returns true when both strings normalize to empty", () => {
    expect(isGuessCloseEnough("   ", "   ")).toBe(true);
  });
});

describe("isGuessAccepted", () => {
  it("accepts an alias regardless of case", () => {
    expect(isGuessAccepted("nyc", "New York City", ["NYC"])).toBe(true);
  });

  it("accepts an alias after trimming the guess", () => {
    expect(isGuessAccepted(" NYC ", "New York City", ["nyc"])).toBe(true);
  });

  it("keeps a short alias exact at the default threshold", () => {
    expect(isGuessAccepted("nyx", "New York City", ["NYC"], 0.875)).toBe(false);
  });

  it("still fuzzy-matches the main answer when there are no aliases", () => {
    expect(isGuessAccepted("New York Citty", "New York City", null)).toBe(true);
  });

  it("adds no fallback answer when the gate has no aliases", () => {
    // Pins `acceptedAnswers ?? []`: a stand-in alias for null (Stryker's
    // "Stryker was here" fallback) would make this guess correct.
    expect(isGuessAccepted("Stryker was here", "New York City", null)).toBe(
      false,
    );
  });

  it("rejects a guess that matches neither the answer nor an alias", () => {
    expect(isGuessAccepted("Boston", "New York City", [])).toBe(false);
  });

  it("accepts an alias of a non-word answer", () => {
    expect(isGuessAccepted("four", "4", ["four"])).toBe(true);
  });

  it("applies the threshold to aliases", () => {
    expect(isGuessAccepted("fuor", "4", ["four"], 0.5)).toBe(true);
  });
});
