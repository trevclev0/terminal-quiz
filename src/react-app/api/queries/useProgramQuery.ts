import { queryOptions, useQuery } from "@tanstack/react-query";
import { PROGRAM_QUERY } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

const fetchProgram = async (id: string) => {
  const data = await graphqlRequest(PROGRAM_QUERY, {
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
