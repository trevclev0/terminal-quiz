import leven from "leven";

const GUESS_ACCURACY_THRESHOLD = 0.875;

function isGuessCloseEnough(guess: string, answer: string): boolean {
  const normalizedGuess = guess.trim().toLowerCase();
  const normalizedAnswer = answer.trim().toLowerCase();

  const distance = leven(normalizedGuess, normalizedAnswer);
  const longerLength = Math.max(
    normalizedGuess.length,
    normalizedAnswer.length,
  );
  const similarity = 1 - distance / longerLength;

  return similarity >= GUESS_ACCURACY_THRESHOLD;
}

export default isGuessCloseEnough;
