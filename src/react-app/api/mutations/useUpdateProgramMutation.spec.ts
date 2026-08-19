import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useUpdateProgramMutation } from "./useUpdateProgramMutation";

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("useUpdateProgramMutation", () => {
  it("sends update mutation", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            updateProgram: {
              id: "prog-1",
              name: "Updated",
              visibility: "unlisted",
            },
          },
        }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useUpdateProgramMutation(), {
      wrapper,
    });

    await result.current.mutateAsync({
      id: "prog-1",
      name: "Updated",
      visibility: "unlisted",
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);

    expect(body.query).toContain("UpdateProgram");
    expect(body.variables).toEqual({
      id: "prog-1",
      name: "Updated",
      visibility: "unlisted",
    });
  });

  it("invalidates myPrograms cache on success", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            updateProgram: {
              id: "prog-1",
              name: "Updated",
              visibility: "public",
            },
          },
        }),
    } as unknown as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateProgramMutation(), {
      wrapper,
    });

    await result.current.mutateAsync({ id: "prog-1", name: "Updated" });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["myPrograms"],
    });
  });
});
