import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  unique,
  sql,
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

export const gameState = sqliteTable("game_state", {
  id: integer("id").primaryKey().default(1),
  lastUpdated: integer("last_updated", { mode: "timestamp" })
    .notNull()
    .default(sql`(CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER))`)
    .$onUpdateFn(() => new Date()),
});

export const sessionProgress = sqliteTable(
  "session_progress",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id").notNull(),
    programId: text("program_id")
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    currentGateId: text("current_gate_id").references(() => gates.id, {
      onDelete: "set null",
    }),
    completedGateIds: text("completed_gate_ids").default("[]"),
    status: text("status").notNull().default("in_progress"),
    startedAt: integer("started_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    // Counter for incorrect guesses for the current gate
    attemptCount: integer("attempt_count").notNull().default(0),
  },
  (t) => [unique("unique_session_progress").on(t.sessionId, t.programId)],
);

export const gateClues = sqliteTable(
  "gate_clues",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionProgressId: text("session_progress_id")
      .notNull()
      .references(() => sessionProgress.id, { onDelete: "cascade" }),
    gateId: text("gate_id")
      .notNull()
      .references(() => gates.id, { onDelete: "cascade" }),
    clueText: text("clue_text").notNull(),
    attemptCountAtRequest: integer("attempt_count_at_request").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(strftime('%s', 'now'))`)
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("gate_clues_session_progress_id_idx").on(t.sessionProgressId),
    index("gate_clues_gate_id_idx").on(t.gateId),
  ],
);

export const programsRelations = relations(programs, ({ many }) => ({
  gates: many(gates),
}));

export const gatesRelations = relations(gates, ({ one, many }) => ({
  program: one(programs, {
    fields: [gates.programId],
    references: [programs.id],
  }),
  gateClues: many(gateClues),
}));

export const sessionProgressRelations = relations(
  sessionProgress,
  ({ one, many }) => ({
    program: one(programs, {
      fields: [sessionProgress.programId],
      references: [programs.id],
    }),
    currentGate: one(gates, {
      fields: [sessionProgress.currentGateId],
      references: [gates.id],
    }),
    gateClues: many(gateClues),
  }),
);

export const gateCluesRelations = relations(gateClues, ({ one }) => ({
  sessionProgress: one(sessionProgress, {
    fields: [gateClues.sessionProgressId],
    references: [sessionProgress.id],
  }),
  gate: one(gates, {
    fields: [gateClues.gateId],
    references: [gates.id],
  }),
}));
