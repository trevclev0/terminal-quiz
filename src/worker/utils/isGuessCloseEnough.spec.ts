import { describe, expect, it } from "vitest";
import isGuessCloseEnough from "./isGuessCloseEnough";

describe("isGuessCloseEnough", () => {
  it("returns true for exact match", () => {
    expect(isGuessCloseEnough("hello", "hello")).toBe(true);
  });

  it("returns true for close match above threshold", () => {
    expect(isGuessCloseEnough("abcdefgh", "abcdefgi")).toBe(true);
  });

  it("returns false for distant match below threshold", () => {
    expect(isGuessCloseEnough("", "hello")).toBe(false);
  });

  it("returns true when both strings are empty", () => {
    expect(isGuessCloseEnough("", "")).toBe(true);
  });

  it("returns true when both strings are whitespace (normalize to empty)", () => {
    expect(isGuessCloseEnough("   ", "   ")).toBe(true);
  });
});
