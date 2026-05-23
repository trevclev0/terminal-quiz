import { useProgramsQuery } from "@api/queries/useProgramsQuery";
import { programKeys } from "@api/queryKeys";
import type { Gate, ProgramWithGates as Program } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

function usePrograms() {
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading, error } = useProgramsQuery();

  const activeProgram = programs.find((p) => p.isSelected);

  const setProgramsCache = useCallback(
    (updater: (prev: Program[]) => Program[]) => {
      queryClient.setQueryData<Program[]>(programKeys.all, (old) => {
        if (!old) return [];
        return updater(old);
      });
    },
    [queryClient],
  );

  const selectProgram = useCallback(
    (programName: string) => {
      setProgramsCache((prev) =>
        prev.map((p) => ({
          ...p,
          isSelected: p.name === programName,
        })),
      );
    },
    [setProgramsCache],
  );

  const updateProgram = useCallback(
    (updatedProgram: Program) => {
      setProgramsCache((prev) =>
        prev.map((p) => (p.id === updatedProgram.id ? updatedProgram : p)),
      );
    },
    [setProgramsCache],
  );

  const resetProgram = useCallback(() => {
    setProgramsCache((prev) =>
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
  }, [setProgramsCache]);

  const clearActiveProgram = useCallback(() => {
    setProgramsCache((prev) =>
      prev.map((p) => ({
        ...p,
        isSelected: false,
      })),
    );
  }, [setProgramsCache]);

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

export default usePrograms;
