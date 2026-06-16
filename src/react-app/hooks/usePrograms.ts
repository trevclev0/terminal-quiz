import { useProgramsQuery } from "@api/queries/useProgramsQuery";
import { programKeys } from "@api/queryKeys";
import type { Program } from "@shared/types";
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
