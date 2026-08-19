import { queryOptions, useQuery } from "@tanstack/react-query";
import { GET_PROGRAMS_QUERY } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

const fetchPrograms = async () => {
  const data = await graphqlRequest(GET_PROGRAMS_QUERY);
  return data.programs;
};

export const programsQueryOptions = queryOptions({
  queryKey: PROGRAM_KEYS.all,
  queryFn: fetchPrograms,
  staleTime: 1000 * 60 * 60 * 24, // 24 hours
});

export const useProgramsQuery = () => {
  return useQuery(programsQueryOptions);
};
