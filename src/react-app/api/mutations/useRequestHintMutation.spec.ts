import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useRequestHintMutation } from "./useRequestHintMutation";

const mockFetch = vi.fn();
const mockProgramId = "test-program-id";

const respondWith = (body: unknown) =>
  mockFetch.mockResolvedValueOnce({
    headers: { get: () => "application/json" },
    ok: true,
    text: async () => JSON.stringify(body),
  } as unknown as Response);

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

describe("useRequestHintMutation", () => {
  it("sends the program and gate and returns the hint", async () => {
    const hint = { step: 1, cells: [null, null], isFinalStep: false };
    respondWith({ data: { requestHint: hint } });

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRequestHintMutation(mockProgramId), {
      wrapper,
    });

    const data = await result.current.mutateAsync({ gateId: "gate-1" });

    expect(data).toEqual(hint);
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.query).toContain("RequestHint");
    expect(body.variables).toEqual({
      programId: mockProgramId,
      gateId: "gate-1",
    });
  });

  it("rejects when the response has no hint payload", async () => {
    respondWith({ data: { requestHint: null } });

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useRequestHintMutation(mockProgramId), {
      wrapper,
    });

    await expect(
      result.current.mutateAsync({ gateId: "gate-1" }),
    ).rejects.toThrow("Failed to request hint.");
  });
});
