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

const sqlEscapeValue = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
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
  const columns = Object.keys(program).join(", ");
  const values = Object.values(program).map(sqlEscapeValue).join(", ");
  lines.push(`INSERT INTO programs (${columns}) VALUES (${values});`);
}

lines.push("");

for (const gate of gateRows) {
  const columns = Object.keys(gate).join(", ");
  const values = Object.values(gate).map(sqlEscapeValue).join(", ");
  lines.push(`INSERT INTO gates (${columns}) VALUES (${values});`);
}

lines.push("");

const outputPath = join(process.cwd(), "scripts/seed.sql");
writeFileSync(outputPath, lines.join("\n"));
console.log(`✅ Generated scripts/seed.sql`);
console.log(`   ${programRows.length} programs, ${gateRows.length} gates`);
