import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/68b35e1e2f51a6a1a48d7b8210bd41a01c4e1d085f25a78a4c0d51aea32ea598.sqlite",
  },
});
