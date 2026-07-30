import type { Page } from "@playwright/test";

const AUTH_BYPASS_USER_ID = "e2e-test-user";
const AUTH_BYPASS_SECRET = "e2e-test-secret";

export async function setupAuthBypass(page: Page): Promise<void> {
  await page.route("**/api/graphql", (route) => {
    route.continue({
      headers: {
        ...route.request().headers(),
        "x-auth-test-user-id": AUTH_BYPASS_USER_ID,
        "x-auth-test-user-secret": AUTH_BYPASS_SECRET,
      },
    });
  });
}
