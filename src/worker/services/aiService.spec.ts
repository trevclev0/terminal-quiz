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

  it("returns no_binding result if AI binding is missing", async () => {
    const { c } = createMockHonoContext({ AI: undefined });
    const result = await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );
    expect(result.clueText).toBeNull();
    expect(result.reason).toBe("no_binding");
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
    expect(result.clueText).toBe("some clue");
    expect(result.reason).toBe("success");
  });

  it("returns empty reason if AI response is empty/whitespace", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockResolvedValue({ response: "   " });
    const result = await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );
    expect(result.clueText).toBeNull();
    expect(result.reason).toBe("empty");
  });

  it("returns answer_leak and filters if AI response contains correct answer", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockResolvedValue({ response: "The answer is four" });
    const result = await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );
    expect(result.clueText).toBeNull();
    expect(result.reason).toBe("answer_leak");
  });

  it("returns error reason if AI.run throws", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockRejectedValue(new Error("AI failed"));
    const result = await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      baseArgs.currentGuess,
      [],
    );
    expect(result.clueText).toBeNull();
    expect(result.reason).toBe("error");
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
    expect(result.clueText).toHaveLength(200);
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
    expect(result.clueText).toBeNull();
    expect(result.reason).toBe("answer_leak");
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
    expect(result.clueText).toBe("some clue");
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

  it("sanitizes the player's guess before embedding it in the prompt", async () => {
    const { c, aiRunMock } = createMockHonoContext();
    aiRunMock.mockResolvedValue({ response: "clue" });

    await generateClue(
      c,
      baseArgs.gateQuestion,
      baseArgs.correctAnswer,
      'guess with "quotes" and\nnewline',
      [],
    );

    expect(aiRunMock).toHaveBeenCalledTimes(1);
    const prompt = aiRunMock.mock.calls[0][1].messages[1].content;
    expect(prompt).toContain('guess with \\"quotes\\" and newline');
    expect(prompt).not.toContain('"quotes"');
    expect(prompt).not.toContain("and\nnewline");
  });
});
