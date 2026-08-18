import { type DocumentNode, getOperationAST, parse } from "graphql";
import { createMiddleware } from "hono/factory";
import type { AppVariables } from "./db";

const SESSION_HEADER = "x-session-id";

/**
 * Same-origin tripwire for mutations — NOT a nonce.
 *
 * Identity comes from the server-issued HttpOnly cookie (see
 * `sessionMiddleware`). This guard only asserts the request came from
 * same-origin JS: a cross-site XHR/fetch cannot set a custom header (CORS
 * preflight fails — the worker sends no Access-Control-Allow-Origin) and a
 * plain `<form>` POST cannot set custom headers at all. The value is a
 * constant discoverable in bundled JS, so it adds no cryptographic strength.
 *
 * Uses a real GraphQL parse (`parse` + `getOperationAST`) — this is a
 * security control, not a string-match convenience. Fail-closed: malformed
 * JSON, unparseable queries, and documents without a single resolvable
 * operation (e.g. multi-operation documents without an `operationName`) are
 * rejected before the header check; `undefined` operation types are never
 * treated as `"query"` and passed through. A headerless GET with no `query`
 * param is allowed through — that is the non-production GraphiQL entry
 * request, which has no operation to protect.
 */
export const requireSessionHeader = createMiddleware<AppVariables>(
  async (c, next) => {
    const hasSessionHeader = Boolean(c.req.header(SESSION_HEADER));

    let operationType: string | undefined;
    if (c.req.method === "POST") {
      // Clone before reading — @hono/graphql-server consumes the original.
      let rawBody: unknown;
      try {
        rawBody = await c.req.raw.clone().json();
      } catch {
        return c.json({ errors: [{ message: "Invalid JSON body." }] }, 400);
      }
      if (
        typeof rawBody !== "object" ||
        rawBody === null ||
        Array.isArray(rawBody)
      ) {
        return c.json(
          { errors: [{ message: "Invalid GraphQL request." }] },
          400,
        );
      }
      const { query, operationName } = rawBody as {
        query?: unknown;
        operationName?: unknown;
      };
      if (typeof query !== "string") {
        return c.json(
          { errors: [{ message: "Must provide query string." }] },
          400,
        );
      }
      const resolved = tryResolveOperation(
        query,
        typeof operationName === "string" ? operationName : undefined,
      );
      if (!resolved.ok) return c.json(resolved.errors, 400);
      operationType = resolved.operationType;
    } else if (c.req.method === "GET") {
      const query = c.req.query("query");
      // Headerless query-less GET = GraphiQL entry request. Nothing to
      // protect — let it through so graphqlServer can serve the UI.
      if (!query) return next();
      const resolved = tryResolveOperation(
        query,
        c.req.query("operationName") || undefined,
      );
      if (!resolved.ok) return c.json(resolved.errors, 400);
      operationType = resolved.operationType;
    }

    if (operationType === "mutation") {
      if (c.req.method === "GET") {
        return c.json(
          { errors: [{ message: "Mutations are not supported over GET." }] },
          400,
        );
      }
      if (!hasSessionHeader) {
        return c.json(
          {
            errors: [{ message: `Missing required ${SESSION_HEADER} header.` }],
          },
          400,
        );
      }
    }

    return next();
  },
);

type ResolvedOperation =
  | { ok: true; operationType: string }
  | { ok: false; errors: { errors: { message: string }[] } };

function tryResolveOperation(
  query: string,
  operationName: string | undefined,
): ResolvedOperation {
  let ast: DocumentNode;
  try {
    ast = parse(query);
  } catch {
    return {
      ok: false,
      errors: { errors: [{ message: "GraphQL syntax error." }] },
    };
  }
  const op = getOperationAST(ast, operationName);
  if (!op) {
    return {
      ok: false,
      errors: {
        errors: [{ message: "GraphQL operation could not be resolved." }],
      },
    };
  }
  return { ok: true, operationType: op.operation };
}
