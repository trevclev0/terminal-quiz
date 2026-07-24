import { beforeEach, describe, expect, it, vi } from "vitest";
import { graphqlFetch } from "./graphQlClient";

vi.mock("@utils/session", () => ({
  getSessionId: () => "test-session-id",
}));

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

const okJsonResponse = (data: unknown) =>
  ({ ok: true, status: 200, json: async () => data }) as unknown as Response;

const statusResponse = (status: number, data?: unknown) =>
  ({
    ok: false,
    status,
    json: async () => data,
  }) as unknown as Response;

describe("graphqlFetch", () => {
  it("returns data on successful fetch", async () => {
    mockFetch.mockResolvedValueOnce(okJsonResponse({ data: { token: "abc" } }));

    const result = await graphqlFetch<{ token: string }>("query { token }");

    expect(result).toEqual({ token: "abc" });
  });

  it("sends correct request shape", async () => {
    mockFetch.mockResolvedValueOnce(
      okJsonResponse({ data: { success: true } }),
    );

    await graphqlFetch("mutation { doThing }", { input: "foo" });

    expect(mockFetch).toHaveBeenCalledWith("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": "test-session-id",
      },
      body: JSON.stringify({
        query: "mutation { doThing }",
        variables: { input: "foo" },
      }),
    });
  });

  it("sends query without variables when none provided", async () => {
    mockFetch.mockResolvedValueOnce(okJsonResponse({ data: { ok: true } }));

    await graphqlFetch("{ test }");

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const callBody = JSON.parse(options.body as string);
    expect(callBody.query).toBe("{ test }");
    expect(callBody.variables).toBeUndefined();
  });

  it("includes x-session-id header from session util", async () => {
    mockFetch.mockResolvedValueOnce(okJsonResponse({ data: { ok: true } }));

    await graphqlFetch("{ test }");

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["x-session-id"]).toBe("test-session-id");
  });

  it("throws fallback message on HTTP 500 without body", async () => {
    mockFetch.mockResolvedValueOnce(statusResponse(500));

    await expect(graphqlFetch("{ test }")).rejects.toThrow(
      "GraphQL request failed with HTTP 500.",
    );
  });

  it("throws error message from GraphQL error body on HTTP 500", async () => {
    mockFetch.mockResolvedValueOnce(
      statusResponse(500, {
        data: null,
        errors: [{ message: "Internal server error" }],
      }),
    );

    await expect(graphqlFetch("{ test }")).rejects.toThrow(
      "Internal server error",
    );
  });

  it("throws first error message when HTTP is ok but response has errors", async () => {
    mockFetch.mockResolvedValueOnce(
      okJsonResponse({
        data: null,
        errors: [{ message: "Not found" }],
      }),
    );

    await expect(graphqlFetch("{ test }")).rejects.toThrow("Not found");
  });

  it("uses first error when multiple errors present", async () => {
    mockFetch.mockResolvedValueOnce(
      okJsonResponse({
        data: null,
        errors: [{ message: "First error" }, { message: "Second error" }],
      }),
    );

    await expect(graphqlFetch("{ test }")).rejects.toThrow("First error");
  });

  it("falls back to generic message when error has no message", async () => {
    mockFetch.mockResolvedValueOnce(
      okJsonResponse({
        data: null,
        errors: [{}],
      }),
    );

    await expect(graphqlFetch("{ test }")).rejects.toThrow(
      "GraphQL request failed with HTTP 200.",
    );
  });

  it("returns data when errors array is empty but data is present", async () => {
    mockFetch.mockResolvedValueOnce(
      okJsonResponse({
        data: { valid: true },
        errors: [],
      }),
    );

    const result = await graphqlFetch<{ valid: boolean }>("{ test }");
    expect(result).toEqual({ valid: true });
  });

  it("throws when data field is missing from response", async () => {
    mockFetch.mockResolvedValueOnce(okJsonResponse({}));

    await expect(graphqlFetch("{ test }")).rejects.toThrow(
      "GraphQL response did not include data.",
    );
  });

  it("throws on malformed JSON response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    } as unknown as Response);

    await expect(graphqlFetch("{ test }")).rejects.toThrow(
      "GraphQL request failed with HTTP 200.",
    );
  });

  it("throws on null response body", async () => {
    mockFetch.mockResolvedValueOnce(okJsonResponse(null));

    await expect(graphqlFetch("{ test }")).rejects.toThrow(
      "GraphQL response did not include data.",
    );
  });

  it("throws on array response body", async () => {
    mockFetch.mockResolvedValueOnce(okJsonResponse([]));

    await expect(graphqlFetch("{ test }")).rejects.toThrow(
      "GraphQL response did not include data.",
    );
  });

  it("propagates network error when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(graphqlFetch("{ test }")).rejects.toThrow("Failed to fetch");
  });
});
