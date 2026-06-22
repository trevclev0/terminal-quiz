import { graphqlFetch } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

const GET_IN_PROGRESS_PROGRAM_QUERY = `
  query GetInProgressProgram {
    getInProgressProgram
  }
`;

const fetchInProgressProgram = async (): Promise<string | null> => {
  const result = await graphqlFetch<{ getInProgressProgram: string | null }>(
    GET_IN_PROGRESS_PROGRAM_QUERY,
  );
  return result.getInProgressProgram;
};

export const inProgressProgramQueryOptions = {
  queryKey: PROGRAM_KEYS.inProgress(),
  queryFn: fetchInProgressProgram,
  staleTime: 0, // Always refetch to get latest session state
};

export const useInProgressProgramQuery = () => {
  return {
    queryOptions: inProgressProgramQueryOptions,
  };
};
