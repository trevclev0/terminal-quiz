/**
 * seed.ts
 *
 * Writes seed data to the local Cloudflare D1 SQLite file managed by Wrangler.
 *
 * Prerequisites:
 *   1. `npx wrangler d1 create <db-name>` has been run and wrangler.toml is updated
 *   2. `npx wrangler d1 migrations apply <db-name> --local` has been run
 *   3. `better-sqlite3` is installed as a dev dependency
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 */

import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";
import { gateRows, programRows } from "./seed-data";

const { DRIZZLE_DATABASE_URL } = process.env;
if (!DRIZZLE_DATABASE_URL) throw new Error("Missing DRIZZLE_DATABASE_URL");

// ---------------------------------------------------------------------------
// Assumption: Wrangler stores the local D1 SQLite file at this path.
// The final segment ("DB") must match the `binding` name in your wrangler.toml.
// Verify this path exists after running `wrangler d1 migrations apply --local`.
// ---------------------------------------------------------------------------
const DB_PATH = join(process.cwd(), DRIZZLE_DATABASE_URL);
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite, { schema });

try {
  console.log("🌱 Starting seed...\n");

  await db.transaction(async (tx) => {
    // Clear existing data (gates first due to foreign key on programId)
    await tx.delete(schema.gates);
    await tx.delete(schema.programs);

    // Insert programs
    await tx.insert(schema.programs).values(programRows);
    console.log(`✓ Inserted ${programRows.length} programs`);

    // Insert gates
    await tx.insert(schema.gates).values(gateRows);
    console.log(`✓ Inserted ${gateRows.length} gates`);
  });

  console.log("\n✅ Seed complete.");
} finally {
  sqlite.close();
}
