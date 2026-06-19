import { useProgramsQuery } from "@api/queries/useProgramsQuery";

function usePrograms() {
  const { data: programs = [], isLoading, error } = useProgramsQuery();

  return {
    programs,
    isLoading,
    error,
  };
}

export default usePrograms;
