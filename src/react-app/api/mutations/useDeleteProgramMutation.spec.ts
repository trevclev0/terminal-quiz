import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useDeleteProgramMutation } from "./useDeleteProgramMutation";

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("useDeleteProgramMutation", () => {
  it("sends delete mutation", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () => JSON.stringify({ data: { deleteProgram: true } }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useDeleteProgramMutation(), {
      wrapper,
    });

    await result.current.mutateAsync({ id: "prog-1" });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);

    expect(body.query).toContain("DeleteProgram");
    expect(body.variables).toEqual({ id: "prog-1" });
  });

  it("invalidates myPrograms cache on success", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () => JSON.stringify({ data: { deleteProgram: true } }),
    } as unknown as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteProgramMutation(), {
      wrapper,
    });

    await result.current.mutateAsync({ id: "prog-1" });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["myPrograms"],
    });
  });
});
