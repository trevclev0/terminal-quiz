import type { Param, SQL } from "drizzle-orm";
import { getTableColumns, sql } from "drizzle-orm";
import { CasingCache } from "drizzle-orm/casing";
import { SQLiteSyncDialect, type SQLiteTable } from "drizzle-orm/sqlite-core";

// Pure, side-effect-free SQL generation. Compiles typed rows (checked
// against src/shared/schema.ts / src/shared/authSchema.ts) into inlined
// SQL text that `wrangler d1 execute --file=` can run directly.
//
// Value encoding (booleans -> 0/1, Date -> epoch ms, string escaping) is
// handled by Drizzle's own column encoders + inline-param renderer
// (`SQL#toQuery({ inlineParams: true })`), not hand-rolled here.
//
// STABILITY CAVEAT: this relies on a few Drizzle APIs outside its public
// stability contract — `SQLiteSyncDialect` (buildInsertQuery,
// escapeName/escapeString/escapeParam), `CasingCache` (drizzle-orm/casing),
// and `SQL#toQuery`. `getTableColumns()` IS a public export. Risk is
// bounded: this is build-time-only code, so a Drizzle major bump that
// breaks these fails immediately at generation time (caught by
// seedGenerator.spec.ts + the integration suite), never as a silent
// runtime bug. After upgrading drizzle-orm, re-verify the generated SQL
// in scripts/generated/*.sql.

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

/**
 * Builds an idempotent `ON CONFLICT(id) DO UPDATE SET ...` fragment for an
 * upsert. The update set is derived from the union of columns actually
 * populated across the given rows (in first-occurrence order — deterministic
 * for fixed seed arrays), so reseeding only manages values the seed supplies
 * and never overwrites externally managed columns. Columns a row omits fall
 * back to the table's DEFAULT on insert and are left untouched on conflict.
 *
 * @returns a `SQL` fragment safe to pass as `insertSql`'s `onConflict`.
 *   If no row populates a non-id column, falls back to `DO NOTHING`.
 */
export function upsertConflict<T extends SQLiteTable>(
  table: T,
  rows: T["$inferInsert"][],
): SQL {
  const columns = getTableColumns(table);
  const idColumn = columns.id;
  if (!idColumn) {
    throw new Error("upsertConflict requires a table with an `id` column");
  }

  const updateFields: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const [field, column] of Object.entries(columns)) {
      if (field === "id" || seen.has(field)) {
        continue;
      }
      if ((row as Record<string, unknown>)[field] === undefined) {
        continue;
      }
      seen.add(field);
      updateFields.push(`${column.name} = excluded.${column.name}`);
    }
  }

  if (updateFields.length === 0) {
    return sql.raw(`ON CONFLICT(${idColumn.name}) DO NOTHING`);
  }
  return sql.raw(
    `ON CONFLICT(${idColumn.name}) DO UPDATE SET ${updateFields.join(", ")}`,
  );
}
