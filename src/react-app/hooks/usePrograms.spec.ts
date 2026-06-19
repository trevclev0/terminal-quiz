import { PROGRAM_KEYS } from "@api/queryKeys";
import usePrograms from "@hooks/usePrograms";
import { createQueryWrapper } from "@test-utils/queryTestUtils";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockPrograms = [
  { id: "1", name: "Program A" },
  { id: "2", name: "Program B" },
];

describe("usePrograms hook", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: { programs: mockPrograms } })),
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty array and loading state initially", () => {
    const { wrapper } = createQueryWrapper();

    const { result } = renderHook(() => usePrograms(), { wrapper });

    expect(result.current.programs).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("returns programs when data is successfully fetched or cached", async () => {
    const { queryClient, wrapper } = createQueryWrapper();

    queryClient.setQueryData(PROGRAM_KEYS.all, mockPrograms);

    const { result } = renderHook(() => usePrograms(), { wrapper });

    await waitFor(() => {
      expect(result.current.programs).toEqual(mockPrograms);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
