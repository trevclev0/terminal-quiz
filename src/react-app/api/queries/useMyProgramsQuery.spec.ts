import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useMyProgramsQuery } from "./useMyProgramsQuery";

describe("useMyProgramsQuery", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it("fetches and returns my programs", async () => {
    const mockPrograms = [
      { id: "1", name: "My Program", visibility: "public", authorId: "user-1" },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { myPrograms: mockPrograms } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useMyProgramsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPrograms);
  });

  it("returns empty array when null", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { myPrograms: null } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useMyProgramsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
