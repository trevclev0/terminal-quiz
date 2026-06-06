import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), !process.env.VITEST && cloudflare()].filter(Boolean),
  resolve: {
    alias: {
      "@hooks": fileURLToPath(
        new URL("./src/react-app/hooks", import.meta.url),
      ),
      "@components": fileURLToPath(
        new URL("./src/react-app/components", import.meta.url),
      ),
      "@contexts": fileURLToPath(
        new URL("./src/react-app/contexts", import.meta.url),
      ),
      "@utils": fileURLToPath(
        new URL("./src/react-app/utils", import.meta.url),
      ),
      "@api": fileURLToPath(new URL("./src/react-app/api", import.meta.url)),
      "@shared": fileURLToPath(new URL("./src/shared", import.meta.url)),
      "@worker": fileURLToPath(new URL("./src/worker", import.meta.url)),
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
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/react-app/App.tsx",
        "src/react-app/main.tsx",
        "src/react-app/vite-env.d.ts",
        ...configDefaults.exclude,
        "src/shared/schema.ts",
        "src/shared/types.ts",
      ],
      reporter: ["text", "json-summary", "json"],
    },
  },
});
