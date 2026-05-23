import type { Gate } from "@shared/types";
import { defaultNullishGateProps } from "@test-utils/testTypes";
import getGatesToRender from "@utils/getGatesToRender";
import { describe, expect, it } from "vitest";

const makeGate = (overrides: Partial<Gate> = {}): Gate => ({
  ...defaultNullishGateProps,
  id: "c3b3ae1c-9565-41f7-b14c-7b203769555c",
  label: "test-id",
  correctAnswer: "test-pw",
  question: "default gate",
  successMessage: "default description",
  isSolved: false,
  programId: "63e52b69-0bb3-4598-8957-e531c90175ba",
  sequenceOrder: 1,
  ...overrides,
});

describe("getGatesToRender", () => {
  it("should return 0 if the first gate is locked", () => {
    const gates: Gate[] = [makeGate()];
    const { gatesToRender, nextGateIndex } = getGatesToRender(gates);
    expect(nextGateIndex).toBe(0);
    expect(gatesToRender.length).toEqual(1);
    expect(gatesToRender).toEqual(gates);
  });

  it("should return nextGateIndex: 1, 2 gates when 1 of 3 is solved", () => {
    const gates: Gate[] = [
      makeGate({ isSolved: true }),
      makeGate({ sequenceOrder: 2 }),
      makeGate({ sequenceOrder: 3 }),
    ];
    const { gatesToRender, nextGateIndex } = getGatesToRender(gates);
    expect(nextGateIndex).toBe(1);
    expect(gatesToRender.length).toEqual(2);
  });

  it("should return nextGateIndex: 2, 3 gates when 2 of 3 is solved", () => {
    const gates: Gate[] = [
      makeGate({ isSolved: true }),
      makeGate({ isSolved: true, sequenceOrder: 2 }),
      makeGate({ sequenceOrder: 3 }),
    ];
    const { gatesToRender, nextGateIndex } = getGatesToRender(gates);
    expect(nextGateIndex).toBe(2);
    expect(gatesToRender.length).toEqual(3);
  });

  it("should return -1 if all gates are solved", () => {
    const gates: Gate[] = [makeGate({ isSolved: true })];
    const { gatesToRender, nextGateIndex } = getGatesToRender(gates);
    expect(nextGateIndex).toBe(-1);
    expect(gatesToRender.length).toEqual(1);
  });

  it("should return -1 if there are no gates", () => {
    const gates: Gate[] = [];
    const { gatesToRender, nextGateIndex } = getGatesToRender(gates);
    expect(nextGateIndex).toBe(-1);
    expect(gatesToRender.length).toEqual(0);
  });
});
