import { describe, expect, it } from "vitest";
import {
  CLUE_RATE_LIMIT_MAX_REQUESTS,
  CLUE_RATE_LIMIT_WINDOW_MS,
  computeRetryAfterMs,
} from "./clueRateLimit";

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
});
