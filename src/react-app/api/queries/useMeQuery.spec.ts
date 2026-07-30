import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";
import { useMeQuery } from "./useMeQuery";

describe("useMeQuery", () => {
  it("returns user when authenticated", async () => {
    const mockUser = { id: "1", email: "a@b.com", name: "Test", image: null };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { me: mockUser } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useMeQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockUser);
  });

  it("returns null when unauthenticated", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { me: null } }),
    } as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useMeQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });
});
