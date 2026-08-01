import type { Param, SQL } from "drizzle-orm";
import { getTableColumns, sql } from "drizzle-orm";
import { CasingCache } from "drizzle-orm/casing";
import { SQLiteSyncDialect, type SQLiteTable } from "drizzle-orm/sqlite-core";

// Pure, side-effect-free SQL generation. Compiles typed rows (checked
// against src/shared/schema.ts / src/shared/authSchema.ts) into inlined
// SQL text that `wrangler d1 execute --file=` can run directly.
//
// Uses `getTableColumns()` (a public, documented Drizzle export) rather
// than reaching into internal symbols — stable across drizzle-orm minor
// bumps. Value encoding (booleans -> 0/1, Date -> epoch ms, string
// escaping) is handled by Drizzle's own column encoders + inline-param
// renderer (`SQL#toQuery({ inlineParams: true })`), not hand-rolled here.

const dialect = new SQLiteSyncDialect();
// `casing` isn't part of SQLiteSyncDialect's public type surface (only
// exposed as a constructor option), so build our own — same class the
// dialect uses internally, exported publicly from drizzle-orm/casing.
const casing = new CasingCache();

function toInlineSql(query: SQL): string {
  return query.toQuery({
    casing,
    escapeName: dialect.escapeName.bind(dialect),
    escapeString: dialect.escapeString.bind(dialect),
    escapeParam: dialect.escapeParam.bind(dialect),
    inlineParams: true,
  }).sql;
}

/**
 * Compiles a single INSERT statement (all rows in one VALUES list) with
 * inlined, escaped literals. Columns omitted from a row (`undefined`)
 * are left out of the statement entirely, so SQLite applies the
 * column's own DEFAULT (matches Drizzle's `.values()` behavior).
 *
 * @param onConflict - optional raw SQL fragment appended after the
 *   VALUES list, e.g. `sql.raw("ON CONFLICT DO NOTHING")` or a
 *   `ON CONFLICT(id) DO UPDATE SET ...` fragment for idempotent seeds.
 */
export function insertSql<T extends SQLiteTable>(
  table: T,
  rows: T["$inferInsert"][],
  onConflict?: SQL,
): string {
  if (rows.length === 0) {
    return "";
  }

  const columns = getTableColumns(table);
  const values = rows.map((row) => {
    const params: Record<string, Param | SQL> = {};
    for (const [field, column] of Object.entries(columns)) {
      const value = (row as Record<string, unknown>)[field];
      if (value === undefined) {
        continue;
      }
      params[field] = sql.param(value, column);
    }
    return params;
  });

  const query = dialect.buildInsertQuery({
    table,
    values,
    onConflict: onConflict ? [sql` ${onConflict}`] : undefined,
  });

  return `${toInlineSql(query)};`;
}

/**
 * Compiles `DELETE FROM <table> WHERE <where>` with inlined literals.
 * Intended for scoped cleanup (e.g. removing retired system-seeded rows
 * by id), never for unscoped/destructive deletes against live data.
 */
export function deleteWhereSql(table: SQLiteTable, where: SQL): string {
  return `${toInlineSql(sql`delete from ${table} where ${where}`)};`;
}
