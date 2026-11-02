import leven from "leven";

const GUESS_ACCURACY_THRESHOLD = 0.875;

function isGuessCloseEnough(
  guess: string,
  answer: string,
  threshold = GUESS_ACCURACY_THRESHOLD,
): boolean {
  const normalizedGuess = guess.trim().toLowerCase();
  const normalizedAnswer = answer.trim().toLowerCase();

  if (normalizedGuess.length === 0 && normalizedAnswer.length === 0) {
    return true;
  }

  const distance = leven(normalizedGuess, normalizedAnswer);
  const longerLength = Math.max(
    normalizedGuess.length,
    normalizedAnswer.length,
  );
  const similarity = 1 - distance / longerLength;

  return similarity >= threshold;
}

/**
 * True when the guess is close enough to the main answer or to any alias.
 * Aliases use the same fuzzy threshold, so a short alias such as "NYC" has
 * no slack for typos while a long one tolerates them like the main answer.
 */
export function isGuessAccepted(
  guess: string,
  correctAnswer: string,
  acceptedAnswers: readonly string[] | null,
  threshold = GUESS_ACCURACY_THRESHOLD,
): boolean {
  return [correctAnswer, ...(acceptedAnswers ?? [])].some((answer) =>
    isGuessCloseEnough(guess, answer, threshold),
  );
}

export default isGuessCloseEnough;
