import type { GateManagement } from "@api/queries/useProgramGatesQuery";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useGateDrafts } from "./useGateDrafts";

const gates: GateManagement[] = [
  {
    id: "g1",
    programId: "p1",
    sequenceOrder: 1,
    label: "Gate 1",
    question: "Q1?",
    correctAnswer: "a1",
    successMessage: "OK",
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidanceThreshold: 3,
  },
  {
    id: "g2",
    programId: "p1",
    sequenceOrder: 2,
    label: "Gate 2",
    question: "Q2?",
    correctAnswer: "a2",
    successMessage: "OK",
    acceptanceThreshold: 0.875,
    guidanceEnabled: true,
    guidanceThreshold: 2,
  },
];

describe("useGateDrafts", () => {
  it("starts empty when gates are undefined", () => {
    const { result } = renderHook(() => useGateDrafts(undefined));

    expect(result.current[0]).toEqual({});
  });

  it("initializes drafts from gates", () => {
    const { result } = renderHook(() => useGateDrafts(gates));

    expect(result.current[0].g1.label).toBe("Gate 1");
    expect(result.current[0].g1.guidanceEnabled).toBe(false);
    expect(result.current[0].g2.guidanceEnabled).toBe(true);
    expect(result.current[0].g2.guidanceThreshold).toBe(2);
  });

  it("preserves manual edits across refetches", () => {
    const { result, rerender } = renderHook(({ g }) => useGateDrafts(g), {
      initialProps: { g: gates },
    });

    act(() => {
      result.current[1]((prev) => ({
        ...prev,
        g1: { ...prev.g1, label: "Edited" },
      }));
    });

    rerender({ g: [...gates] });

    expect(result.current[0].g1.label).toBe("Edited");
  });

  it("prunes drafts for removed gates", () => {
    const { result, rerender } = renderHook(({ g }) => useGateDrafts(g), {
      initialProps: { g: gates },
    });

    rerender({ g: [gates[0]] });

    expect(result.current[0].g1).toBeDefined();
    expect(result.current[0].g2).toBeUndefined();
  });
});
