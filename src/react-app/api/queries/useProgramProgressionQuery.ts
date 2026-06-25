import { useQuery } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

const GET_PROGRAM_PROGRESSION_QUERY = `
  query GetProgramProgression($programId: String!) {
    getProgramProgression(programId: $programId) {
      currentGate {
        id
        label
        question
      }
      completedGates {
        id
        label
        question
        correctAnswer
        successMessage
      }
      status
    }
  }
`;

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

