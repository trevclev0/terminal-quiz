import { exports } from "cloudflare:workers";

export interface GqlRequestOptions {
  sessionId?: string;
  variables?: Record<string, unknown>;
  /** Test auth bypass headers — set `testUserId` + `testSecret` to authenticate. */
  testUserId?: string;
  testSecret?: string;
}

export interface GqlResponse {
  status: number;
  body: {
    data?: unknown;
    errors?: { message: string }[];
  };
}

/**
 * Sends a GraphQL request to the worker's /api/graphql endpoint.
 *
 * Uses `exports.default.fetch()` which calls the real worker entry
 * point — exercises the full Hono middleware stack (logger, setupDb,
 * sessionMiddleware, graphql route) with real D1 bindings.
 *
 * Session identity comes from the `x-session-id` header, same as
 * production. Pass a unique sessionId per test case for isolation.
 */
export async function gqlRequest(
  query: string,
  opts: GqlRequestOptions = {},
): Promise<GqlResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.sessionId) {
    headers["x-session-id"] = opts.sessionId;
  }
  if (opts.testUserId && opts.testSecret) {
    headers["x-auth-test-user-id"] = opts.testUserId;
    headers["x-auth-test-user-secret"] = opts.testSecret;
  }

  const response = await exports.default.fetch(
    new Request("http://localhost/api/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables: opts.variables ?? {},
      }),
    }),
  );

  return {
    status: response.status,
    body: (await response.json()) as GqlResponse["body"],
  };
}
