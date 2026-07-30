import type { Page } from "@playwright/test";

const AUTH_BYPASS_USER_ID = "e2e-test-user";

export async function setupAuthBypass(page: Page): Promise<void> {
  const secret = process.env.AUTH_TEST_BYPASS_SECRET;
  if (!secret) {
    throw new Error("AUTH_TEST_BYPASS_SECRET environment variable is not set");
  }

  await page.route("**/api/graphql", async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-auth-test-user-id": AUTH_BYPASS_USER_ID,
        "x-auth-test-user-secret": secret,
      },
    });
  });
}
