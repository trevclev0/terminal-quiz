import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/react-app/routes",
      generatedRouteTree: "./src/react-app/routeTree.gen.ts",
      quoteStyle: "double",
    }),
    react(),
    ...(process.env.VITEST ? [] : [cloudflare()]),
  ],
  resolve: {
    alias: {
      "@hooks": fileURLToPath(
        new URL("./src/react-app/hooks", import.meta.url),
      ),
      "@components": fileURLToPath(
        new URL("./src/react-app/components", import.meta.url),
      ),
      "@routes": fileURLToPath(
        new URL("./src/react-app/routes", import.meta.url),
      ),
      "@utils": fileURLToPath(
        new URL("./src/react-app/utils", import.meta.url),
      ),
      "@api": fileURLToPath(new URL("./src/react-app/api", import.meta.url)),
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
  build: {
    minify: "oxc",
  },
  test: {
    environment: "happy-dom",
    setupFiles: "src/react-app/test-utils/setupTests.ts",
    alias: {
      "@test-utils": fileURLToPath(
        new URL("./src/react-app/test-utils", import.meta.url),
      ),
    },
    include: ["src/**/*.spec.{ts,tsx}", "scripts/**/*.spec.ts"],
    // Frontend integration specs (*.integration.spec.tsx) run here (happy-dom).
    // Backend integration specs (*.integration.spec.ts) excluded; run via test:integration.
    exclude: [...configDefaults.exclude, "src/**/*.integration.spec.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      include: ["src/**/*.{ts,tsx}", "scripts/**/*.ts"],
      exclude: [
        // Seed CLI entrypoints/data are build-time tooling, not app
        // runtime code; seedGenerator.ts itself is covered by its spec.
        "scripts/seed.ts",
        "scripts/seed-e2e.ts",
        "scripts/seedData.ts",
        "scripts/seedE2eData.ts",
        "src/react-app/App.tsx",
        "src/react-app/main.tsx",
        "src/react-app/vite-env.d.ts",
        ...configDefaults.exclude,
        "src/shared/authSchema.ts",
        "src/shared/schema.ts",
        "src/shared/types.ts",
        "src/react-app/routeTree.gen.ts",
        "src/worker/index.ts",
        "src/react-app/api/queryClient.ts",
        "src/worker/middleware/**",
        "src/react-app/routes/__root.tsx",
        "src/shared/gqlQueries.ts",
        "src/worker/routes/graphql.ts",
        "src/worker/routes/schema.ts",
        "scripts/dump-schema.ts",
        "**/test-utils/**",
      ],
      reporter: ["text", "json-summary", "json"],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 70,
        lines: 85,
      },
    },
  },
});
