// Display helpers for a letter-pattern hint (#363). A cell is a revealed
// character, " " for a word gap, or null for a hidden letter.

export type HintCell = string | null;

const ALPHANUMERIC = /[\p{L}\p{N}]/u;

function splitWords(cells: HintCell[]): HintCell[][] {
  const words: HintCell[][] = [[]];
  for (const cell of cells) {
    if (cell === " ") words.push([]);
    else words[words.length - 1].push(cell);
  }
  return words;
}

/** "B _ U E", with a three-space gap between words. */
export function formatHintPattern(cells: HintCell[]): string {
  return splitWords(cells)
    .map((word) => word.map((cell) => cell ?? "_").join(" "))
    .join("   ");
}

/** "4 chars", or "2 words: 3, 4" for a phrase. Punctuation isn't counted. */
export function hintLengthLabel(cells: HintCell[]): string {
  const lengths = splitWords(cells).map(
    (word) =>
      word.filter((cell) => cell === null || ALPHANUMERIC.test(cell)).length,
  );
  if (lengths.length > 1) {
    return `${lengths.length} words: ${lengths.join(", ")}`;
  }
  return `${lengths[0]} ${lengths[0] === 1 ? "char" : "chars"}`;
}

/**
 * Screen-reader text. A row of underscores reads as "underscore underscore",
 * so each cell is spoken, hidden ones as "blank".
 */
export function describeHint(cells: HintCell[]): string {
  const spoken = cells.map((cell) =>
    cell === null ? "blank" : cell === " " ? "next word" : cell,
  );
  return `Hint: ${hintLengthLabel(cells)}. ${spoken.join(", ")}.`;
}
