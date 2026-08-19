import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useRequestClueMutation } from "./useRequestClueMutation";

const mockFetch = vi.fn();
const mockProgramId = "test-program-id";

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("useRequestClueMutation", () => {
  it("requests clue and returns response on success", async () => {
    const response = {
      clueText: "Think about the number 4",
      isClueLimitReached: false,
      cluesRemaining: 2,
    };
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () => JSON.stringify({ data: { requestClue: response } }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRequestClueMutation(mockProgramId), {
      wrapper,
    });

    const data = await result.current.mutateAsync({
      gateId: "gate-1",
      currentGuess: "5",
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
            requestClue: {
              clueText: "Hint",
              isClueLimitReached: false,
              cluesRemaining: 2,
            },
          },
        }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRequestClueMutation(mockProgramId), {
      wrapper,
    });

    await result.current.mutateAsync({
      gateId: "gate-1",
      currentGuess: "5",
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);

    expect(body.query).toContain("RequestClue");
    expect(body.variables).toEqual({
      programId: mockProgramId,
      gateId: "gate-1",
      currentGuess: "5",
    });
  });

  it("returns null clueText when clue cannot be generated", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            requestClue: {
              clueText: null,
              isClueLimitReached: true,
              cluesRemaining: 0,
            },
          },
        }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRequestClueMutation(mockProgramId), {
      wrapper,
    });

    const data = await result.current.mutateAsync({
      gateId: "gate-1",
      currentGuess: "wrong",
    });

    expect(data.clueText).toBeNull();
    expect(data.isClueLimitReached).toBe(true);
    expect(data.cluesRemaining).toBe(0);
  });

  it("rejects on GraphQL error response", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({ errors: [{ message: "Clue limit reached" }] }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRequestClueMutation(mockProgramId), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({ gateId: "gate-1", currentGuess: "5" }),
    ).rejects.toThrow("Clue limit reached");
  });

  it("rejects on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Network error"));

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRequestClueMutation(mockProgramId), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({ gateId: "gate-1", currentGuess: "5" }),
    ).rejects.toThrow("Network error");
  });

  it("rejects on HTTP failure", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: false,
      status: 500,
      text: async () => JSON.stringify({}),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRequestClueMutation(mockProgramId), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({ gateId: "gate-1", currentGuess: "5" }),
    ).rejects.toThrow("GraphQL request failed with HTTP 500.");
  });

  it("does not invalidate query cache (no onSuccess handler)", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            requestClue: {
              clueText: "Hint",
              isClueLimitReached: false,
              cluesRemaining: 2,
            },
          },
        }),
    } as unknown as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRequestClueMutation(mockProgramId), {
      wrapper,
    });

    await result.current.mutateAsync({ gateId: "gate-1", currentGuess: "5" });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
