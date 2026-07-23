import { describe, expect, it } from "vitest";
import { PROGRAM_KEYS } from "./queryKeys";

describe("PROGRAM_KEYS", () => {
  it("all returns ['programs']", () => {
    expect(PROGRAM_KEYS.all).toEqual(["programs"]);
  });

  it("inProgress returns ['programs', 'inProgress']", () => {
    expect(PROGRAM_KEYS.inProgress()).toEqual(["programs", "inProgress"]);
  });

  it("progression returns ['programs', 'progression', programId]", () => {
    expect(PROGRAM_KEYS.progression("prog-1")).toEqual([
      "programs",
      "progression",
      "prog-1",
    ]);
  });

  it("different programIds produce different keys", () => {
    const key1 = PROGRAM_KEYS.progression("prog-1");
    const key2 = PROGRAM_KEYS.progression("prog-2");
    expect(key1).not.toEqual(key2);
  });
});
