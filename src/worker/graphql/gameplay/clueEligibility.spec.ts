import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import { describe, expect, it, vi } from "vitest";
import {
  computeCanRequestClue,
  getExistingCluesForGate,
} from "./clueEligibility";

const defaultParams = {
  isCorrectGuess: false,
  guidanceEnabled: true,
  attemptCount: 2,
  guidanceThreshold: 2,
  existingClueCount: 0,
  mostRecentClueAttemptCount: null,
};

describe("computeCanRequestClue", () => {
  it("returns false when guess is correct", () => {
    const result = computeCanRequestClue({
      ...defaultParams,
      isCorrectGuess: true,
    });
    expect(result).toBe(false);
  });

  it("returns false when guidance is disabled", () => {
    const result = computeCanRequestClue({
      ...defaultParams,
      guidanceEnabled: false,
    });
    expect(result).toBe(false);
  });

  it("returns false when attempt count is below threshold", () => {
    const result = computeCanRequestClue({ ...defaultParams, attemptCount: 1 });
    expect(result).toBe(false);
  });

  it("returns false when clue limit reached", () => {
    const result = computeCanRequestClue({
      ...defaultParams,
      existingClueCount: 3,
    });
    expect(result).toBe(false);
  });

  it("returns false when no new attempt since last clue", () => {
    const result = computeCanRequestClue({
      ...defaultParams,
      attemptCount: 3,
      mostRecentClueAttemptCount: 3,
    });
    expect(result).toBe(false);
  });

  it("ignores the last-clue check when no clue exists yet", () => {
    // null must not be coerced to 0 and compared against attemptCount.
    const result = computeCanRequestClue({
      ...defaultParams,
      attemptCount: 0,
      guidanceThreshold: 0,
      mostRecentClueAttemptCount: null,
    });
    expect(result).toBe(true);
  });

  it("returns true when eligible", () => {
    const result = computeCanRequestClue({
      ...defaultParams,
      attemptCount: 4,
      mostRecentClueAttemptCount: 3,
    });
    expect(result).toBe(true);
  });
});

describe("getExistingCluesForGate", () => {
  it("queries the session's clues for the gate, newest first", async () => {
    const clues = [{ id: "clue-1" }];
    const findMany = vi.fn().mockResolvedValue(clues);
    const db = { query: { gateClues: { findMany } } };

    const result = await getExistingCluesForGate(
      db as unknown as Parameters<typeof getExistingCluesForGate>[0],
      "progress-1",
      "gate-1",
    );

    expect(result).toBe(clues);
    const [args] = findMany.mock.calls[0];
    const dialect = new SQLiteSyncDialect();
    expect(dialect.sqlToQuery(args.where)).toMatchObject({
      sql: '("gate_clues"."session_progress_id" = ? and "gate_clues"."gate_id" = ?)',
      params: ["progress-1", "gate-1"],
    });
    expect(args.orderBy).toHaveLength(1);
    expect(dialect.sqlToQuery(args.orderBy[0]).sql).toBe(
      '"gate_clues"."created_at" desc',
    );
  });
});
