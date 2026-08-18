import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { AppVariables } from "./db";

export const SESSION_COOKIE_NAME = "anon_gameplay_session";
export const SESSION_COOKIE_PATH = "/api";

/**
 * Anonymous gameplay identity — server-issued, cookie-transported.
 *
 * A session UUID is minted server-side so it exists before the app ever
 * boots (error capture must work pre-bootstrap). When no cookie is present,
 * mints a UUID and Set-Cookies it on the response. Identity is never read
 * from a client header. The `x-session-id` header is required on gameplay
 * mutations by `requireSessionHeader` as a same-origin tripwire, but carries
 * no identity.
 *
 * Cookie name deliberately avoids the `terminal-quiz.*` namespace — Better
 * Auth owns that (`terminal-quiz.session_token`, `terminal-quiz.session_data`)
 * for authorship identity. This cookie is a decoupled, anonymous gameplay
 * identity (`Path=/api` vs Better Auth's `Path=/`). Do not merge or delete
 * one for the other; the two identity systems coexist by design (see
 * CONVENTIONS.md). Attributes mirror Better Auth's `useSecureCookies` logic.
 */
export const sessionMiddleware = createMiddleware<AppVariables>(
  async (c, next) => {
    let sessionId = getCookie(c, SESSION_COOKIE_NAME);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      setCookie(c, SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: c.env.ENVIRONMENT !== "development",
        sameSite: "Lax",
        path: SESSION_COOKIE_PATH,
      });
    }
    c.set("sessionId", sessionId);
    await next();
  },
);
