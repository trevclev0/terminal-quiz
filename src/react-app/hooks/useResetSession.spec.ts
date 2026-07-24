import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../test-utils/queryTestUtils";
import { useResetSession } from "./useResetSession";

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("useResetSession", () => {
  it("returns true on successful reset", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { resetSession: true } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useResetSession(), { wrapper });

    const data = await result.current.mutateAsync({ programId: "prog-1" });

    expect(data).toBe(true);
  });

  it("sends correct mutation query and variables", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { resetSession: true } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useResetSession(), { wrapper });

    await result.current.mutateAsync({ programId: "prog-1" });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);

    expect(body.query).toContain("ResetSession");
    expect(body.variables).toEqual({ programId: "prog-1" });
  });

  it("invalidates progression cache on success", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { resetSession: true } }),
    } as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useResetSession(), { wrapper });

    await result.current.mutateAsync({ programId: "prog-1" });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["programs", "progression", "prog-1"],
    });
  });

  it("invalidates progression cache on mutation failure (onSettled)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useResetSession(), { wrapper });

    await expect(
      result.current.mutateAsync({ programId: "prog-1" }),
    ).rejects.toThrow();

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["programs", "progression", "prog-1"],
    });
  });

  it("does not invalidate cache when programId is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { resetSession: true } }),
    } as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useResetSession(), { wrapper });

    await result.current.mutateAsync({ programId: "" });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("rejects on GraphQL error response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ errors: [{ message: "Session not found" }] }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useResetSession(), { wrapper });

    await expect(
      result.current.mutateAsync({ programId: "prog-1" }),
    ).rejects.toThrow("Session not found");
  });

  it("rejects on HTTP failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useResetSession(), { wrapper });

    await expect(
      result.current.mutateAsync({ programId: "prog-1" }),
    ).rejects.toThrow("GraphQL request failed with HTTP 500.");
  });

  it("rejects on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Network error"));

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useResetSession(), { wrapper });

    await expect(
      result.current.mutateAsync({ programId: "prog-1" }),
    ).rejects.toThrow("Network error");
  });
});
