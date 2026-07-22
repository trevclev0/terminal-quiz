import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

// ESM-compatible __dirname — derived from import.meta.url since
// __dirname is not a global in ESM modules.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read seed SQL in Node.js context (config runs in Node, not workerd).
// Strip comment lines — D1's exec() rejects lines that contain no SQL statement.
const seedSQL = readFileSync(
  path.join(__dirname, "scripts/seed-e2e.sql"),
  "utf-8",
)
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n");

export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrations = await readD1Migrations(
        path.join(__dirname, "migrations"),
      );
      return {
        // Load the real worker entry point — tests the full Hono stack
        main: "./src/worker/index.ts",
        miniflare: {
          compatibilityDate: "2026-04-27",
          compatibilityFlags: ["nodejs_compat"],
          bindings: {
            ENVIRONMENT: "test",
            // Pass migrations + seed SQL as bindings for runtime application
            TEST_MIGRATIONS: migrations,
            TEST_SEED_SQL: seedSQL,
          },
          // Test-only D1 database (Miniflare creates in-memory SQLite)
          d1Databases: { DB: "test-db" },
          // No AI binding — generateClue handles missing AI gracefully.
          // For requestClue tests, use vi.mock() on aiService (spike in Phase 2a).
        },
      };
    }),
  ],
  resolve: {
    alias: {
      // Mirror path aliases from vite.config.ts for worker-side imports
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "@worker-routes": fileURLToPath(
        new URL("./src/worker/routes", import.meta.url),
      ),
      "@worker-middleware": fileURLToPath(
        new URL("./src/worker/middleware", import.meta.url),
      ),
      "@worker-services": fileURLToPath(
        new URL("./src/worker/services", import.meta.url),
      ),
      "@worker-utils": fileURLToPath(
        new URL("./src/worker/utils", import.meta.url),
      ),
      "@worker-graphql": fileURLToPath(
        new URL("./src/worker/graphql", import.meta.url),
      ),
      "@worker-test-utils": fileURLToPath(
        new URL("./src/worker/test-utils", import.meta.url),
      ),
    },
  },
  test: {
    include: ["src/**/*.integration.spec.ts"],
    // Mirror unit test config — automatically reset mocks between tests
    clearMocks: true,
    restoreMocks: true,
  },
});
