import { useProgramsQuery } from "@api/queries/useProgramsQuery";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createQueryWrapper } from "../../test-utils/queryTestUtils";

const mockPrograms = [{ id: "1", name: "Program A" }];

describe("useProgramsQuery", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it("fetches and returns programs successfully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () => JSON.stringify({ data: { programs: mockPrograms } }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();

    const { result } = renderHook(() => useProgramsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPrograms);
  });

  it("throws an error if the HTTP request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: false,
      status: 500,
      text: async () => "",
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useProgramsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe(
      "GraphQL request failed with HTTP 500.",
    );
  });

  it("throws the first GraphQL error message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      text: async () =>
        JSON.stringify({ errors: [{ message: "Access denied" }] }),
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useProgramsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Access denied");
  });

  it("throws when response is malformed JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      headers: { get: () => "application/json" },
      ok: true,
      status: 200,
      text: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    } as unknown as Response);

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useProgramsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Unexpected token <");
  });

  it("throws on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Failed to fetch"),
    );

    const { wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useProgramsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Failed to fetch");
  });
});
