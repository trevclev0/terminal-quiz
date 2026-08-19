import { exports } from "cloudflare:workers";
import { SESSION_COOKIE_NAME } from "@worker-middleware/session";
import {
  TRIPWIRE_HEADER,
  TRIPWIRE_HEADER_VALUE,
} from "@worker-test-utils/testConstants";
import type { DocumentNode } from "graphql";
import { print } from "graphql";

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
  query: string | DocumentNode,
  opts: GqlRequestOptions = {},
): Promise<GqlResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    [TRIPWIRE_HEADER]: TRIPWIRE_HEADER_VALUE,
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

  const queryText = typeof query === "string" ? query : print(query);

  const response = await exports.default.fetch(
    new Request("http://localhost/api/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: queryText,
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
