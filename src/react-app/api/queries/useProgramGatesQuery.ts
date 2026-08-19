import { queryOptions, useQuery } from "@tanstack/react-query";
import { PROGRAM_GATES_QUERY } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

export type GateManagement = {
  id: string;
  programId: string;
  sequenceOrder: number;
  label: string;
  question: string;
  correctAnswer: string;
  successMessage: string;
  acceptanceThreshold: number;
  guidanceEnabled: boolean;
  guidanceThreshold: number;
};

const fetchProgramGates = async (
  programId: string,
): Promise<GateManagement[]> => {
  const data = await graphqlRequest(PROGRAM_GATES_QUERY, { programId });
  return data.programGates;
};

export const programGatesQueryOptions = (programId: string) =>
  queryOptions({
    queryKey: MANAGEMENT_KEYS.programGates(programId),
    queryFn: () => fetchProgramGates(programId),
    staleTime: 1000 * 60 * 5,
  });

export const useProgramGatesQuery = (programId: string) => {
  return useQuery(programGatesQueryOptions(programId));
};
