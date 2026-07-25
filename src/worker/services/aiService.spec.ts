import { createMockHonoContext } from "@worker-test-utils/mockEnv";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateClue } from "./aiService";

vi.mock("hono/adapter", () => ({
  env: vi.fn((c) => c.env),
}));

describe("aiService", () => {
  const baseArgs = {
    gateQuestion: "What is 2+2?",
    correctAnswer: "four",
    currentGuess: "three",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("returns null if AI binding is missing", async () => {
    const { c } = createMockHonoContext({ AI: undefined });
    const result = await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );
    expect(result).toBeNull();
  });

  it("returns trimmed clue on happy path", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockResolvedValue({ response: "  some clue  " });
    const result = await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );
    expect(result).toBe("some clue");
  });

  it("returns null if AI response is empty/whitespace", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockResolvedValue({ response: "   " });
    const result = await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );
    expect(result).toBeNull();
  });

  it("returns null and filters if AI response contains correct answer", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockResolvedValue({ response: "The answer is four" });
    const result = await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );
    expect(result).toBeNull();
  });

  it("returns null if AI.run throws", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockRejectedValue(new Error("AI failed"));
    const result = await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );
    expect(result).toBeNull();
  });

  it("truncates clue to MAX_CLUE_LENGTH (200)", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockResolvedValue({ response: "a".repeat(250) });
    const result = await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );
    expect(result).toHaveLength(200);
  });

  it("filters out AI response containing non-word-boundary answer", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockResolvedValue({
      response: "think about etymology of !hello!",
    });
    const result = await generateClue(
      c,
      "What is the answer?",
      "!hello!",
      "wrong guess",
      [],
    );
    expect(result).toBeNull();
  });

  it("passes through AI response not containing non-word-boundary answer", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockResolvedValue({ response: "some clue" });
    const result = await generateClue(
      c,
      "What is the answer?",
      "!hello!",
      "wrong guess",
      [],
    );
    expect(result).toBe("some clue");
  });

  it("exercises prompt logic with and without previous clues", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockResolvedValue({ response: "clue" });

    await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      ["prev clue"],
    );
    await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );

    expect(aiRunMock).toHaveBeenCalledTimes(2);
    const firstCallArgs = aiRunMock.mock.calls[0][1];
    expect(firstCallArgs.messages[1].content).toContain(
      "Previous clues already given",
    );

    const secondCallArgs = aiRunMock.mock.calls[1][1];
    expect(secondCallArgs.messages[1].content).not.toContain(
      "Previous clues already given",
    );
  });
});
