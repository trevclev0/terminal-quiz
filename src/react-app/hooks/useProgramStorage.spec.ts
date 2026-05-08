import useProgramStorage from "@hooks/useProgramStorage";
import type { Gate, ProgramWithGates } from "@shared/types";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultNullishGateProps,
  defaultNullishProgramProps,
} from "@test-utils/testTypes";
import { loadPrograms, savePrograms } from "@utils/dataManager";

// ---------------------------------------------------------------------------
// Module mock
// ---------------------------------------------------------------------------
vi.mock("@utils/dataManager");

const mockLoadPrograms = vi.mocked(loadPrograms);
const mockSavePrograms = vi.mocked(savePrograms);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const makeRiddle = (
  programId: string,
  label: string,
  isSolved = false,
): Gate => ({
  id: "11537bf6-ad80-46e6-90b9-9fbe0259e360",
  label,
  correctAnswer: `pw-${label}`,
  question: `Riddle ${label}`,
  successMessage: `Answer ${label}`,
  isSolved,
  ...defaultNullishGateProps,
  programId,
  sequenceOrder: 1,
});

const programIdA = "269d38fc-09f5-4d0b-924a-3b9874b0e419";
const programIdB = "df6b79d9-b365-4d9c-9a77-414fafeccaa1";

const programs: ProgramWithGates[] = [
  {
    id: programIdA,
    name: "Alpha",
    isSelected: true,
    gates: [makeRiddle(programIdA, "r1"), makeRiddle(programIdA, "r2", true)],
    ...defaultNullishProgramProps,
  },
  {
    id: programIdB,
    name: "Beta",
    isSelected: false,
    gates: [makeRiddle(programIdB, "r3")],
    ...defaultNullishProgramProps,
  },
];

