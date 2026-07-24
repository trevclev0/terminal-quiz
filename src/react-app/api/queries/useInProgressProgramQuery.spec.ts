import { useQuery } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { inProgressProgramQueryOptions } from "./useInProgressProgramQuery";

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("inProgressProgramQueryOptions", () => {
  it("returns program id when session has in-progress program", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { getInProgressProgram: "prog-1" } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useQuery(inProgressProgramQueryOptions),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe("prog-1");
  });

  it("returns null when no in-progress program exists", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { getInProgressProgram: null } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useQuery(inProgressProgramQueryOptions),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("includes correct queryKey", () => {
    expect(inProgressProgramQueryOptions.queryKey).toEqual([
      "programs",
      "inProgress",
    ]);
  });

  it("sets staleTime to 0 for always-fresh data", () => {
    expect(inProgressProgramQueryOptions.staleTime).toBe(0);
  });

  it("sends GetInProgressProgram query", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { getInProgressProgram: null } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    renderHook(() => useQuery(inProgressProgramQueryOptions), { wrapper });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);

    expect(body.query).toContain("GetInProgressProgram");
    expect(body.variables).toBeUndefined();
  });

  it("rejects on query error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useQuery(inProgressProgramQueryOptions),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe(
      "GraphQL request failed with HTTP 500.",
    );
  });

  it("rejects on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Network error"));

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useQuery(inProgressProgramQueryOptions),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });
});
