import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useReorderGatesMutation } from "./useReorderGatesMutation";

const mockFetch = vi.fn();
const PROGRAM_ID = "prog-1";

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("useReorderGatesMutation", () => {
  it("sends reorder mutation", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () => JSON.stringify({ data: { reorderGates: true } }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useReorderGatesMutation(PROGRAM_ID), {
      wrapper,
    });

    await result.current.mutateAsync({
      programId: PROGRAM_ID,
      orderedGateIds: ["gate-2", "gate-1"],
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);

    expect(body.query).toContain("ReorderGates");
    expect(body.variables).toEqual({
      programId: PROGRAM_ID,
      orderedGateIds: ["gate-2", "gate-1"],
    });
  });

  it("invalidates programGates cache on success", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () => JSON.stringify({ data: { reorderGates: true } }),
    } as unknown as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useReorderGatesMutation(PROGRAM_ID), {
      wrapper,
    });

    await result.current.mutateAsync({
      programId: PROGRAM_ID,
      orderedGateIds: ["gate-2", "gate-1"],
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["programGates", PROGRAM_ID],
    });
  });
});
