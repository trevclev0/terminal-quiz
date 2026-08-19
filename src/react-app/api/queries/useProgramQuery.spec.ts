import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useProgramQuery } from "./useProgramQuery";

describe("useProgramQuery", () => {
  it("fetches and returns a program by id", async () => {
    const mockProgram = {
      id: "prog-1",
      name: "My Program",
      visibility: "public",
      authorId: "user-1",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () => JSON.stringify({ data: { program: mockProgram } }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useProgramQuery("prog-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProgram);
  });

  it("returns null when program is not found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () => JSON.stringify({ data: { program: null } }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useProgramQuery("missing"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
