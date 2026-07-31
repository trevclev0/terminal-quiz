import type { Program } from "@shared/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { PROGRAM_QUERY } from "../../../shared/gqlQueries";
import { graphqlFetch } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

const fetchProgram = async (id: string): Promise<Program | null> => {
  const data = await graphqlFetch<{ program: Program | null }>(PROGRAM_QUERY, {
    id,
  });
  return data.program;
};

export const programQueryOptions = (id: string) =>
  queryOptions({
    queryKey: PROGRAM_KEYS.single(id),
    queryFn: () => fetchProgram(id),
    staleTime: 1000 * 60 * 60 * 24,
  });

export const useProgramQuery = (id: string) => {
  return useQuery(programQueryOptions(id));
};
