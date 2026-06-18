import usePrograms from "@hooks/useProgramsWithGates";
import type { Gate, ProgramWithGates } from "@shared/types";
import {
  defaultNullishGateProps,
  defaultNullishProgramProps,
} from "@test-utils/testTypes";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@api/client", () => ({
  api: {
    programs: {
      $get: vi.fn(),
    },
  },
}));

import { api } from "@api/client";
import { PROGRAM_KEYS } from "@api/queryKeys";
import { createQueryWrapper } from "@test-utils/queryTestUtils";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const makeGate = (
  programId: string,
  label: string,
  isSolved = false,
): Gate => ({
  id: `gate-${label}`,
  label,
  correctAnswer: `pw-${label}`,
  question: `Gate ${label}`,
  successMessage: `Answer ${label}`,
  isSolved,
  ...defaultNullishGateProps,
  programId,
  sequenceOrder: 1,
});

const programIdA = "prog-a";
const programIdB = "prog-b";

const mockPrograms: ProgramWithGates[] = [
  {
    id: programIdA,
    name: "Alpha",
    isSelected: true,
    gates: [makeGate(programIdA, "r1"), makeGate(programIdA, "r2", true)],
    ...defaultNullishProgramProps,
  },
  {
    id: programIdB,
    name: "Beta",
    isSelected: false,
    gates: [makeGate(programIdB, "r3")],
    ...defaultNullishProgramProps,
  },
];

// Setup function to handle the wrapper and initial data mocking
const setupHook = async (
  mockData: ProgramWithGates[] | null = mockPrograms,
  error?: Error,
  primeCache = false,
) => {
  const { queryClient, wrapper } = createQueryWrapper();

  if (primeCache && mockData) {
    queryClient.setQueryData(PROGRAM_KEYS.allWithGates, mockData);
  } else if (error) {
    vi.mocked(api.programs.$get).mockRejectedValueOnce(error);
  } else {
    vi.mocked(api.programs.$get).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as unknown as Awaited<ReturnType<typeof api.programs.$get>>);
  }

  const rendered = renderHook(() => usePrograms(), { wrapper });

  if (!primeCache) {
    await waitFor(() => expect(rendered.result.current.isLoading).toBe(false));
  }

  return rendered;
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Loading State
// ---------------------------------------------------------------------------
describe("initial state & loading", () => {
  it("starts with isLoading true and transitions to success", async () => {
    vi.mocked(api.programs.$get).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockPrograms,
              } as unknown as Awaited<ReturnType<typeof api.programs.$get>>),
            1,
          ),
        ),
    );

    // Use the utility here as well
    const { wrapper } = createQueryWrapper();

    const { result } = renderHook(() => usePrograms(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.programs).toEqual([]);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.programs).toEqual(mockPrograms);
  });
});

// ---------------------------------------------------------------------------
// Success Path
// ---------------------------------------------------------------------------
describe("when fetching resolves successfully", () => {
  it("sets programs to the loaded data", async () => {
    const { result } = await setupHook(mockPrograms, undefined, true);
    expect(result.current.programs).toEqual(mockPrograms);
  });

  it("derives activeProgram from the loaded programs", async () => {
    const { result } = await setupHook(mockPrograms, undefined, true);
    expect(result.current.activeProgram).toEqual(mockPrograms[0]);
  });

  it("returns undefined for activeProgram when no program is active", async () => {
    const allInactive = mockPrograms.map((p) => ({ ...p, isSelected: false }));
    const { result } = await setupHook(allInactive, undefined, true);
    expect(result.current.activeProgram).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Failure Path
// ---------------------------------------------------------------------------
describe("when fetching rejects", () => {
  const loadError = new Error("Network failure");

  it("sets error to the thrown error and programs to empty", async () => {
    const { result } = await setupHook(mockPrograms, loadError);
    expect(result.current.error).toBeTruthy();
    expect(result.current.programs).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Mutations: selectProgram
// ---------------------------------------------------------------------------
describe("selectProgram", () => {
  it("marks the named program as active and deactivates others", async () => {
    const { result } = await setupHook(mockPrograms, undefined, true);

    act(() => result.current.selectProgram(programIdB));

    // Wait for the TanStack Query observer to trigger the re-render
    await waitFor(() => {
      expect(
        result.current.programs.find((p) => p.name === "Beta")?.isSelected,
      ).toBe(true);
    });

    // Once the first assertion passes, we know the render is complete
    expect(
      result.current.programs.find((p) => p.name === "Alpha")?.isSelected,
    ).toBe(false);
    expect(result.current.activeProgram?.name).toBe("Beta");
  });
});

// ---------------------------------------------------------------------------
// Mutations: updateProgram
// ---------------------------------------------------------------------------
describe("updateProgram", () => {
  it("replaces the matching program by ID without mutating others", async () => {
    const { result } = await setupHook(mockPrograms, undefined, true);
    const updated: ProgramWithGates = {
      ...mockPrograms[0],
      gates: [
        makeGate(programIdA, "r1", true),
        makeGate(programIdA, "r2", true),
      ],
    };

    act(() => result.current.updateProgram(updated));

    await waitFor(() => {
      expect(result.current.programs[0]).toEqual(updated);
    });

    expect(result.current.programs[1]).toEqual(mockPrograms[1]); // Unchanged
    expect(result.current.activeProgram).toEqual(updated);
  });
});

// ---------------------------------------------------------------------------
// Mutations: resetProgram
// ---------------------------------------------------------------------------
describe("resetProgram", () => {
  it("sets all gates of the active program to unlocked: false", async () => {
    const { result } = await setupHook(mockPrograms, undefined, true);

    act(() => result.current.resetProgram());

    await waitFor(() => {
      const activeGates = result.current.activeProgram?.gates ?? [];
      expect(activeGates.every((r: Gate) => r.isSolved === false)).toBe(true);
    });

    const activeGates = result.current.activeProgram?.gates ?? [];
    expect(activeGates[0].label).toBe("r1"); // Preserves other data
  });

  it("does not affect inactive programs", async () => {
    const { result } = await setupHook(mockPrograms, undefined, true);
    act(() => result.current.resetProgram());

    await waitFor(() => {
      const beta = result.current.programs.find((p) => p.name === "Beta");
      expect(beta?.gates).toEqual(mockPrograms[1].gates);
    });
  });
});

// ---------------------------------------------------------------------------
// Mutations: clearActiveProgram
// ---------------------------------------------------------------------------
describe("clearActiveProgram", () => {
  it("sets active to false for all programs", async () => {
    const { result } = await setupHook(mockPrograms, undefined, true);

    act(() => result.current.clearActiveProgram());

    await waitFor(() => {
      expect(result.current.programs.every((p) => p.isSelected === false)).toBe(
        true,
      );
    });

    expect(result.current.activeProgram).toBeUndefined();
  });
});
