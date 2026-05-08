import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    open: true,
  },
  plugins: [react(), !process.env.VITEST && cloudflare()].filter(Boolean),
  build: {
    minify: "oxc",
  },
  test: {
    environment: "happy-dom",
    setupFiles: "src/react-app/test-utils/setupTests.ts",
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/react-app/App.tsx",
        "src/react-app/main.tsx",
        "src/react-app/vite-env.d.ts",
        ...configDefaults.exclude,
        "src/worker/db/schema.ts",
        "src/worker/db/types.ts",
      ],
    },
  },
});
