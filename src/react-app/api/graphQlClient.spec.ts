import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GET_PROGRAMS_QUERY,
  SUBMIT_GUESS_MUTATION,
} from "../../shared/gqlQueries";
import { graphqlRequest } from "./graphQlClient";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockImplementation(mockFetch);
});

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
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: { programs: [{ id: "p1", name: "Program 1" }] },
      }),
    );

    const result = await graphqlRequest(GET_PROGRAMS_QUERY);

    expect(result).toEqual({
      programs: [{ id: "p1", name: "Program 1" }],
    });
  });

  it("sends correct request shape", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          submitGuess: {
            success: true,
            message: "ok",
            canRequestClue: false,
            nextGate: null,
          },
        },
      }),
    );

    await graphqlRequest(SUBMIT_GUESS_MUTATION, {
      programId: "prog-1",
      gateId: "gate-1",
      guess: "my answer",
    });

    const [url, options] = mockFetch.mock.calls[0] as [Request, RequestInit];
    expect(new URL(url as unknown as string).pathname).toBe("/api/graphql");
    expect(options.method).toBe("POST");
    const headers = new Headers(options.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    const body = JSON.parse(options.body as string);
    expect(body.query).toContain("SubmitGuess");
    expect(body.variables).toEqual({
      programId: "prog-1",
      gateId: "gate-1",
      guess: "my answer",
    });
  });

  it("omits variables when none provided", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { programs: [] } }));

    await graphqlRequest(GET_PROGRAMS_QUERY);

    const [, options] = mockFetch.mock.calls[0] as [Request, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.query).toContain("GetPrograms");
    expect(body.variables).toBeUndefined();
  });

  it("includes the constant x-session-id tripwire header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: { programs: [] } }));

    await graphqlRequest(GET_PROGRAMS_QUERY);

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

    await expect(graphqlRequest(GET_PROGRAMS_QUERY)).rejects.toThrow(
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

    await expect(graphqlRequest(GET_PROGRAMS_QUERY)).rejects.toThrow(
      "Internal server error",
    );
  });

  it("throws first error message when HTTP is ok but response has errors", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: null, errors: [{ message: "Not found" }] }),
    );

    await expect(graphqlRequest(GET_PROGRAMS_QUERY)).rejects.toThrow(
      "Not found",
    );
  });

  it("uses first error when multiple errors present", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: null,
        errors: [{ message: "First error" }, { message: "Second error" }],
      }),
    );

    await expect(graphqlRequest(GET_PROGRAMS_QUERY)).rejects.toThrow(
      "First error",
    );
  });

  it("falls back to generic message when error has no message", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: null, errors: [{}] }));

    await expect(graphqlRequest(GET_PROGRAMS_QUERY)).rejects.toThrow(
      "GraphQL request failed with HTTP 200.",
    );
  });

  it("returns data when errors array is empty but data is present", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { programs: [] }, errors: [] }),
    );

    const result = await graphqlRequest(GET_PROGRAMS_QUERY);
    expect(result).toEqual({ programs: [] });
  });

  it("throws when data field is missing from response", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await expect(graphqlRequest(GET_PROGRAMS_QUERY)).rejects.toThrow(
      "GraphQL response did not include data.",
    );
  });

  it("throws when data is null with an empty errors array", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: null, errors: [] }));

    await expect(graphqlRequest(GET_PROGRAMS_QUERY)).rejects.toThrow(
      "GraphQL response did not include data.",
    );
  });

  it("propagates JSON parse errors unchanged", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () => "<html>",
    } as unknown as Response);

    await expect(graphqlRequest(GET_PROGRAMS_QUERY)).rejects.toBeInstanceOf(
      SyntaxError,
    );
  });

  it("propagates network error when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(graphqlRequest(GET_PROGRAMS_QUERY)).rejects.toThrow(
      "Failed to fetch",
    );
  });
});
