import { describe, expect, it } from "vitest";
import {
  mockCompletedGate,
  mockProgram,
  mockPrograms,
  mockProgression,
  mockRequestClueResponse,
  mockSubmitGuessResponse,
} from "./fixtures";

describe("mockProgram", () => {
  it("returns default program", () => {
    const result = mockProgram();
    expect(result).toEqual({ id: "test-program-id", name: "Test Program" });
  });

  it("overrides default values", () => {
    const result = mockProgram({ id: "custom-id", name: "Custom" });
    expect(result).toEqual({ id: "custom-id", name: "Custom" });
  });
});

describe("mockPrograms", () => {
  it("returns default list when no overrides given", () => {
    const result = mockPrograms();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "1", name: "Program 1" });
    expect(result[1]).toEqual({ id: "2", name: "Program 2" });
  });

  it("returns mapped programs when overrides are provided", () => {
    const overrides = [{ name: "Custom 1" }, { name: "Custom 2" }];
    const result = mockPrograms(overrides);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: "1", name: "Custom 1" });
    expect(result[1]).toEqual({ id: "2", name: "Custom 2" });
  });
});

describe("mockCompletedGate", () => {
  it("returns default completed gate", () => {
    const result = mockCompletedGate();
    expect(result).toMatchObject({ id: "completed-gate-1", label: "Gate 1" });
  });

  it("overrides default values", () => {
    const result = mockCompletedGate({ id: "cg-2", label: "Gate 2" });
    expect(result).toMatchObject({ id: "cg-2", label: "Gate 2" });
  });
});

describe("mockProgression", () => {
  it("returns default progression", () => {
    const result = mockProgression();
    expect(result.status).toBe("in_progress");
  });

  it("overrides default values", () => {
    const result = mockProgression({ status: "completed" });
    expect(result.status).toBe("completed");
  });
});

describe("mockSubmitGuessResponse", () => {
  it("returns default response", () => {
    const result = mockSubmitGuessResponse();
    expect(result.success).toBe(true);
    expect(result.canRequestClue).toBe(false);
    expect(result.nextGate).toBeNull();
  });

  it("overrides default values", () => {
    const result = mockSubmitGuessResponse({
      success: false,
      canRequestClue: true,
    });
    expect(result.success).toBe(false);
    expect(result.canRequestClue).toBe(true);
  });
});

describe("mockRequestClueResponse", () => {
  it("returns default response", () => {
    const result = mockRequestClueResponse();
    expect(result.clueText).toBe("Here is a clue");
    expect(result.isClueLimitReached).toBe(false);
    expect(result.cluesRemaining).toBe(2);
  });

  it("overrides default values", () => {
    const result = mockRequestClueResponse({
      clueText: "Custom clue",
      isClueLimitReached: true,
    });
    expect(result.clueText).toBe("Custom clue");
    expect(result.isClueLimitReached).toBe(true);
  });
});
