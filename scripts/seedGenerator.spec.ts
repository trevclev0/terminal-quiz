import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { gates, programs } from "../src/shared/schema";
import { deleteWhereSql, insertSql, upsertConflict } from "./seedGenerator";

describe("insertSql", () => {
  it("returns an empty string for an empty row list", () => {
    expect(insertSql(programs, [])).toBe("");
  });

  it("inlines string values and omits columns with defaults", () => {
    const out = insertSql(programs, [{ id: "p1", name: "Test Program" }]);

    expect(out).toBe(
      `insert into "programs" ("id", "name", "author_id", ` +
        `"visibility", "created_at") values ('p1', 'Test Program', ` +
        `null, 'public', (CAST((julianday('now') - 2440587.5) * ` +
        `86400000 AS INTEGER)));`,
    );
  });

  it("escapes single quotes in string values", () => {
    const out = insertSql(programs, [{ id: "p1", name: "Ada's Quest" }]);

    expect(out).toContain("'Ada''s Quest'");
  });

  it("encodes booleans as 0/1 via the column encoder", () => {
    const out = insertSql(gates, [
      {
        id: "g1",
        programId: "p1",
        label: "Gate 1",
        question: "Q?",
        correctAnswer: "A",
        successMessage: "Nice.",
        guidanceEnabled: true,
      },
    ]);

    expect(out).toContain('"guidance_enabled"');
    expect(out).toMatch(/,\s*1\s*,/);
  });

  it("inlines real (float) values as numeric literals, not strings", () => {
    const out = insertSql(gates, [
      {
        id: "g1",
        programId: "p1",
        label: "Gate 1",
        question: "Q?",
        correctAnswer: "A",
        successMessage: "Nice.",
        acceptanceThreshold: 0.9,
      },
    ]);

    expect(out).toContain("0.9");
    expect(out).not.toContain("'0.9'");
  });

  it("inlines null for omitted nullable columns with no default", () => {
    const out = insertSql(programs, [{ id: "p1", name: "Test" }]);
    expect(out).toContain('"author_id"');
    expect(out).toMatch(/,\s*null\s*,/);
  });

  it("compiles multiple rows into a single VALUES list", () => {
    const out = insertSql(programs, [
      { id: "p1", name: "First" },
      { id: "p2", name: "Second" },
    ]);

    expect(out).toContain("'p1'");
    expect(out).toContain("'p2'");
    expect(out.match(/insert into/g)).toHaveLength(1);
  });

  it("appends a raw ON CONFLICT fragment when provided", () => {
    const out = insertSql(
      programs,
      [{ id: "p1", name: "Test" }],
      sql.raw("ON CONFLICT DO NOTHING"),
    );

    expect(out.trim().endsWith("ON CONFLICT DO NOTHING;")).toBe(true);
  });
});

describe("upsertConflict", () => {
  it("derives update set from the union of populated columns", () => {
    const rows = [
      {
        id: "g1",
        programId: "p1",
        label: "Gate 1",
        question: "Q1?",
        correctAnswer: "A1",
        successMessage: "Nice.",
        guidanceEnabled: true,
      },
      {
        id: "g2",
        programId: "p1",
        label: "Gate 2",
        question: "Q2?",
        correctAnswer: "A2",
        successMessage: "Nice.",
      },
    ];

    const out = insertSql(gates, rows, upsertConflict(gates, rows));

    expect(out).toContain(
      "ON CONFLICT(id) DO UPDATE SET label = excluded.label, " +
        "question = excluded.question, " +
        "correct_answer = excluded.correct_answer, " +
        "success_message = excluded.success_message, " +
        "guidance_enabled = excluded.guidance_enabled, " +
        "program_id = excluded.program_id",
    );
  });

  it("uses DB column names (snake_case), not field names", () => {
    const rows = [
      {
        id: "g1",
        programId: "p1",
        label: "Gate 1",
        question: "Q?",
        correctAnswer: "A",
        successMessage: "Nice.",
        guidanceEnabled: false,
      },
    ];

    const out = insertSql(gates, rows, upsertConflict(gates, rows));

    expect(out).toContain("guidance_enabled = excluded.guidance_enabled");
    expect(out).not.toContain("guidanceEnabled");
  });

  it("emits each update column only once across rows", () => {
    const rows = [
      {
        id: "g1",
        programId: "p1",
        label: "A",
        question: "Q1",
        correctAnswer: "A1",
        successMessage: "Ok.",
      },
      {
        id: "g2",
        programId: "p1",
        label: "B",
        question: "Q2",
        correctAnswer: "A2",
        successMessage: "Ok.",
      },
    ];

    const out = insertSql(gates, rows, upsertConflict(gates, rows));

    expect(out.match(/excluded\./g)).toHaveLength(5);
  });

  it("excludes unpopulated columns so reseeding never overwrites them", () => {
    const rows = [{ id: "p1", name: "Test" }];

    const out = insertSql(programs, rows, upsertConflict(programs, rows));

    const conflictClause = out.slice(out.indexOf("ON CONFLICT"));
    expect(conflictClause).toBe(
      "ON CONFLICT(id) DO UPDATE SET name = excluded.name;",
    );
  });

  it("falls back to DO NOTHING when only id is populated", () => {
    // id-only row violates programs.$inferInsert (name is required) but
    // exercises the empty-update-set fallback path.
    const rows = [
      { id: "p1" },
    ] as unknown as (typeof programs)["$inferInsert"][];

    const out = insertSql(programs, rows, upsertConflict(programs, rows));

    expect(out.trim().endsWith("ON CONFLICT(id) DO NOTHING;")).toBe(true);
  });
});

describe("deleteWhereSql", () => {
  it("inlines a scoped WHERE clause", () => {
    const out = deleteWhereSql(
      programs,
      sql`${programs.authorId} is null and ${programs.id} not in ('p1', 'p2')`,
    );

    expect(out).toBe(
      `delete from "programs" where "programs"."author_id" is null ` +
        `and "programs"."id" not in ('p1', 'p2');`,
    );
  });
});
