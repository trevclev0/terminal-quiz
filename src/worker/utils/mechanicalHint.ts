// Letter-pattern hints built from a gate's answer (#363). Server-only: the
// input is `correctAnswer`, which must never reach the client in full.

/** A revealed character, a " " word gap, or null for a hidden letter. */
export type HintCell = string | null;

export const HINT_STEPS = 3;

const ALPHANUMERIC = /[\p{L}\p{N}]/u;
const VOWEL = /^[aeiou]/i;

function isVowel(char: string) {
  // NFD splits an accented letter into its base letter plus a combining
  // mark, so "é" tests as "e".
  return VOWEL.test(char.normalize("NFD"));
}

/**
 * Step 1 masks letters and digits, step 2 adds each word's first letter,
 * step 3 adds the vowels. Punctuation is always shown, and whitespace runs
 * become a single " " cell.
 */
export function buildHintCells(answer: string, step: number): HintCell[] {
  const cells: HintCell[] = [];
  for (const word of answer.normalize("NFC").trim().split(/\s+/u)) {
    if (cells.length > 0) cells.push(" ");
    let seenLetter = false;
    for (const char of word) {
      if (!ALPHANUMERIC.test(char)) {
        cells.push(char);
        continue;
      }
      const isFirst = !seenLetter;
      seenLetter = true;
      const revealed = (step >= 2 && isFirst) || (step >= 3 && isVowel(char));
      cells.push(revealed ? char.toUpperCase() : null);
    }
  }
  return cells;
}

const hiddenCount = (cells: HintCell[]) =>
  cells.filter((cell) => cell === null).length;

/**
 * The last step worth offering: each step must still hide a letter, or it
 * would give the answer away, and must reveal more than the step before.
 */
export function maxHintStep(answer: string): number {
  let previousHidden = Number.POSITIVE_INFINITY;
  for (let step = 1; step <= HINT_STEPS; step++) {
    const hidden = hiddenCount(buildHintCells(answer, step));
    if (hidden === 0 || hidden === previousHidden) return step - 1;
    previousHidden = hidden;
  }
  return HINT_STEPS;
}

/**
 * Hints follow the author's guidance settings, same as AI clues: the first
 * step unlocks at the guidance threshold and each wrong guess after it
 * unlocks one more. Derived from the attempt count alone, so no hint state
 * is stored.
 */
export function unlockedHintStep(params: {
  correctAnswer: string;
  guidanceEnabled: boolean;
  guidanceThreshold: number;
  attemptCount: number;
}): number {
  const { correctAnswer, guidanceEnabled, guidanceThreshold, attemptCount } =
    params;
  if (!guidanceEnabled || attemptCount < guidanceThreshold) return 0;
  return Math.min(
    maxHintStep(correctAnswer),
    attemptCount - guidanceThreshold + 1,
  );
}
