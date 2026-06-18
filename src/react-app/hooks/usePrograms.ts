import { useProgramsQuery } from "@api/queries/useProgramsQuery";
import { PROGRAM_KEYS } from "@api/queryKeys";
import type { Program } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export type ProgramWithSelection = Program & { isSelected?: boolean };

function usePrograms() {
  const queryClient = useQueryClient();
  const { data: programsData = [], isLoading, error } = useProgramsQuery();
  const programs = programsData as ProgramWithSelection[];

  const activeProgram = programs.find((p) => p.isSelected);

  const setProgramsCache = useCallback(
    (updater: (prev: ProgramWithSelection[]) => ProgramWithSelection[]) => {
      queryClient.setQueryData<ProgramWithSelection[]>(
        PROGRAM_KEYS.all,
        (old) => {
          if (!old) return [];
          return updater(old);
        },
      );
    },
    [queryClient],
  );

  const selectProgram = useCallback(
    (programId: string) => {
      setProgramsCache((prev) =>
        prev.map((p) => ({
          ...p,
          isSelected: p.id === programId,
        })),
      );
    },
    [setProgramsCache],
  );

  return {
    programs,
    activeProgram,
    isLoading,
    error,
    selectProgram,
  };
}

export default usePrograms;
