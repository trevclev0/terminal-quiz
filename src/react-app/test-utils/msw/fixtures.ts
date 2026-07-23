import type { RequestClueResponse } from "@api/mutations/useRequestClueMutation";
import type { SubmitGuessResponse } from "@api/mutations/useSubmitGuessMutation";
import type {
  ActiveGate,
  CompletedGate,
  ProgramProgression,
} from "@api/queries/useProgramProgressionQuery";
import type { Program } from "@shared/types";

type MockProgram = Pick<Program, "id" | "name">;

export const mockProgram = (
  overrides: Partial<MockProgram> = {},
): MockProgram => ({
  id: "test-program-id",
  name: "Test Program",
  ...overrides,
});

export const mockPrograms = (
  overrides: Partial<MockProgram>[] = [],
): MockProgram[] => {
  if (overrides.length > 0) {
    return overrides.map((o, i) =>
      mockProgram({ id: String(i + 1), name: `Program ${i + 1}`, ...o }),
    );
  }
  return [
    mockProgram({ id: "1", name: "Program 1" }),
    mockProgram({ id: "2", name: "Program 2" }),
  ];
};

export const mockActiveGate = (
  overrides: Partial<ActiveGate> = {},
): ActiveGate => ({
  id: "gate-1",
  label: "Gate 1",
  question: "What is 2+2?",
  ...overrides,
});

export const mockCompletedGate = (
  overrides: Partial<CompletedGate> = {},
): CompletedGate => ({
  id: "gate-1",
  label: "Gate 1",
  question: "What is 2+2?",
  correctAnswer: "4",
  successMessage: "Correct!",
  ...overrides,
});

export const mockProgression = (
  overrides: Partial<ProgramProgression> = {},
): ProgramProgression => ({
  currentGate: mockActiveGate(),
  completedGates: [],
  status: "in_progress",
  ...overrides,
});

export const mockSubmitGuessResponse = (
  overrides: Partial<SubmitGuessResponse> = {},
): SubmitGuessResponse => ({
  success: true,
  message: "Access Granted.",
  canRequestClue: false,
  nextGate: null,
  ...overrides,
});

export const mockRequestClueResponse = (
  overrides: Partial<RequestClueResponse> = {},
): RequestClueResponse => ({
  clueText: "Here is a clue",
  isClueLimitReached: false,
  cluesRemaining: 2,
  ...overrides,
});
