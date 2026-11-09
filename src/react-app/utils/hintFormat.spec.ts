import { describe, expect, it } from "vitest";
import { describeHint, formatHintPattern, hintLengthLabel } from "./hintFormat";

const blue = ["B", null, "U", "E"];
const redMoon = [null, null, null, " ", "M", null, null, null];

describe("formatHintPattern", () => {
  it("spaces the cells and shows hidden ones as underscores", () => {
    expect(formatHintPattern(blue)).toBe("B _ U E");
  });

  it("widens a word gap so words stay apart", () => {
    expect(formatHintPattern(redMoon)).toBe("_ _ _   M _ _ _");
  });
});

describe("hintLengthLabel", () => {
  it("counts the characters of a single word", () => {
    expect(hintLengthLabel(blue)).toBe("4 chars");
  });

  it("uses the singular for one character", () => {
    expect(hintLengthLabel([null])).toBe("1 char");
  });

  it("lists per-word lengths for a phrase", () => {
    expect(hintLengthLabel(redMoon)).toBe("2 words: 3, 4");
  });

  it("does not count punctuation", () => {
    expect(hintLengthLabel([null, "'", null])).toBe("2 chars");
  });

  it("counts a revealed digit", () => {
    expect(hintLengthLabel(["7", null])).toBe("2 chars");
  });
});

describe("describeHint", () => {
  it("reads the length, then each cell with hidden ones as blank", () => {
    expect(describeHint(blue)).toBe("Hint: 4 chars. B, blank, U, E.");
  });

  it("marks a word gap", () => {
    expect(describeHint(redMoon)).toBe(
      "Hint: 2 words: 3, 4. blank, blank, blank, next word, M, blank, blank, blank.",
    );
  });
});
