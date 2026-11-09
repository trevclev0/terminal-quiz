import { describe, expect, it } from "vitest";
import {
  buildHintCells,
  type HintCell,
  maxHintStep,
  unlockedHintStep,
} from "./mechanicalHint";

// "_" for a hidden cell, so expectations read like the hint itself.
const show = (cells: HintCell[]) => cells.map((cell) => cell ?? "_").join("");

describe("buildHintCells", () => {
  it("masks every letter at step 1", () => {
    expect(show(buildHintCells("mirror", 1))).toBe("______");
  });

  it("reveals the first letter at step 2, uppercased", () => {
    expect(show(buildHintCells("mirror", 2))).toBe("M_____");
  });

  it("reveals vowels as well at step 3", () => {
    expect(show(buildHintCells("mirror", 3))).toBe("MI__O_");
  });

  it("masks digits like letters", () => {
    expect(show(buildHintCells("r2d2", 1))).toBe("____");
  });

  it("keeps punctuation visible from step 1", () => {
    expect(show(buildHintCells("o'clock", 1))).toBe("_'_____");
  });

  it("keeps a word gap as one space cell, collapsing runs and trimming", () => {
    expect(buildHintCells("  red   moon ", 1)).toEqual([
      null,
      null,
      null,
      " ",
      null,
      null,
      null,
      null,
    ]);
  });

  it("reveals the first letter of every word at step 2", () => {
    expect(show(buildHintCells("red moon", 2))).toBe("R__ M___");
  });

  it("skips leading punctuation when finding a word's first letter", () => {
    expect(show(buildHintCells("'twas", 2))).toBe("'T___");
  });

  it("treats accented vowels as vowels", () => {
    expect(show(buildHintCells("café", 3))).toBe("CA_É");
  });

  it("treats a decomposed accent as part of its letter", () => {
    expect(buildHintCells("cafe\u0301", 1)).toEqual([null, null, null, null]);
  });

  it("keeps a non-Latin letter as one masked cell", () => {
    expect(show(buildHintCells("日本", 1))).toBe("__");
  });

  it("does not treat y as a vowel", () => {
    expect(show(buildHintCells("myth", 3))).toBe("M___");
  });
});

describe("maxHintStep", () => {
  it("offers all three steps when each reveals more and hides some", () => {
    expect(maxHintStep("mirror")).toBe(3);
  });

  it("stops before a step that would reveal every letter", () => {
    // Step 3 would show "EAU" in full.
    expect(maxHintStep("eau")).toBe(2);
  });

  it("stops before a step that reveals nothing new", () => {
    // No vowels past the first letter, so step 3 equals step 2.
    expect(maxHintStep("myth")).toBe(2);
  });

  it("offers only the shape for a one-letter answer", () => {
    expect(maxHintStep("x")).toBe(1);
  });

  it("offers nothing when there is nothing to hide", () => {
    expect(maxHintStep("?!")).toBe(0);
  });
});

describe("unlockedHintStep", () => {
  const gate = {
    correctAnswer: "mirror",
    guidanceEnabled: true,
    guidanceThreshold: 2,
  };

  it("unlocks nothing below the guidance threshold", () => {
    expect(unlockedHintStep({ ...gate, attemptCount: 1 })).toBe(0);
    expect(unlockedHintStep({ ...gate, attemptCount: 0 })).toBe(0);
  });

  it("unlocks step 1 at the threshold", () => {
    expect(unlockedHintStep({ ...gate, attemptCount: 2 })).toBe(1);
  });

  it("unlocks one more step per wrong guess past the threshold", () => {
    expect(unlockedHintStep({ ...gate, attemptCount: 3 })).toBe(2);
  });

  it("caps at the answer's last safe step", () => {
    expect(unlockedHintStep({ ...gate, attemptCount: 9 })).toBe(3);
    expect(
      unlockedHintStep({ ...gate, correctAnswer: "eau", attemptCount: 9 }),
    ).toBe(2);
  });

  it("unlocks nothing when the author turned guidance off", () => {
    expect(
      unlockedHintStep({ ...gate, guidanceEnabled: false, attemptCount: 9 }),
    ).toBe(0);
  });
});
