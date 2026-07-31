import { GET_PROGRAM_PROGRESSION_QUERY } from "../../../shared/gqlQueries";
import { graphqlFetch } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

export type ActiveGate = {
  id: string;
  label: string;
  question: string;
};

export type CompletedGate = {
  id: string;
  label: string;
  question: string;
  correctAnswer: string;
  successMessage: string;
};

export type ProgramProgression = {
  currentGate: ActiveGate | null;
  completedGates: CompletedGate[];
  status: string;
};

const fetchProgramProgression = async (
  programId: string,
): Promise<ProgramProgression> => {
  const result = await graphqlFetch<{
    getProgramProgression: ProgramProgression;
  }>(GET_PROGRAM_PROGRESSION_QUERY, { programId });
  return result.getProgramProgression;
};

export const programProgressionQueryOptions = (programId: string) => ({
  queryKey: PROGRAM_KEYS.progression(programId),
  queryFn: () => fetchProgramProgression(programId),
  staleTime: 1000 * 30, // 30 seconds
});
