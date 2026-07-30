import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useCreateGateMutation } from "./useCreateGateMutation";

const mockFetch = vi.fn();
const PROGRAM_ID = "prog-1";

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("useCreateGateMutation", () => {
  it("sends create gate mutation", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          createGate: {
            id: "gate-1",
            programId: PROGRAM_ID,
            label: "Gate 1",
            question: "Q1",
            sequenceOrder: 1,
          },
        },
      }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateGateMutation(PROGRAM_ID), {
      wrapper,
    });

    await result.current.mutateAsync({
      programId: PROGRAM_ID,
      label: "Gate 1",
      question: "Q1",
      correctAnswer: "ans1",
      successMessage: "OK",
      sequenceOrder: 1,
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);

    expect(body.query).toContain("CreateGate");
    expect(body.variables.label).toBe("Gate 1");
  });

  it("invalidates programGates cache on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          createGate: {
            id: "gate-1",
            programId: PROGRAM_ID,
            label: "Gate 1",
            question: "Q1",
            sequenceOrder: 1,
          },
        },
      }),
    } as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateGateMutation(PROGRAM_ID), {
      wrapper,
    });

    await result.current.mutateAsync({
      programId: PROGRAM_ID,
      label: "Gate 1",
      question: "Q1",
      correctAnswer: "ans1",
      successMessage: "OK",
      sequenceOrder: 1,
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["programGates", PROGRAM_ID],
    });
  });
});
