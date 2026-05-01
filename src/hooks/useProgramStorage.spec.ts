// src/hooks/useProgramStorage.test.ts

import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultNullishGateProps,
  defaultNullishProgramProps,
} from "../../tests/testTypes";
import type { Gate, ProgramWithGates } from "../db/types";
import { loadPrograms, savePrograms } from "../utils/dataManager";
import useProgramStorage from "./useProgramStorage";

// ---------------------------------------------------------------------------
// Module mock — replaces the real dataManager for all tests in this file
// ---------------------------------------------------------------------------

vi.mock("../utils/dataManager");

const mockLoadPrograms = vi.mocked(loadPrograms);
const mockSavePrograms = vi.mocked(savePrograms);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeRiddle = (label: string, unlocked = false): Gate => ({
  id: "11537bf6-ad80-46e6-90b9-9fbe0259e360",
  label: label,
  correctAnswer: `pw-${label}`,
  question: `Riddle ${label}`,
  successMessage: `Answer ${label}`,
  isSolved: unlocked,
  ...defaultNullishGateProps,
});

const programs: ProgramWithGates[] = [
  {
    id: "269d38fc-09f5-4d0b-924a-3b9874b0e419",
    name: "Alpha",
    isSelected: true,
    gates: [makeRiddle("r1"), makeRiddle("r2", true)],
    ...defaultNullishProgramProps,
  },
  {
    id: "df6b79d9-b365-4d9c-9a77-414fafeccaa1",
    name: "Beta",
    isSelected: false,
    gates: [makeRiddle("r3")],
    ...defaultNullishProgramProps,
  },
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Default happy-path implementations
  mockLoadPrograms.mockResolvedValue(programs);
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
    const { result } = renderHook(() => useProgramStorage());
    expect(result.current.isLoading).toBe(true);
  });

  it("starts with an empty programs array", () => {
    const { result } = renderHook(() => useProgramStorage());
    expect(result.current.programs).toEqual([]);
  });

  it("starts with a null error", () => {
    const { result } = renderHook(() => useProgramStorage());
    expect(result.current.error).toBeNull();
  });

  it("starts with an undefined activeProgram", () => {
    const { result } = renderHook(() => useProgramStorage());
    expect(result.current.activeProgram).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Loading — success path
// ---------------------------------------------------------------------------

describe("when loadPrograms resolves successfully", () => {
  it("sets programs to the loaded data", async () => {
    const { result } = renderHook(() => useProgramStorage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.programs).toEqual(programs);
  });

  it("sets isLoading to false", async () => {
    const { result } = renderHook(() => useProgramStorage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("leaves error as null", async () => {
    const { result } = renderHook(() => useProgramStorage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
  });

  it("derives activeProgram from the loaded programs", async () => {
    const { result } = renderHook(() => useProgramStorage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.activeProgram).toEqual(programs[0]);
  });

  it("returns undefined for activeProgram when no program is active", async () => {
    const allInactive: ProgramWithGates[] = programs.map((p) => ({
      ...p,
      isSelected: false,
    }));
    mockLoadPrograms.mockResolvedValue(allInactive);

    const { result } = renderHook(() => useProgramStorage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.activeProgram).toBeUndefined();
  });

  it("calls savePrograms once after the initial load completes", async () => {
    const { result } = renderHook(() => useProgramStorage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockSavePrograms).toHaveBeenCalledTimes(1);
    expect(mockSavePrograms).toHaveBeenCalledWith(programs);
  });

  it("does not call savePrograms before loading completes", () => {
    // Don't await — inspect while the hook is still loading
    renderHook(() => useProgramStorage());
    expect(mockSavePrograms).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Loading — failure path
// ---------------------------------------------------------------------------

describe("when loadPrograms rejects", () => {
  const loadError = new Error("Network failure");

  beforeEach(() => {
    mockLoadPrograms.mockRejectedValue(loadError);
  });

  it("sets error to the thrown error", async () => {
    const { result } = renderHook(() => useProgramStorage());

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error).toBe(loadError);
  });

  it("sets isLoading to false", async () => {
    const { result } = renderHook(() => useProgramStorage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it("leaves programs as an empty array", async () => {
    const { result } = renderHook(() => useProgramStorage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.programs).toEqual([]);
  });

  it("logs the error to console.error", async () => {
    const { result } = renderHook(() => useProgramStorage());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

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
    // Create a promise we can resolve manually after unmount
    let resolveLoad!: (value: ProgramWithGates[]) => void;
    const deferred = new Promise<ProgramWithGates[]>((res) => {
      resolveLoad = res;
    });
    mockLoadPrograms.mockReturnValue(deferred);

    const { result, unmount } = renderHook(() => useProgramStorage());

    // Unmount before the load resolves
    unmount();

    // Now resolve — should not cause a state update or a React warning
    await act(async () => {
      resolveLoad(programs);
    });

    // State should remain at initial values (the update was cancelled)
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
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectProgram("Beta"));

    expect(
      result.current.programs.find((p) => p.name === "Beta")?.isSelected,
    ).toBe(true);
  });

  it("deactivates all other programs", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectProgram("Beta"));

    const otherPrograms = result.current.programs.filter(
      (p) => p.name !== "Beta",
    );
    expect(otherPrograms.every((p) => !p.isSelected)).toBe(true);
  });

  it("updates activeProgram accordingly", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectProgram("Beta"));

    expect(result.current.activeProgram?.name).toBe("Beta");
  });

  it("triggers a savePrograms call with the updated programs", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsBefore = mockSavePrograms.mock.calls.length;
    act(() => result.current.selectProgram("Beta"));

    await waitFor(() =>
      expect(mockSavePrograms.mock.calls.length).toBeGreaterThan(callsBefore),
    );

    const lastCall = mockSavePrograms.mock.calls.at(-1)?.[0];
    if (!lastCall) throw new Error("lasCall was not defined");
    expect(lastCall.find((p) => p.name === "Beta")?.isSelected).toBe(true);
    expect(lastCall.find((p) => p.name === "Alpha")?.isSelected).toBe(false);
  });

  it("handles selecting a program that is already active", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.selectProgram("Alpha"));

    expect(
      result.current.programs.find((p) => p.name === "Alpha")?.isSelected,
    ).toBe(true);
  });

  it("handles an unrecognized program name without throwing", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(() =>
      act(() => result.current.selectProgram("Nonexistent")),
    ).not.toThrow();
    // All programs end up inactive
    expect(result.current.programs.every((p) => !p.isSelected)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateActiveProgram
// ---------------------------------------------------------------------------

describe("updateActiveProgram", () => {
  it("replaces the matching program by name", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const updated: ProgramWithGates = {
      ...programs[0],
      gates: [makeRiddle("r1", true), makeRiddle("r2", true)],
    };

    act(() => result.current.updateActiveProgram(updated));

    expect(result.current.programs[0]).toEqual(updated);
  });

  it("does not mutate unrelated programs", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const updated: ProgramWithGates = { ...programs[0], gates: [] };
    act(() => result.current.updateActiveProgram(updated));

    expect(result.current.programs[1]).toEqual(programs[1]);
  });

  it("updates activeProgram when the active program is replaced", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const updated: ProgramWithGates = {
      ...programs[0],
      gates: [makeRiddle("r1", true)],
    };

    act(() => result.current.updateActiveProgram(updated));

    expect(result.current.activeProgram).toEqual(updated);
  });

  it("triggers a savePrograms call", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsBefore = mockSavePrograms.mock.calls.length;
    act(() =>
      result.current.updateActiveProgram({ ...programs[0], gates: [] }),
    );

    await waitFor(() =>
      expect(mockSavePrograms.mock.calls.length).toBeGreaterThan(callsBefore),
    );
  });
});

// ---------------------------------------------------------------------------
// resetProgram
// ---------------------------------------------------------------------------

describe("resetProgram", () => {
  it("sets all riddles of the active program to unlocked: false", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.resetProgram());

    const activeRiddles = result.current.activeProgram?.gates ?? [];
    expect(activeRiddles.every((r) => r.isSolved === false)).toBe(true);
  });

  it("does not affect inactive programs", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.resetProgram());

    // Beta's riddle should be unchanged
    const beta = result.current.programs.find((p) => p.name === "Beta");
    expect(beta?.gates).toEqual(programs[1].gates);
  });

  it("preserves all other riddle fields after reset", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.resetProgram());

    const riddle = result.current.activeProgram?.gates[0];
    expect(riddle?.label).toBe("r1");
    expect(riddle?.correctAnswer).toBe("pw-r1");
    expect(riddle?.question).toBe("Riddle r1");
  });

  it("is a no-op when no program is active", async () => {
    const allInactive = programs.map((p) => ({ ...p, isSelected: false }));
    mockLoadPrograms.mockResolvedValue(allInactive);

    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const before = result.current.programs;
    act(() => result.current.resetProgram());

    expect(result.current.programs).toEqual(before);
  });

  it("triggers a savePrograms call", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsBefore = mockSavePrograms.mock.calls.length;
    act(() => result.current.resetProgram());

    await waitFor(() =>
      expect(mockSavePrograms.mock.calls.length).toBeGreaterThan(callsBefore),
    );
  });
});

// ---------------------------------------------------------------------------
// clearActiveProgram
// ---------------------------------------------------------------------------

describe("clearActiveProgram", () => {
  it("sets active to false for all programs", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.clearActiveProgram());

    expect(result.current.programs.every((p) => p.isSelected === false)).toBe(
      true,
    );
  });

  it("updates activeProgram to be undefined", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.clearActiveProgram());

    expect(result.current.activeProgram).toBeUndefined();
  });

  it("is a no-op if no program is currently active", async () => {
    const allInactive = programs.map((p) => ({ ...p, isSelected: false }));
    mockLoadPrograms.mockResolvedValue(allInactive);

    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const before = result.current.programs;
    act(() => result.current.clearActiveProgram());

    expect(result.current.programs).toEqual(before);
  });

  it("triggers a savePrograms call", async () => {
    const { result } = renderHook(() => useProgramStorage());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsBefore = mockSavePrograms.mock.calls.length;
    act(() => result.current.clearActiveProgram());

    await waitFor(() =>
      expect(mockSavePrograms.mock.calls.length).toBeGreaterThan(callsBefore),
    );
  });
});
