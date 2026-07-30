import type { RequestClueResponse } from "@api/mutations/useRequestClueMutation";
import type { SubmitGuessResponse } from "@api/mutations/useSubmitGuessMutation";
import type { Me } from "@api/queries/useMeQuery";
import type { MyProgram } from "@api/queries/useMyProgramsQuery";

import type { GateManagement } from "@api/queries/useProgramGatesQuery";
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
  id: "active-gate-1",
  label: "Gate 1",
  question: "What is 2+2?",
  ...overrides,
});

export const mockCompletedGate = (
  overrides: Partial<CompletedGate> = {},
): CompletedGate => ({
  id: "completed-gate-1",
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

export const mockMe = (overrides: Partial<Me> = {}): Me => ({
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  image: null,
  ...overrides,
});

export const mockMyPrograms = (
  overrides: Partial<MyProgram>[] = [],
): MyProgram[] => {
  if (overrides.length > 0) {
    return overrides.map((o, i) => ({
      id: String(i + 1),
      name: `Program ${i + 1}`,
      visibility: "public",
      authorId: "test-user-id",
      ...o,
    }));
  }
  return [
    {
      id: "program-1",
      name: "My First Program",
      visibility: "public",
      authorId: "test-user-id",
    },
  ];
};

export const mockGateManagement = (
  overrides: Partial<GateManagement> = {},
): GateManagement => ({
  id: "gate-1",
  programId: "program-1",
  sequenceOrder: 1,
  label: "Gate A",
  question: "What is 2+2?",
  correctAnswer: "4",
  successMessage: "Correct!",
  acceptanceThreshold: 0.875,
  guidanceEnabled: false,
  guidanceThreshold: 3,
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
