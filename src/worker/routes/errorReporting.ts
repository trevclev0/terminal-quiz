import { sanitizeErrorText } from "@shared/sanitizeError";
import { trackEvent } from "@worker-graphql/gameplay/analytics";
import type { AppVariables } from "@worker-middleware/db";
import { Hono } from "hono";

const MAX_BODY_BYTES = 2048;
const MAX_SESSION_ID_LENGTH = 64;
const MAX_STACK_LENGTH = 1000;
const MAX_FIELD_LENGTH = 200;

/**
 * First-party telemetry sink for client-side errors.
 *
 * This is NOT a gameplay or authoring endpoint — it exists because error
 * capture must work exactly when the GraphQL client is broken (pre-bootstrap
 * chunk load, boundary failure). `navigator.sendBeacon` cannot set custom
 * headers, so the `sessionId` travels in the request body (a `Blob` typed
 * `application/json`). See docs/analytics.md "API boundary".
 *
 * Unauthenticated, so it validates the body size and schema, caps field
 * lengths, and sanitizes error text server-side. Client-side throttling is
 * not an abuse control — a direct caller is not throttled.
 */
export const errorReportingRouter = new Hono<AppVariables>().post(
  "/",
  async (c) => {
    // Reject oversized bodies from Content-Length before buffering, then
    // enforce a byte-counted cap on the actual body (raw.length counts UTF-16
    // units, not encoded bytes).
    const contentLength = Number(c.req.header("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return c.json({ ok: false }, 413);
    }

    const raw = await c.req.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return c.json({ ok: false }, 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return c.json({ ok: false }, 400);
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return c.json({ ok: false }, 400);
    }
    const fields = body as Record<string, unknown>;

    if (typeof fields.sessionId === "string") {
      c.set("sessionId", fields.sessionId.slice(0, MAX_SESSION_ID_LENGTH));
    }

    const source = fields.source;
    if (source !== "boot" && source !== "route" && source !== "boundary") {
      return c.json({ ok: false }, 400);
    }

    const detail = JSON.stringify({
      message:
        typeof fields.message === "string"
          ? sanitizeErrorText(fields.message)
          : "",
      stack:
        typeof fields.stack === "string"
          ? sanitizeErrorText(fields.stack, MAX_STACK_LENGTH)
          : "",
      path:
        typeof fields.path === "string"
          ? sanitizeErrorText(fields.path, MAX_FIELD_LENGTH)
          : "",
      userAgent:
        typeof fields.userAgent === "string"
          ? sanitizeErrorText(fields.userAgent, MAX_FIELD_LENGTH)
          : "",
    });

    trackEvent(c, {
      name: "client_error",
      outcome: source,
      detail,
    });

    return c.json({ ok: true });
  },
);
