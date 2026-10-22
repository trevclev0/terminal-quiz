import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CLUE_RATE_LIMIT_MAX_REQUESTS,
  CLUE_RATE_LIMIT_WINDOW_MS,
  claimClueRateLimit,
  computeRetryAfterMs,
} from "./clueRateLimit";
import type { AppGraphQLContext } from "./types";

const NOW_MS = 1_800_000_000_000;

// The claim itself is SQL (covered by clueRateLimit.integration.spec.ts); the
// mock only supplies the rows each statement would return, so these specs pin
// what the function reports for each outcome.
function createClaimDb(options: {
  claimedRows: unknown[];
  // One entry per rejection-path lookup, in call order: the attempt's own
  // reservation first, then the oldest in-window row.
  lookups?: { requestedAt: Date }[][];
}) {
  const lookups = [...(options.lookups ?? [])];
  const db = {
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(options.claimedRows),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
    batch: vi.fn(async (statements: Promise<unknown>[]) =>
      Promise.all(statements),
    ),
    select: vi.fn().mockImplementation(() => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve(lookups.shift() ?? []),
          }),
        }),
      }),
    })),
  };
  return db as unknown as AppGraphQLContext["var"]["db"];
}

describe("clueRateLimit", () => {
  describe("constants", () => {
    it("exposes the configured rolling window and cap", () => {
      expect(CLUE_RATE_LIMIT_WINDOW_MS).toBe(60_000);
      expect(CLUE_RATE_LIMIT_MAX_REQUESTS).toBe(3);
    });
  });

  describe("computeRetryAfterMs", () => {
    it("returns time until the oldest in-window request expires", () => {
      const oldest = new Date(1_000_000_000_000);
      const nowMs = 1_000_000_005_000; // 5s after the oldest request
      expect(computeRetryAfterMs(oldest, nowMs, 60_000)).toBe(55_000);
    });

    it("clamps to zero when the window has already elapsed", () => {
      const oldest = new Date(1_000_000_000_000);
      const nowMs = 1_000_000_070_000; // 70s later, past the 60s window
      expect(computeRetryAfterMs(oldest, nowMs, 60_000)).toBe(0);
    });

    it("uses the exported default window when not supplied", () => {
      const oldest = new Date(1_000_000_000_000);
      const nowMs = oldest.getTime() + CLUE_RATE_LIMIT_WINDOW_MS;
      expect(computeRetryAfterMs(oldest, nowMs)).toBe(0);
    });
  });

  describe("claimClueRateLimit", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    function freezeTime() {
      vi.useFakeTimers();
      vi.setSystemTime(NOW_MS);
    }

    it("reports a claimed slot with no retry delay", async () => {
      const db = createClaimDb({ claimedRows: [{ id: "slot" }] });

      expect(await claimClueRateLimit(db, "progress-1", "gate-1", 3)).toEqual({
        claimed: true,
        retryAfterMs: null,
      });
    });

    it("rejects with the attempt's own reservation expiry", async () => {
      freezeTime();
      const db = createClaimDb({
        claimedRows: [],
        lookups: [
          [{ requestedAt: new Date(NOW_MS - 20_000) }],
          [{ requestedAt: new Date(NOW_MS - 50_000) }],
        ],
      });

      expect(await claimClueRateLimit(db, "progress-1", "gate-1", 3)).toEqual({
        claimed: false,
        retryAfterMs: 40_000,
      });
    });

    it("rejects with the oldest in-window row when the attempt has none", async () => {
      freezeTime();
      const db = createClaimDb({
        claimedRows: [],
        lookups: [[], [{ requestedAt: new Date(NOW_MS - 50_000) }]],
      });

      expect(await claimClueRateLimit(db, "progress-1", "gate-1", 3)).toEqual({
        claimed: false,
        retryAfterMs: 10_000,
      });
    });

    it("falls back to the full window when a prune raced the claim", async () => {
      freezeTime();
      const db = createClaimDb({ claimedRows: [], lookups: [[], []] });

      expect(await claimClueRateLimit(db, "progress-1", "gate-1", 3)).toEqual({
        claimed: false,
        retryAfterMs: CLUE_RATE_LIMIT_WINDOW_MS,
      });
    });
  });
});
