/**
 * seed-data.ts
 *
 * Transforms the legacy .generated/programs.json into arrays that match the
 * new Drizzle schema's insert types. This module has zero side effects — it
 * only reads and transforms data. It is consumed by both:
 *   - scripts/seed.ts  (writes to local D1 via better-sqlite3)
 *   - test beforeAll hooks (writes to in-memory D1 via vitest-pool-workers,
 *     if integration tests are added later)
 */

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { InferInsertModel } from "drizzle-orm";
import type { gates, programs } from "../src/db/schema";

// ---------------------------------------------------------------------------
// Derived insert types from the Drizzle schema (single source of truth)
// ---------------------------------------------------------------------------

type NewProgram = InferInsertModel<typeof programs>;
type NewGate = InferInsertModel<typeof gates>;

// ---------------------------------------------------------------------------
// Legacy shape (old .generated/programs.json)
// ---------------------------------------------------------------------------

interface LegacyRiddle {
  id: string; // becomes `label` — e.g. "Log-001", "Question #1"
  riddle: string; // becomes `question`
  pw: string; // becomes `correctAnswer` (base64-encoded in source)
  description: string; // becomes `successMessage`
  unlocked: boolean; // becomes `isSolved`
}

interface LegacyProgram {
  name: string;
  active: boolean; // becomes `isSelected`
  riddles: LegacyRiddle[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, "base64").toString("utf-8");
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

const raw: LegacyProgram[] = JSON.parse(
  readFileSync(join(process.cwd(), ".generated/programs.json"), "utf-8"),
);

const programRows: NewProgram[] = [];
const gateRows: NewGate[] = [];

for (const legacy of raw) {
  const programId = randomUUID();

  programRows.push({
    id: programId,
    name: legacy.name,
    isSelected: legacy.active,
    selectedAt: null,
    completedAt: null,
  });

  for (const riddle of legacy.riddles) {
    gateRows.push({
      id: randomUUID(),
      label: riddle.id,
      question: riddle.riddle,
      correctAnswer: decodeBase64(riddle.pw),
      successMessage: riddle.description,
      isSolved: riddle.unlocked,
      solvedAt: null,
      attemptCount: 0,
      acceptanceThreshold: 0.875,
      guidanceEnabled: false,
      guidancePrompt: null,
      guidanceThreshold: 2,
      programId,
    });
  }
}

export type { NewGate, NewProgram };
export { gateRows, programRows };
