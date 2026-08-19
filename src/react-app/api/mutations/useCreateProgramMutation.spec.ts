import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useCreateProgramMutation } from "./useCreateProgramMutation";

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("useCreateProgramMutation", () => {
  it("creates a program and returns it", async () => {
    const response = {
      id: "prog-1",
      name: "My Program",
      visibility: "public",
      authorId: "user-1",
      createdAt: "2024-01-01T00:00:00.000Z",
    };
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () => JSON.stringify({ data: { createProgram: response } }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useCreateProgramMutation(), {
      wrapper,
    });

    const data = await result.current.mutateAsync({
      name: "My Program",
      visibility: "public",
    });

    expect(data).toEqual(response);
  });

  it("invalidates myPrograms cache on success", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            createProgram: {
              id: "prog-1",
              name: "My Program",
              visibility: "public",
              authorId: "user-1",
              createdAt: "2024-01-01T00:00:00.000Z",
            },
          },
        }),
    } as unknown as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateProgramMutation(), {
      wrapper,
    });

    await result.current.mutateAsync({
      name: "My Program",
      visibility: "public",
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["myPrograms"],
    });
  });
});