// ---------------------------------------------------------------------------
// Test Helper: Flushes promises
// ---------------------------------------------------------------------------
async function setupHook(mockData = programs, error?: Error) {
  if (error) {
    mockLoadPrograms.mockRejectedValue(error);
  } else {
    mockLoadPrograms.mockResolvedValue(mockData);
  }

  const rendered = renderHook(() => useProgramStorage());

  await act(async () => {
    await Promise.resolve();
  });

  return rendered;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
beforeEach(() => {
  mockSavePrograms.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
describe("initial state", () => {
  it("starts with isLoading true", () => {
    mockLoadPrograms.mockResolvedValue(programs);
    const { result } = renderHook(() => useProgramStorage());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.programs).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.activeProgram).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Loading — success path
// ---------------------------------------------------------------------------
describe("when loadPrograms resolves successfully", () => {
  it("sets programs to the loaded data", async () => {
    const { result } = await setupHook();
    expect(result.current.programs).toEqual(programs);
  });

  it("sets isLoading to false", async () => {
    const { result } = await setupHook();
    expect(result.current.isLoading).toBe(false);
  });

  it("leaves error as null", async () => {
    const { result } = await setupHook();
    expect(result.current.error).toBeNull();
  });

  it("derives activeProgram from the loaded programs", async () => {
    const { result } = await setupHook();
    expect(result.current.activeProgram).toEqual(programs[0]);
  });

  it("returns undefined for activeProgram when no program is active", async () => {
    const allInactive = programs.map((p) => ({ ...p, isSelected: false }));
    const { result } = await setupHook(allInactive);
    expect(result.current.activeProgram).toBeUndefined();
  });

  it("calls savePrograms once after the initial load completes", async () => {
    await setupHook();
    expect(mockSavePrograms).toHaveBeenCalledTimes(1);
    expect(mockSavePrograms).toHaveBeenCalledWith(programs);
  });

  it("does not call savePrograms before loading completes", () => {
    mockLoadPrograms.mockReturnValue(new Promise(() => {})); // Never resolves
    renderHook(() => useProgramStorage());
    expect(mockSavePrograms).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Loading — failure path
// ---------------------------------------------------------------------------
describe("when loadPrograms rejects", () => {
  const loadError = new Error("Network failure");

  it("sets error to the thrown error", async () => {
    const { result } = await setupHook(programs, loadError);
    expect(result.current.error).toBe(loadError);
  });

  it("sets isLoading to false", async () => {
    const { result } = await setupHook(programs, loadError);
    expect(result.current.isLoading).toBe(false);
  });

  it("leaves programs as an empty array", async () => {
    const { result } = await setupHook(programs, loadError);
    expect(result.current.programs).toEqual([]);
  });

  it("logs the error to console.error", async () => {
    await setupHook(programs, loadError);
    expect(console.error).toHaveBeenCalledWith(
      "Failed to load programs:",
      loadError,
    );
  });
});

// ---------------------------------------------------------------------------
// Cleanup / cancellation
// ---------------------------------------------------------------------------
describe("cleanup on unmount", () => {
  it("does not update state after the hook unmounts mid-load", async () => {
    let resolveLoad!: (value: ProgramWithGates[]) => void;
    const deferred = new Promise<ProgramWithGates[]>((res) => {
      resolveLoad = res;
    });
    mockLoadPrograms.mockReturnValue(deferred);

    const { result, unmount } = renderHook(() => useProgramStorage());

    unmount();

    await act(async () => {
      resolveLoad(programs);
      await Promise.resolve(); // flush
    });

    expect(result.current.programs).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(console.error).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// selectProgram
// ---------------------------------------------------------------------------
describe("selectProgram", () => {
  it("marks the named program as active", async () => {
    const { result } = await setupHook();
    act(() => result.current.selectProgram("Beta"));
    expect(
      result.current.programs.find((p) => p.name === "Beta")?.isSelected,
    ).toBe(true);
  });

  it("deactivates all other programs", async () => {
    const { result } = await setupHook();
    act(() => result.current.selectProgram("Beta"));
    const otherPrograms = result.current.programs.filter(
      (p) => p.name !== "Beta",
    );
    expect(otherPrograms.every((p) => !p.isSelected)).toBe(true);
  });

  it("updates activeProgram accordingly", async () => {
    const { result } = await setupHook();
    act(() => result.current.selectProgram("Beta"));
    expect(result.current.activeProgram?.name).toBe("Beta");
  });

  it("triggers a savePrograms call with the updated programs", async () => {
    const { result } = await setupHook();

    // Clear out the initial save call to make assertion cleaner
    mockSavePrograms.mockClear();

    act(() => result.current.selectProgram("Beta"));

    expect(mockSavePrograms).toHaveBeenCalledTimes(1);
    const lastCall = mockSavePrograms.mock.calls[0][0];
    expect(lastCall.find((p) => p.name === "Beta")?.isSelected).toBe(true);
    expect(lastCall.find((p) => p.name === "Alpha")?.isSelected).toBe(false);
  });

  it("handles selecting a program that is already active", async () => {
    const { result } = await setupHook();
    act(() => result.current.selectProgram("Alpha"));
    expect(
      result.current.programs.find((p) => p.name === "Alpha")?.isSelected,
    ).toBe(true);
  });

  it("handles an unrecognized program name without throwing", async () => {
    const { result } = await setupHook();
    expect(() =>
      act(() => result.current.selectProgram("Nonexistent")),
    ).not.toThrow();
    expect(result.current.programs.every((p) => !p.isSelected)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateProgram
// ---------------------------------------------------------------------------
describe("updateProgram", () => {
  it("replaces the matching program by name", async () => {
    const { result } = await setupHook();
    const updated: ProgramWithGates = {
      ...programs[0],
      gates: [
        makeRiddle(programIdA, "r1", true),
        makeRiddle(programIdA, "r2", true),
      ],
    };

    act(() => result.current.updateProgram(updated));
    expect(result.current.programs[0]).toEqual(updated);
  });

  it("does not mutate unrelated programs", async () => {
    const { result } = await setupHook();
    const updated: ProgramWithGates = { ...programs[0], gates: [] };

    act(() => result.current.updateProgram(updated));
    expect(result.current.programs[1]).toEqual(programs[1]);
  });

  it("updates activeProgram when the active program is replaced", async () => {
    const { result } = await setupHook();
    const updated: ProgramWithGates = {
      ...programs[0],
      gates: [makeRiddle(programIdA, "r1", true)],
    };

    act(() => result.current.updateProgram(updated));
    expect(result.current.activeProgram).toEqual(updated);
  });

  it("triggers a savePrograms call", async () => {
    const { result } = await setupHook();
    mockSavePrograms.mockClear();

    act(() => result.current.updateProgram({ ...programs[0], gates: [] }));
    expect(mockSavePrograms).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// resetProgram
// ---------------------------------------------------------------------------
describe("resetProgram", () => {
  it("sets all riddles of the active program to unlocked: false", async () => {
    const { result } = await setupHook();
    act(() => result.current.resetProgram());

    const activeRiddles = result.current.activeProgram?.gates ?? [];
    expect(activeRiddles.every((r: Gate) => r.isSolved === false)).toBe(true);
  });

  it("does not affect inactive programs", async () => {
    const { result } = await setupHook();
    act(() => result.current.resetProgram());

    const beta = result.current.programs.find((p) => p.name === "Beta");
    expect(beta?.gates).toEqual(programs[1].gates);
  });

  it("preserves all other riddle fields after reset", async () => {
    const { result } = await setupHook();
    act(() => result.current.resetProgram());

    const riddle = result.current.activeProgram?.gates[0];
    expect(riddle?.label).toBe("r1");
    expect(riddle?.correctAnswer).toBe("pw-r1");
  });

  it("is a no-op when no program is active", async () => {
    const allInactive = programs.map((p) => ({ ...p, isSelected: false }));
    const { result } = await setupHook(allInactive);

    const before = result.current.programs;
    act(() => result.current.resetProgram());
    expect(result.current.programs).toEqual(before);
  });

  it("triggers a savePrograms call", async () => {
    const { result } = await setupHook();
    mockSavePrograms.mockClear();

    act(() => result.current.resetProgram());
    expect(mockSavePrograms).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// clearActiveProgram
// ---------------------------------------------------------------------------
describe("clearActiveProgram", () => {
  it("sets active to false for all programs", async () => {
    const { result } = await setupHook();
    act(() => result.current.clearActiveProgram());

    expect(result.current.programs.every((p) => p.isSelected === false)).toBe(
      true,
    );
  });

  it("updates activeProgram to be undefined", async () => {
    const { result } = await setupHook();
    act(() => result.current.clearActiveProgram());

    expect(result.current.activeProgram).toBeUndefined();
  });

  it("is a no-op if no program is currently active", async () => {
    const allInactive = programs.map((p) => ({ ...p, isSelected: false }));
    const { result } = await setupHook(allInactive);

    const before = result.current.programs;
    act(() => result.current.clearActiveProgram());
    expect(result.current.programs).toEqual(before);
  });

  it("triggers a savePrograms call", async () => {
    const { result } = await setupHook();
    mockSavePrograms.mockClear();

    act(() => result.current.clearActiveProgram());
    expect(mockSavePrograms).toHaveBeenCalledTimes(1);
  });
});
