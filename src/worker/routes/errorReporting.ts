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
    const raw = await c.req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return c.json({ ok: false }, 413);
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return c.json({ ok: false }, 400);
    }

    if (typeof body.sessionId === "string") {
      c.set("sessionId", body.sessionId.slice(0, MAX_SESSION_ID_LENGTH));
    }

    const source = body.source;
    const outcome =
      source === "boot" ? "boot" : source === "route" ? "route" : "boundary";

    const detail = JSON.stringify({
      message:
        typeof body.message === "string" ? sanitizeErrorText(body.message) : "",
      stack:
        typeof body.stack === "string"
          ? sanitizeErrorText(body.stack, MAX_STACK_LENGTH)
          : "",
      path:
        typeof body.path === "string"
          ? sanitizeErrorText(body.path, MAX_FIELD_LENGTH)
          : "",
      userAgent:
        typeof body.userAgent === "string"
          ? sanitizeErrorText(body.userAgent, MAX_FIELD_LENGTH)
          : "",
    });

    trackEvent(c, {
      name: "client_error",
      outcome,
      detail,
    });

    return c.json({ ok: true });
  },
);
