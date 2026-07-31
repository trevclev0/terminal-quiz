import type { Page } from "@playwright/test";
import { DELETE_PROGRAM_MUTATION } from "../src/shared/gqlQueries";
import { AUTH_BYPASS_USER_ID } from "../src/worker/test-utils/testConstants";

function getAuthBypassSecret(): string {
  const secret = process.env.AUTH_TEST_BYPASS_SECRET;
  if (!secret) {
    throw new Error("AUTH_TEST_BYPASS_SECRET environment variable is not set");
  }
  return secret;
}

export async function setupAuthBypass(page: Page): Promise<void> {
  const secret = getAuthBypassSecret();

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

/**
 * Deletes a program via the GraphQL API using the auth bypass headers.
 * Used by the authoring spec to clean up the program it creates.
 */
export async function deleteProgramViaApi(
  page: Page,
  programId: string,
): Promise<void> {
  const secret = getAuthBypassSecret();

  const response = await page.request.post("/api/graphql", {
    headers: {
      "Content-Type": "application/json",
      "x-auth-test-user-id": AUTH_BYPASS_USER_ID,
      "x-auth-test-user-secret": secret,
    },
    data: {
      query: DELETE_PROGRAM_MUTATION,
      variables: { id: programId },
    },
  });

  const body = (await response.json()) as {
    data?: { deleteProgram: boolean | null };
    errors?: { message: string }[];
  };
  if (!response.ok() || body.errors?.length) {
    throw new Error(
      `Failed to delete program ${programId}: ${body.errors?.[0]?.message ?? response.status()}`,
    );
  }
}
