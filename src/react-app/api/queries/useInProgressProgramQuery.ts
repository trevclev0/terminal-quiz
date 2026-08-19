import { GET_IN_PROGRESS_PROGRAM_QUERY } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

const fetchInProgressProgram = async (): Promise<string | null> => {
  const result = await graphqlRequest(GET_IN_PROGRESS_PROGRAM_QUERY);
  return result.getInProgressProgram;
};

export const inProgressProgramQueryOptions = {
  queryKey: PROGRAM_KEYS.inProgress(),
  queryFn: fetchInProgressProgram,
  staleTime: 0, // Always refetch to get latest session state
};
