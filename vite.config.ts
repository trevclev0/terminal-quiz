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
        "src/index.tsx",
        "src/App.tsx",
        ...configDefaults.exclude,
        "**/*.types.ts",
        "**/*.d.ts",
      ],
    },
  },
});
