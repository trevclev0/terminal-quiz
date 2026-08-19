import { queryOptions, useQuery } from "@tanstack/react-query";
import { MY_PROGRAMS_QUERY } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

export type MyProgram = {
  id: string;
  name: string;
  visibility: string;
  authorId?: string | null;
};

const fetchMyPrograms = async (): Promise<MyProgram[]> => {
  const data = await graphqlRequest(MY_PROGRAMS_QUERY);
  const programs = data.myPrograms ?? [];
  return programs.filter(
    (program): program is Exclude<typeof program, null> => program !== null,
  );
};

export const myProgramsQueryOptions = queryOptions({
  queryKey: MANAGEMENT_KEYS.myPrograms,
  queryFn: fetchMyPrograms,
  staleTime: 1000 * 60 * 5,
});

export const useMyProgramsQuery = () => {
  return useQuery(myProgramsQueryOptions);
};
