import { describe, expect, it } from "vitest";
import { generatePreviewSessionPruneSql } from "./seedE2eData";

describe("generatePreviewSessionPruneSql", () => {
  it("deletes a bounded batch of sessions idle for over a day", () => {
    const now = new Date("2026-10-22T00:00:00Z");

    // updated_at is stored in epoch seconds; 1792540800 is now minus 24h.
    expect(generatePreviewSessionPruneSql(now)).toBe(
      `delete from "session_progress" where "session_progress"."id" in ` +
        `(select "session_progress"."id" from "session_progress" where ` +
        `"session_progress"."updated_at" < 1792540800 limit 2000);`,
    );
  });
});
