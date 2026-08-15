import { trackEvent } from "@worker-graphql/gameplay/analytics";
import type { AppVariables } from "@worker-middleware/db";
import { Hono } from "hono";

/**
 * First-party telemetry sink for client-side errors.
 *
 * This is NOT a gameplay or authoring endpoint — it exists because error
 * capture must work exactly when the GraphQL client is broken (pre-bootstrap
 * chunk load, boundary failure), and `navigator.sendBeacon` can only POST
 * `text/plain` without headers. See docs/analytics.md "API boundary".
 */
export const errorReportingRouter = new Hono<AppVariables>().post(
  "/",
  async (c) => {
    let body: Record<string, unknown>;
    try {
      body = (await c.req.json()) as Record<string, unknown>;
    } catch {
      return c.json({ ok: false }, 400);
    }

    // Beacon cannot set the x-session-id header — it travels in the body.
    if (typeof body.sessionId === "string") {
      c.set("sessionId", body.sessionId);
    }

    const source = body.source;
    const outcome =
      source === "boot" ? "boot" : source === "route" ? "route" : "boundary";

    const detail = JSON.stringify({
      message: typeof body.message === "string" ? body.message : "",
      stack: typeof body.stack === "string" ? body.stack : "",
      path: typeof body.path === "string" ? body.path : "",
      userAgent: typeof body.userAgent === "string" ? body.userAgent : "",
    });

    trackEvent(c, {
      name: "client_error",
      outcome,
      detail,
    });

    return c.json({ ok: true });
  },
);
