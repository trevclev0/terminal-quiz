import { getOperationAST, parse } from "graphql";
import { createMiddleware } from "hono/factory";
import type { AppVariables } from "./db";

const SESSION_HEADER = "x-session-id";

/**
 * Same-origin tripwire for gameplay mutations — NOT a nonce.
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
 * JSON, unparseable queries, documents without a single resolvable operation
 * (e.g. multi-operation documents without an `operationName`), and any
 * mutation over GET are rejected; `undefined` operation types are never
 * treated as `"query"` and passed through.
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
      try {
        const ast = parse(query);
        const op = getOperationAST(
          ast,
          typeof operationName === "string" ? operationName : undefined,
        );
        operationType = op?.operation;
      } catch {
        return c.json({ errors: [{ message: "GraphQL syntax error." }] }, 400);
      }
    } else if (c.req.method === "GET") {
      const query = c.req.query("query");
      if (query) {
        try {
          const ast = parse(query);
          const op = getOperationAST(
            ast,
            c.req.query("operationName") || undefined,
          );
          operationType = op?.operation;
        } catch {
          return c.json(
            { errors: [{ message: "GraphQL syntax error." }] },
            400,
          );
        }
      }
    }

    if (operationType === "mutation" && c.req.method === "GET") {
      return c.json(
        { errors: [{ message: "Mutations are not supported over GET." }] },
        400,
      );
    }

    // "query" passes freely; mutations and unresolvable operations (including
    // `undefined`) require the header.
    if (operationType !== "query" && !hasSessionHeader) {
      return c.json(
        { errors: [{ message: `Missing required ${SESSION_HEADER} header.` }] },
        400,
      );
    }

    return next();
  },
);
