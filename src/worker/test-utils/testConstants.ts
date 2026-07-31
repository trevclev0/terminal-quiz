/**
 * Shared constants for the test auth bypass.
 *
 * The user ID must match the fixture row seeded in `scripts/seed-e2e.sql`.
 * The secret must match the `AUTH_TEST_BYPASS_SECRET` binding used by
 * integration tests (`vitest.config.integration.ts`). Consumed by the
 * worker integration specs, the integration config, and Playwright e2e.
 */
export const TEST_USER_ID = "e2e-test-user";
export const AUTH_BYPASS_USER_ID = TEST_USER_ID;
export const INTEGRATION_TEST_SECRET = "integration-test-secret";
