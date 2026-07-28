import { getAuth } from "@worker-services/auth";
import { createMiddleware } from "hono/factory";
import type { AppVariables, AuthUser } from "./db";

const TEST_USER_ID_HEADER = "x-auth-test-user-id";
const TEST_USER_SECRET_HEADER = "x-auth-test-user-secret";

export const authMiddleware = createMiddleware<AppVariables>(
  async (c, next) => {
    const env = c.env;

    const bypassEnabled =
      env.ENVIRONMENT &&
      env.ENVIRONMENT !== "production" &&
      env.AUTH_TEST_BYPASS_ENABLED === "true" &&
      env.AUTH_TEST_BYPASS_SECRET;

    if (bypassEnabled) {
      const testUserId = c.req.header(TEST_USER_ID_HEADER);
      const testSecret = c.req.header(TEST_USER_SECRET_HEADER);

      if (testUserId && testSecret === env.AUTH_TEST_BYPASS_SECRET) {
        const testUser: AuthUser = {
          id: testUserId,
          email: `${testUserId}@test.example.com`,
          name: testUserId,
          image: null,
        };
        c.set("user", testUser);
        await next();
        return;
      }
    }

    const auth = getAuth(c);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (session?.user) {
      c.set("user", session.user);
    }
    await next();
  },
);
