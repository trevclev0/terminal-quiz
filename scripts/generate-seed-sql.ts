/**
 * generate-seed-sql.ts
 *
 * Generates a seed.sql file from seed-data.ts that can be applied to any
 * Cloudflare D1 database (local or remote) via wrangler d1 execute.
 *
 * Usage:
 *   pnpm seed:generate-sql
 *
 * Output:
 *   scripts/seed.sql
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { gateRows, programRows } from "./seed-data";

const toSnakeCase = (str: string): string =>
  str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const sqlEscapeVal = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

const toInsert = (table: string, row: Record<string, unknown>): string => {
  const columns = Object.keys(row).map(toSnakeCase).join(", ");
  const values = Object.values(row).map(sqlEscapeVal).join(", ");
  return `INSERT INTO ${table} (${columns}) VALUES (${values});`;
};

const lines: string[] = [
  "-- Auto-generated seed file. Do not edit manually.",
  "-- Regenerate with: pnpm seed:generate-sql",
  "",
  "DELETE FROM gates;",
  "DELETE FROM programs;",
  "",
];

for (const program of programRows) {
  lines.push(toInsert("programs", program as Record<string, unknown>));
}

lines.push("");

for (const gate of gateRows) {
  lines.push(toInsert("gates", gate as Record<string, unknown>));
}

lines.push("");

const outputPath = join(process.cwd(), "scripts/seed.sql");
writeFileSync(outputPath, lines.join("\n"));
console.log(`✅ Generated scripts/seed.sql`);
console.log(`   ${programRows.length} programs, ${gateRows.length} gates`);
