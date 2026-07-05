import { describe, expect, it } from "vitest";
import isGuessCloseEnough from "./isGuessCloseEnough";

describe("isGuessCloseEnough", () => {
  it("should return true for close matches", () => {
    expect(isGuessCloseEnough("hello", "hello")).toBe(true);
  });

  it("should return false for empty matches", () => {
    expect(isGuessCloseEnough("", "hello")).toBe(false);
  });
});
