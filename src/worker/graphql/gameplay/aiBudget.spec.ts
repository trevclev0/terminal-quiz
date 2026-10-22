import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_AI_DAILY_CLUE_BUDGET,
  getDailyAiBudget,
  getUsageDateKey,
} from "./aiBudget";

describe("aiBudget", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getUsageDateKey", () => {
    it("keys by the UTC calendar day of the supplied date", () => {
      expect(getUsageDateKey(new Date("2026-03-04T23:59:59.999Z"))).toBe(
        "2026-03-04",
      );
    });

    it("defaults to the current UTC day", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-12-31T00:00:01.000Z"));

      expect(getUsageDateKey()).toBe("2026-12-31");
    });
  });

  describe("getDailyAiBudget", () => {
    it("uses the configured positive integer", () => {
      expect(getDailyAiBudget("10")).toBe(10);
    });

    it("falls back to the default when unset", () => {
      expect(getDailyAiBudget(undefined)).toBe(DEFAULT_AI_DAILY_CLUE_BUDGET);
    });

    it.each([
      ["zero", "0"],
      ["negative", "-5"],
      ["non-numeric", "abc"],
      ["empty", ""],
    ])("falls back to the default for a %s value", (_label, raw) => {
      expect(getDailyAiBudget(raw)).toBe(DEFAULT_AI_DAILY_CLUE_BUDGET);
    });
  });
});
