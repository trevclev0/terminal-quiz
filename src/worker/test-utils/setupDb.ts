import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

/**
 * Applies all D1 migrations + seed data to the test database.
 *
 * Call once per test file in `beforeAll`. Each file gets a fresh
 * D1 instance (pool-workers per-file storage isolation), so
 * migrations must be applied per file.
 *
 * After this:
 * - All schema tables exist (from migrations/)
 * - E2E Test Program + 3 gates are seeded (from seed-e2e.sql)
 * - Session rows are NOT seeded — each test inserts its own
 *   with a unique sessionId
 */
export async function setupTestDb(): Promise<void> {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

  // D1's exec() splits by newlines, breaking multi-line SQL statements.
  // Split by semicolons and execute each statement via prepare().run().
  const statements = env.TEST_SEED_SQL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await env.DB.prepare(stmt).run();
  }
}
