import { useProgramsQuery } from "@api/queries/useProgramsQuery";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";

const mockPrograms = [
  { id: "1", name: "Program A", isSelected: false, gates: [] },
];

describe("useProgramsQuery", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it("fetches and returns programs successfully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { programs: mockPrograms } }),
    } as Response);

    const { wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useProgramsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPrograms);
  });

  it("throws an error if the HTTP request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useProgramsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to fetch programs: 500");
  });
});
