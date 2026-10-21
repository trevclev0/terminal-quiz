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
      message: "ACCESS GRANTED.",
      canRequestClue: false,
      nextGate: { id: "gate-2", label: "Gate 2", question: "Next?" },
    };
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () => JSON.stringify({ data: { submitGuess: response } }),
    } as unknown as Response);

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
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            submitGuess: {
              success: true,
              canRequestClue: false,
              nextGate: null,
            },
          },
        }),
    } as unknown as Response);

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
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            submitGuess: {
              success: true,
              canRequestClue: false,
              nextGate: null,
            },
          },
        }),
    } as unknown as Response);

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
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          errors: [{ message: "Invalid guess" }],
        }),
    } as unknown as Response);

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
      headers: { get: () => "application/json" },
      ok: false,
      status: 500,
      text: async () => JSON.stringify({}),
    } as unknown as Response);

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

  function respondWith(success: boolean) {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            submitGuess: { success, canRequestClue: false, nextGate: null },
          },
        }),
    } as unknown as Response);
  }

  // The refetch is what mounts the solved gate, so the solve has to be
  // recorded first or the gate renders once without its flash (#313).
  it("reports a correct guess before invalidating progression", async () => {
    respondWith(true);
    const onSolved = vi.fn();
    const { queryClient, wrapper } = createQueryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(
      () => useSubmitGuessMutation(mockProgramId, { onSolved }),
      { wrapper },
    );

    await result.current.mutateAsync({ gateId: "gate-1", guess: "4" });

    expect(onSolved).toHaveBeenCalledWith("gate-1");
    expect(onSolved.mock.invocationCallOrder[0]).toBeLessThan(
      invalidate.mock.invocationCallOrder[0],
    );
  });

  it("does not report a wrong guess", async () => {
    respondWith(false);
    const onSolved = vi.fn();
    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useSubmitGuessMutation(mockProgramId, { onSolved }),
      { wrapper },
    );

    await result.current.mutateAsync({ gateId: "gate-1", guess: "5" });

    expect(onSolved).not.toHaveBeenCalled();
  });
});
