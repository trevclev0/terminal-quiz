import { describe, expect, it } from "vitest";
import isGuessCloseEnough from "./isGuessCloseEnough";

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
