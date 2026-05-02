import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const { DRIZZLE_DATABASE_URL } = process.env;
if (!DRIZZLE_DATABASE_URL) throw new Error("Missing DRIZZLE_DATABASE_URL");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: DRIZZLE_DATABASE_URL,
  },
});
