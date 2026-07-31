import type { Program } from "@shared/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

// Keep in sync with shared/gqlQueries.ts PROGRAM_QUERY
const PROGRAM_QUERY = `
  query Program($id: String!) {
    program(id: $id) {
      id
      name
    }
  }
`;

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
