import { MAX_GUESS_LENGTH } from "@worker-graphql/gameplay/guessValidation";

// C0 controls except tab/newline (handled separately) plus DEL.
const CONTROL_CHAR_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x00, 0x08],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  [0x7f, 0x7f],
];

const isControlChar = (code: number): boolean =>
  CONTROL_CHAR_RANGES.some(([low, high]) => code >= low && code <= high);

/**
 * Sanitizes a player's guess before it is interpolated into the AI clue
 * prompt. The guess is untrusted, user-controlled input adjacent to the
 * prompt's secret-ish `correctAnswer`, so it must not be able to break out of
 * its quoted slot or smuggle control characters into the prompt.
 *
 * Order matters: the length cap is applied to the *raw* input before any
 * escaping, so an accepted guess can never be truncated mid-escape (which
 * would leave a dangling backslash that escapes the prompt slot's closing
 * quote). Backslashes are escaped before quotes so the backslash introduced by
 * quote-escaping is not re-escaped.
 */
export function sanitizeGuessForPrompt(guess: string): string {
  return guess
    .slice(0, MAX_GUESS_LENGTH)
    .replace(/[\n\t]/g, " ")
    .split("")
    .filter((char) => !isControlChar(char.charCodeAt(0)))
    .join("")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}
