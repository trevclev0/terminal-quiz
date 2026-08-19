import { useQuery } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { programProgressionQueryOptions } from "./useProgramProgressionQuery";

const mockFetch = vi.fn();
const mockProgramId = "test-program-id";

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("programProgressionQueryOptions", () => {
  it("fetches and returns program progression on success", async () => {
    const progression = {
      currentGate: { id: "gate-1", label: "Gate 1", question: "What is 2+2?" },
      completedGates: [],
      status: "in_progress",
    };
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({ data: { getProgramProgression: progression } }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useQuery(programProgressionQueryOptions(mockProgramId)),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(progression);
  });

  it("includes correct queryKey", () => {
    const options = programProgressionQueryOptions(mockProgramId);
    expect(options.queryKey).toEqual([
      "programs",
      "progression",
      mockProgramId,
    ]);
  });

  it("forwards programId in the query variables", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            getProgramProgression: {
              currentGate: null,
              completedGates: [],
              status: "in_progress",
            },
          },
        }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    renderHook(() => useQuery(programProgressionQueryOptions(mockProgramId)), {
      wrapper,
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);

    expect(body.query).toContain("GetProgramProgression");
    expect(body.variables).toEqual({ programId: mockProgramId });
  });

  it("rejects on query error", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: false,
      status: 500,
      text: async () => JSON.stringify({}),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useQuery(programProgressionQueryOptions(mockProgramId)),
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
      () => useQuery(programProgressionQueryOptions(mockProgramId)),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Network error");
  });

  it("handles null currentGate (completed program)", async () => {
    const progression = {
      currentGate: null,
      completedGates: [
        {
          id: "gate-1",
          label: "Gate 1",
          question: "What is 2+2?",
          correctAnswer: "4",
          successMessage: "Correct!",
        },
      ],
      status: "completed",
    };
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({ data: { getProgramProgression: progression } }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(
      () => useQuery(programProgressionQueryOptions(mockProgramId)),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.currentGate).toBeNull();
    expect(result.current.data?.completedGates).toHaveLength(1);
    expect(result.current.data?.status).toBe("completed");
  });
});
