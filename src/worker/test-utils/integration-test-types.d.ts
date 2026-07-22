/// <reference types="@cloudflare/vitest-pool-workers" />
/// <reference path="../../../node_modules/@cloudflare/vitest-pool-workers/types/cloudflare-test.d.ts" />

// Augment Cloudflare.Env with test-only bindings.
// These are provided by vitest.config.integration.ts and only
// exist in the integration test runtime — never in production.
declare namespace Cloudflare {
  interface Env {
    TEST_MIGRATIONS: { name: string; queries: string[] }[];
    TEST_SEED_SQL: string;
  }
}
