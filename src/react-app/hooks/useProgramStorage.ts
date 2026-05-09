import type { Gate, ProgramWithGates } from "@shared/types";
import { loadPrograms, savePrograms } from "@utils/dataManager";
import { useCallback, useEffect, useState } from "react";

function useProgramStorage() {
  const [programs, setPrograms] = useState<ProgramWithGates[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const activeProgram = programs.find((p) => p.isSelected);

  useEffect(() => {
    let cancelled = false;

    const loadProgramData = async () => {
      try {
        const loadedPrograms = await loadPrograms();
        if (!cancelled) {
          setPrograms(loadedPrograms);
        }
      } catch (err) {
        console.error("Failed to load programs:", err);
        setError(err as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProgramData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    savePrograms(programs).catch(console.error);
  }, [programs, isLoading]);

  const selectProgram = useCallback((programName: string) => {
    setPrograms((prev) =>
      prev.map((p) => ({
        ...p,
        isSelected: p.name === programName,
      })),
    );
  }, []);

  const updateProgram = useCallback((updatedProgram: ProgramWithGates) => {
    setPrograms((prev) =>
      prev.map((p) => (p.id === updatedProgram.id ? updatedProgram : p)),
    );
  }, []);

  const resetProgram = useCallback(() => {
    setPrograms((prev) =>
      prev.map((p) => {
        if (!p.isSelected) return p;
        return {
          ...p,
          gates: p.gates.map((gate: Gate) => ({
            ...gate,
            isSolved: false,
            solvedAt: null,
            attemptCount: 0,
          })),
        };
      }),
    );
  }, []);

  const clearActiveProgram = useCallback(() => {
    setPrograms((prev) =>
      prev.map((p) => ({
        ...p,
        isSelected: false,
      })),
    );
  }, []);

  return {
    programs,
    activeProgram,
    error,
    isLoading,
    selectProgram,
    updateProgram,
    resetProgram,
    clearActiveProgram,
  };
}

export default useProgramStorage;
