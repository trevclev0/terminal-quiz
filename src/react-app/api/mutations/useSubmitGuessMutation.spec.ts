import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useSubmitGuessMutation } from "./useSubmitGuessMutation";

const mockFetch = vi.fn();
const mockProgramId = "test-program-id";

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("useSubmitGuessMutation", () => {
  it("submits guess and returns response on success", async () => {
    const response = {
      success: true,
      message: "Access Granted.",
      canRequestClue: false,
      nextGate: { id: "gate-2", label: "Gate 2", question: "Next?" },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { submitGuess: response } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useSubmitGuessMutation(mockProgramId), {
      wrapper,
    });

    const data = await result.current.mutateAsync({
      gateId: "gate-1",
      guess: "my answer",
    });

    expect(data).toEqual(response);
  });

  it("sends correct mutation query and variables", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          submitGuess: { success: true, canRequestClue: false, nextGate: null },
        },
      }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useSubmitGuessMutation(mockProgramId), {
      wrapper,
    });

    await result.current.mutateAsync({ gateId: "gate-1", guess: "my answer" });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);

    expect(body.query).toContain("SubmitGuess");
    expect(body.variables).toEqual({
      programId: mockProgramId,
      gateId: "gate-1",
      guess: "my answer",
    });
  });

  it("invalidates progression cache on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: {
          submitGuess: { success: true, canRequestClue: false, nextGate: null },
        },
      }),
    } as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSubmitGuessMutation(mockProgramId), {
      wrapper,
    });

    await result.current.mutateAsync({ gateId: "gate-1", guess: "my answer" });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["programs", "progression", mockProgramId],
    });
  });

  it("rejects on GraphQL error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        errors: [{ message: "Invalid guess" }],
      }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useSubmitGuessMutation(mockProgramId), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({ gateId: "gate-1", guess: "wrong" }),
    ).rejects.toThrow("Invalid guess");
  });

  it("rejects on HTTP failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useSubmitGuessMutation(mockProgramId), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({ gateId: "gate-1", guess: "my answer" }),
    ).rejects.toThrow("GraphQL request failed with HTTP 500.");
  });

  it("rejects on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Network error"));

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useSubmitGuessMutation(mockProgramId), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({ gateId: "gate-1", guess: "my answer" }),
    ).rejects.toThrow("Network error");
  });
});
