import type { D1Database } from "@cloudflare/workers-types";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SESSION_RETENTION_DAYS,
  getSessionRetentionDays,
  runSessionCleanup,
} from "./sessionCleanup";

describe("getSessionRetentionDays", () => {
  it.each([
    [undefined, DEFAULT_SESSION_RETENTION_DAYS],
    ["", DEFAULT_SESSION_RETENTION_DAYS],
    ["abc", DEFAULT_SESSION_RETENTION_DAYS],
    ["0", DEFAULT_SESSION_RETENTION_DAYS],
    ["-5", DEFAULT_SESSION_RETENTION_DAYS],
    ["7", 7],
    ["90", 90],
  ])("%j → %d", (raw, expected) => {
    expect(getSessionRetentionDays(raw)).toBe(expected);
  });
});

describe("runSessionCleanup", () => {
  it("logs a structured error line and rethrows when D1 fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const failingDb = {
      prepare: () => {
        throw new Error("D1 unavailable");
      },
    } as unknown as D1Database;
    const scheduledTime = Date.UTC(2026, 5, 1, 4, 17);

    await expect(
      runSessionCleanup(
        { DB: failingDb, SESSION_RETENTION_DAYS: "7" },
        scheduledTime,
      ),
    ).rejects.toThrow("D1 unavailable");

    expect(errorSpy).toHaveBeenCalledOnce();
    expect(JSON.parse(errorSpy.mock.calls[0][0] as string)).toMatchObject({
      level: "error",
      event: "session_cleanup",
      retentionDays: 7,
      cutoff: new Date(scheduledTime - 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: "D1 unavailable",
    });
  });
});
