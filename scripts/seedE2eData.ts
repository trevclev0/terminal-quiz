import { lt, sql } from "drizzle-orm";
import { user } from "../src/shared/authSchema";
import { gates, programs, sessionProgress } from "../src/shared/schema";
import { TEST_USER_ID } from "../src/worker/test-utils/testConstants";
import { deleteWhereSql, insertSql, upsertConflict } from "./seedGenerator";

// E2E fixture data — safe for concurrent runs (upserts, no destructive
// deletes). Consumed by:
//   - `bun run seed:e2e:local` / `seed:e2e:preview` (via scripts/seed-e2e.ts)
//   - `vitest.config.integration.ts` (imported directly, no file round-trip)
// The preview-only session prune below is the one delete, and it only
// touches sessions idle for a day, never a concurrent run's.
//
// The test user id (auth bypass fixture) must stay in sync with
// TEST_USER_ID in src/worker/test-utils/testConstants.ts.

export const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";

const E2E_GATE_IDS = [
  "e2e00001-0000-0000-0000-000000000001",
  "e2e00002-0000-0000-0000-000000000002",
  "e2e00003-0000-0000-0000-000000000003",
] as const;

// ON CONFLICT DO UPDATE (not DO NOTHING) so seed changes apply without an
// FK cascade wiping session progress on re-run. Update set is derived from
// the populated columns via upsertConflict, so edits here (including
// guidance config) propagate on reseed.
const e2eGateRows: (typeof gates)["$inferInsert"][] = [
  {
    id: E2E_GATE_IDS[0],
    programId: E2E_PROGRAM_ID,
    sequenceOrder: 1,
    label: "Gate 1",
    question: "What color is the sky?",
    correctAnswer: "blue",
    successMessage: "Correct! The sky is blue during a clear day.",
    guidanceEnabled: true,
    guidanceThreshold: 2,
  },
  {
    id: E2E_GATE_IDS[1],
    programId: E2E_PROGRAM_ID,
    sequenceOrder: 2,
    label: "Gate 2",
    question: "What is 2 + 2?",
    correctAnswer: "4",
    successMessage: "Correct! Basic arithmetic still holds.",
    guidanceEnabled: false,
    guidanceThreshold: 3,
  },
  {
    id: E2E_GATE_IDS[2],
    programId: E2E_PROGRAM_ID,
    sequenceOrder: 3,
    label: "Gate 3",
    question: "What is the opposite of hot?",
    correctAnswer: "cold",
    successMessage: "Correct! Hot and cold are thermal opposites.",
    guidanceEnabled: false,
    guidanceThreshold: 3,
  },
];

/** Compiles the full E2E seed as one SQL script (statements joined by `\n`). */
export function generateE2eSeedSql(): string {
  const statements = [
    // Test user for auth bypass (x-auth-test-user-id=e2e-test-user)
    insertSql(
      user,
      [
        {
          id: TEST_USER_ID,
          name: TEST_USER_ID,
          email: `${TEST_USER_ID}@test.example.com`,
          emailVerified: true,
        },
      ],
      sql.raw("ON CONFLICT DO NOTHING"),
    ),

    insertSql(
      programs,
      [{ id: E2E_PROGRAM_ID, name: "E2E Test Program" }],
      sql.raw("ON CONFLICT DO NOTHING"),
    ),

    insertSql(gates, e2eGateRows, upsertConflict(gates, e2eGateRows)),
  ];

  return statements.join("\n");
}

const PREVIEW_SESSION_MAX_IDLE_MS = 24 * 60 * 60 * 1000;
// Bounded like the production cron's batches: each session cascades its
// completed-gate, clue and rate-limit rows, so an unbounded first run over
// the backlog could spend a large share of the daily rows-written budget.
const PREVIEW_SESSION_PRUNE_LIMIT = 2000;

/**
 * Deletes preview sessions idle for over a day. Preview has no cleanup cron
 * (see wrangler.jsonc), and every E2E run adds sessions; left alone they
 * made each program delete's FK scans cost more every day (#345). The
 * cutoff is fixed at generation time, which `seed:e2e:preview` runs
 * immediately before executing the file.
 */
export function generatePreviewSessionPruneSql(now: Date): string {
  const cutoff = new Date(now.getTime() - PREVIEW_SESSION_MAX_IDLE_MS);
  // Stock SQLite has no DELETE ... LIMIT, so a limited subquery picks the
  // batch (same shape as pruneStaleSessions).
  const batch = sql.join(
    [
      sql`select ${sessionProgress.id} from ${sessionProgress}`,
      sql`where ${lt(sessionProgress.updatedAt, cutoff)}`,
      sql`limit ${sql.raw(String(PREVIEW_SESSION_PRUNE_LIMIT))}`,
    ],
    sql` `,
  );
  return deleteWhereSql(
    sessionProgress,
    sql`${sessionProgress.id} in (${batch})`,
  );
}
