import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useUpdateGateMutation } from "./useUpdateGateMutation";

const mockFetch = vi.fn();
const PROGRAM_ID = "prog-1";

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("useUpdateGateMutation", () => {
  it("sends update gate mutation", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            updateGate: {
              id: "gate-1",
              label: "Updated",
              sequenceOrder: 1,
            },
          },
        }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useUpdateGateMutation(PROGRAM_ID), {
      wrapper,
    });

    await result.current.mutateAsync({
      id: "gate-1",
      label: "Updated",
    });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);

    expect(body.query).toContain("UpdateGate");
    expect(body.variables.id).toBe("gate-1");
    expect(body.variables.label).toBe("Updated");
  });

  it("invalidates programGates cache on success", async () => {
    mockFetch.mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            updateGate: { id: "gate-1", label: "Updated", sequenceOrder: 1 },
          },
        }),
    } as unknown as Response);

    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateGateMutation(PROGRAM_ID), {
      wrapper,
    });

    await result.current.mutateAsync({ id: "gate-1", label: "Updated" });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["programGates", PROGRAM_ID],
    });
  });
});
