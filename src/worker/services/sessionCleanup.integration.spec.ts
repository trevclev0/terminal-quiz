import { createScheduledController } from "cloudflare:test";
import { env } from "cloudflare:workers";
import * as schema from "@shared/schema";
import {
  clueRateLimits,
  gateClues,
  sessionCompletedGates,
  sessionProgress,
} from "@shared/schema";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import worker from "..";
import {
  DEFAULT_SESSION_RETENTION_DAYS,
  pruneStaleSessions,
} from "./sessionCleanup";

const db = drizzle(env.DB, { schema });

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";
const E2E_GATE_2_ID = "e2e00002-0000-0000-0000-000000000002";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 5, 1, 4, 17);
const CUTOFF = new Date(NOW - DEFAULT_SESSION_RETENTION_DAYS * DAY_MS);

let sessionCounter = 0;

/** A session last active `ageDays` before NOW, with one row in each child table. */
async function insertSession(ageDays: number): Promise<string> {
  const [row] = await db
    .insert(sessionProgress)
    .values({
      sessionId: `cleanup-${++sessionCounter}`,
      programId: E2E_PROGRAM_ID,
      currentGateId: E2E_GATE_2_ID,
      updatedAt: new Date(NOW - ageDays * DAY_MS),
    })
    .returning({ id: sessionProgress.id });
  const sessionProgressId = row.id;

  await db.batch([
    db
      .insert(sessionCompletedGates)
      .values({ sessionProgressId, gateId: E2E_GATE_1_ID }),
    db.insert(gateClues).values({
      sessionProgressId,
      gateId: E2E_GATE_2_ID,
      clueText: "a clue",
      attemptCountAtRequest: 2,
    }),
    db.insert(clueRateLimits).values({
      sessionProgressId,
      gateId: E2E_GATE_2_ID,
      attemptCountAtRequest: 2,
    }),
  ]);
  return sessionProgressId;
}

async function childRowCounts(sessionProgressId: string) {
  const [completed, clues, limits] = await db.batch([
    db
      .select({ n: count() })
      .from(sessionCompletedGates)
      .where(eq(sessionCompletedGates.sessionProgressId, sessionProgressId)),
    db
      .select({ n: count() })
      .from(gateClues)
      .where(eq(gateClues.sessionProgressId, sessionProgressId)),
    db
      .select({ n: count() })
      .from(clueRateLimits)
      .where(eq(clueRateLimits.sessionProgressId, sessionProgressId)),
  ]);
  return [completed[0].n, clues[0].n, limits[0].n];
}

async function remainingSessionIds(): Promise<string[]> {
  const rows = await db
    .select({ id: sessionProgress.id })
    .from(sessionProgress);
  return rows.map((r) => r.id);
}

describe("stale session cleanup", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    // Children cascade with their session.
    await db.delete(sessionProgress);
  });

  it("deletes only sessions idle past the cutoff, cascading their child rows", async () => {
    const stale = await insertSession(DEFAULT_SESSION_RETENTION_DAYS + 1);
    const fresh = await insertSession(DEFAULT_SESSION_RETENTION_DAYS - 1);

    const result = await pruneStaleSessions(db, CUTOFF);

    expect(result).toEqual({ deleted: 1, batches: 1, hitBatchCap: false });
    expect(await remainingSessionIds()).toEqual([fresh]);
    expect(await childRowCounts(stale)).toEqual([0, 0, 0]);
    expect(await childRowCounts(fresh)).toEqual([1, 1, 1]);
  });

  it("drains a backlog in bounded batches", async () => {
    for (let i = 0; i < 5; i++) await insertSession(60 + i);

    const result = await pruneStaleSessions(db, CUTOFF, 2, 10);

    // 2 + 2 + 1: the short third batch shows nothing stale is left.
    expect(result).toEqual({ deleted: 5, batches: 3, hitBatchCap: false });
    expect(await remainingSessionIds()).toEqual([]);
  });

  it("stops at the batch cap and leaves the rest for the next run", async () => {
    for (let i = 0; i < 5; i++) await insertSession(60 + i);

    const result = await pruneStaleSessions(db, CUTOFF, 2, 2);

    expect(result).toEqual({ deleted: 4, batches: 2, hitBatchCap: true });
    expect(await remainingSessionIds()).toHaveLength(1);
  });

  it("runs from the worker's scheduled handler and logs the rows deleted", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await insertSession(DEFAULT_SESSION_RETENTION_DAYS + 5);
    const fresh = await insertSession(1);

    await worker.scheduled(
      createScheduledController({ scheduledTime: NOW, cron: "17 * * * *" }),
      env,
    );

    expect(await remainingSessionIds()).toEqual([fresh]);
    const logged = logSpy.mock.calls
      .map(([line]) => (typeof line === "string" ? line : ""))
      .filter((line) => line.includes('"event":"session_cleanup"'))
      .map((line) => JSON.parse(line));
    expect(logged).toEqual([
      expect.objectContaining({
        level: "info",
        event: "session_cleanup",
        retentionDays: DEFAULT_SESSION_RETENTION_DAYS,
        cutoff: CUTOFF.toISOString(),
        deleted: 1,
        batches: 1,
        hitBatchCap: false,
      }),
    ]);
  });
});
