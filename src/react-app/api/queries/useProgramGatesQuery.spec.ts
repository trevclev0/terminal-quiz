import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useProgramGatesQuery } from "./useProgramGatesQuery";

describe("useProgramGatesQuery", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it("fetches and returns gates for a program", async () => {
    const mockGates = [
      {
        id: "gate-1",
        programId: "prog-1",
        sequenceOrder: 1,
        label: "Gate 1",
        question: "Q1",
        correctAnswer: "ans1",
        successMessage: "OK",
        acceptanceThreshold: 0.875,
        guidanceEnabled: false,
        guidanceThreshold: 3,
      },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { programGates: mockGates } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useProgramGatesQuery("prog-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockGates);
  });
});
