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

  it("single returns ['programs', 'detail', programId]", () => {
    expect(PROGRAM_KEYS.single("prog-1")).toEqual([
      "programs",
      "detail",
      "prog-1",
    ]);
  });

  it("single never collides with the fixed marker shapes", () => {
    expect(PROGRAM_KEYS.single("inProgress")).not.toEqual(
      PROGRAM_KEYS.inProgress(),
    );
    const progressionKey = PROGRAM_KEYS.progression("prog-1");
    expect(PROGRAM_KEYS.single("progression")).not.toEqual(progressionKey);
    // Prefix matching (used by query invalidation) must not conflate the
    // shapes either — single("progression") would be a prefix of the
    // progression key if the id segment shared its position.
    expect(PROGRAM_KEYS.single("progression")).not.toEqual(
      progressionKey.slice(0, -1),
    );
  });

  it("different programIds produce different keys", () => {
    const key1 = PROGRAM_KEYS.progression("prog-1");
    const key2 = PROGRAM_KEYS.progression("prog-2");
    expect(key1).not.toEqual(key2);
  });
});
