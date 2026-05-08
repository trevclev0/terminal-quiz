import { defaultNullishGateProps } from "@test-utils/testTypes";
import getRiddlesToRender from "@utils/getRiddlesToRender";
import { describe, expect, it } from "vitest";
import type { Gate } from "@shared/types";

const makeRiddle = (overrides: Partial<Gate> = {}): Gate => ({
  id: "c3b3ae1c-9565-41f7-b14c-7b203769555c",
  label: "test-id",
  correctAnswer: "test-pw",
  question: "default riddle",
  successMessage: "default description",
  isSolved: false,
  ...defaultNullishGateProps,
  ...overrides,
  programId: "63e52b69-0bb3-4598-8957-e531c90175ba",
  sequenceOrder: 1,
});

describe("getRiddlesToRender", () => {
  it("should return 0 if the first riddle is locked", () => {
    const riddles: Gate[] = [makeRiddle()];
    const { riddlesToRender, nextRiddleIndex } = getRiddlesToRender(riddles);
    expect(nextRiddleIndex).toBe(0);
    expect(riddlesToRender.length).toEqual(1);
    expect(riddlesToRender).toEqual(riddles);
  });

  it("should return nextRiddleIndex: 1, 2 riddles when 1 of 3 is solved", () => {
    const riddles: Gate[] = [
      makeRiddle({ isSolved: true }),
      makeRiddle({ sequenceOrder: 2 }),
      makeRiddle({ sequenceOrder: 3 }),
    ];
    const { riddlesToRender, nextRiddleIndex } = getRiddlesToRender(riddles);
    expect(nextRiddleIndex).toBe(1);
    expect(riddlesToRender.length).toEqual(2);
  });

  it("should return nextRiddleIndex: 2, 3 riddles when 2 of 3 is solved", () => {
    const riddles: Gate[] = [
      makeRiddle({ isSolved: true }),
      makeRiddle({ isSolved: true, sequenceOrder: 2 }),
      makeRiddle({ sequenceOrder: 3 }),
    ];
    const { riddlesToRender, nextRiddleIndex } = getRiddlesToRender(riddles);
    expect(nextRiddleIndex).toBe(2);
    expect(riddlesToRender.length).toEqual(3);
  });

  it("should return -1 if all riddles are solved", () => {
    const riddles: Gate[] = [makeRiddle({ isSolved: true })];
    const { riddlesToRender, nextRiddleIndex } = getRiddlesToRender(riddles);
    expect(nextRiddleIndex).toBe(-1);
    expect(riddlesToRender.length).toEqual(1);
  });

  it("should return -1 if there are no riddles", () => {
    const riddles: Gate[] = [];
    const { riddlesToRender, nextRiddleIndex } = getRiddlesToRender(riddles);
    expect(nextRiddleIndex).toBe(-1);
    expect(riddlesToRender.length).toEqual(0);
  });
});
