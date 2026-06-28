export const MAX_CLUES_PER_GATE = 3;

export function computeCluesRemaining(existingClueCount: number): number {
  return Math.max(0, MAX_CLUES_PER_GATE - existingClueCount);
}

export function computeCanRequestClue(params: {
  isCorrectGuess: boolean;
  guidanceEnabled: boolean;
  attemptCount: number;
  guidanceThreshold: number;
  existingClueCount: number;
  mostRecentClueAttemptCount: number | null;
}): boolean {
  const {
    isCorrectGuess,
    guidanceEnabled,
    attemptCount,
    guidanceThreshold,
    existingClueCount,
    mostRecentClueAttemptCount,
  } = params;

  if (isCorrectGuess) return false;
  if (!guidanceEnabled) return false;
  if (attemptCount < guidanceThreshold) return false;
  if (existingClueCount >= MAX_CLUES_PER_GATE) return false;
  if (
    mostRecentClueAttemptCount !== null &&
    attemptCount <= mostRecentClueAttemptCount
  ) {
    return false;
  }
  return true;
}
