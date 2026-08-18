import { exports } from "cloudflare:workers";
import { SESSION_COOKIE_NAME } from "@worker-middleware/session";

const TRIPWIRE_HEADER = "x-session-id";
// Constant, value-agnostic: presence proves same-origin JS (a cross-site
// fetch cannot set a custom header; a <form> POST cannot set one at all).
// Identity is carried by the server-issued session cookie only.
const TRIPWIRE_VALUE = "terminal-quiz";

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
  /** `Set-Cookie` from the response, when the server minted a session cookie. */
  setCookie: string | null;
}

/**
 * Sends a GraphQL request to the worker's /api/graphql endpoint.
 *
 * Uses `exports.default.fetch()` which calls the real worker entry
 * point — exercises the full Hono middleware stack (logger, setupDb,
 * sessionMiddleware, requireSessionHeader, graphql route) with real D1
 * bindings.
 *
 * Session identity comes from the server-issued session cookie, transported
 * as a `Cookie` header. Pass a unique sessionId per test case for isolation.
 * Always sends the constant `x-session-id` tripwire header so mutations pass
 * the CSRF guard.
 */
export async function gqlRequest(
  query: string,
  opts: GqlRequestOptions = {},
): Promise<GqlResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    [TRIPWIRE_HEADER]: TRIPWIRE_VALUE,
  };
  if (opts.sessionId) {
    headers.Cookie = `${SESSION_COOKIE_NAME}=${opts.sessionId}`;
  }
  if (Boolean(opts.testUserId) !== Boolean(opts.testSecret)) {
    throw new Error(
      "gqlRequest: testUserId and testSecret must be provided together",
    );
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
    setCookie: response.headers.get("set-cookie"),
  };
}
