import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { graphqlRequest } from "./graphQlClient";

const mockFetch = vi.fn();

beforeEach(() => {
  globalThis.fetch = mockFetch;
});

const testDoc = "{ test }" as unknown as TypedDocumentNode<
  { test: string },
  Record<string, never>
>;

const testDocWithVars =
  "mutation DoThing($input: String!) { doThing(input: $input) }" as unknown as TypedDocumentNode<
    { doThing: boolean },
    { input: string }
  >;

const jsonResponse = (payload: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-type" ? "application/json" : null,
    },
    text: async () => JSON.stringify(payload),
  }) as unknown as Response;

describe("graphqlRequest", () => {
  it("returns data on successful request", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { test: "abc" } }));

    const result = await graphqlRequest(testDoc);

    expect(result).toEqual({ test: "abc" });
  });

  it("sends correct request shape", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { doThing: true } }));

    await graphqlRequest(testDocWithVars, { input: "foo" });

    const [url, options] = mockFetch.mock.calls[0] as [Request, RequestInit];
    expect(new URL(url as unknown as string).pathname).toBe("/api/graphql");
    expect(options.method).toBe("POST");
    const headers = new Headers(options.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    const body = JSON.parse(options.body as string);
    expect(body.query).toContain("doThing");
    expect(body.variables).toEqual({ input: "foo" });
  });

  it("omits variables when none provided", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { test: "x" } }));

    await graphqlRequest(testDoc);

    const [, options] = mockFetch.mock.calls[0] as [Request, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.query).toBe("{ test }");
    expect(body.variables).toBeUndefined();
  });

  it("includes the constant x-session-id tripwire header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { test: "x" } }));

    await graphqlRequest(testDoc);

    const [, options] = mockFetch.mock.calls[0] as [Request, RequestInit];
    const headers = new Headers(options.headers);
    expect(headers.get("x-session-id")).toBe("terminal-quiz");
  });

  it("throws fallback message on HTTP 500 without body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: { get: () => "application/json" },
      text: async () => "",
    } as unknown as Response);

    await expect(graphqlRequest(testDoc)).rejects.toThrow(
      "GraphQL request failed with HTTP 500.",
    );
  });

  it("throws error message from GraphQL error body on HTTP 500", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { data: null, errors: [{ message: "Internal server error" }] },
        500,
      ),
    );

    await expect(graphqlRequest(testDoc)).rejects.toThrow(
      "Internal server error",
    );
  });

  it("throws first error message when HTTP is ok but response has errors", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: null, errors: [{ message: "Not found" }] }),
    );

    await expect(graphqlRequest(testDoc)).rejects.toThrow("Not found");
  });

  it("uses first error when multiple errors present", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: null,
        errors: [{ message: "First error" }, { message: "Second error" }],
      }),
    );

    await expect(graphqlRequest(testDoc)).rejects.toThrow("First error");
  });

  it("falls back to generic message when error has no message", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: null, errors: [{}] }));

    await expect(graphqlRequest(testDoc)).rejects.toThrow(
      "GraphQL request failed with HTTP 200.",
    );
  });

  it("returns data when errors array is empty but data is present", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { test: "valid" }, errors: [] }),
    );

    const result = await graphqlRequest(testDoc);
    expect(result).toEqual({ test: "valid" });
  });

  it("throws when data field is missing from response", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await expect(graphqlRequest(testDoc)).rejects.toThrow(
      "GraphQL response did not include data.",
    );
  });

  it("propagates network error when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(graphqlRequest(testDoc)).rejects.toThrow("Failed to fetch");
  });
});
