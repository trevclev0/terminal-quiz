import { relations, sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

export const gates = sqliteTable(
  "gates",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sequenceOrder: integer("sequence_order").notNull().default(1),
    label: text("label").notNull(),
    question: text("question").notNull(),
    correctAnswer: text("correct_answer").notNull(),
    successMessage: text("success_message").notNull(),
    isSolved: integer("is_solved", { mode: "boolean" })
      .notNull()
      .default(false),
    solvedAt: integer("solved_at", { mode: "timestamp" }),
    attemptCount: integer("attempt_count").notNull().default(0),
    acceptanceThreshold: real("acceptance_threshold").notNull().default(0.875),
    guidanceEnabled: integer("guidance_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    guidancePrompt: text("guidance_prompt"),
    guidanceThreshold: integer("guidance_threshold").notNull().default(2),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(
        sql`(CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))`,
      ),
  },
  (t) => [unique("unique_program_sequence").on(t.programId, t.sequenceOrder)],
);

export const programs = sqliteTable("programs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  isSelected: integer("is_selected", { mode: "boolean" })
    .notNull()
    .default(false),
  selectedAt: integer("selected_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))`),
});

export const programsRelations = relations(programs, ({ many }) => ({
  gates: many(gates),
}));

export const gatesRelations = relations(gates, ({ one }) => ({
  program: one(programs, {
    fields: [gates.programId],
    references: [programs.id],
  }),
}));

export const gameState = sqliteTable("game_state", {
  id: integer("id").primaryKey().default(1),
  lastUpdated: integer("last_updated", { mode: "timestamp" })
    .notNull()
    .default(sql`(CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))`)
    .$onUpdateFn(() => new Date()),
});
