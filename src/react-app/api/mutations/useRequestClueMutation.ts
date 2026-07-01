import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

const REQUEST_CLUE_MUTATION = `
  mutation RequestClue($programId: String!, $gateId: String!, $currentGuess: String!) {
    requestClue(programId: $programId, gateId: $gateId, currentGuess: $currentGuess) {
      clueText
      isClueLimitReached
      cluesRemaining
    }
  }
`;

export type RequestClueResponse = {
  clueText: string | null;
  isClueLimitReached: boolean;
  cluesRemaining: number;
};

const requestClue = async (
  programId: string,
  gateId: string,
  currentGuess: string,
): Promise<RequestClueResponse> => {
  const result = await graphqlFetch<{ requestClue: RequestClueResponse }>(
    REQUEST_CLUE_MUTATION,
    { programId, gateId, currentGuess },
  );
  return result.requestClue;
};

export const useRequestClueMutation = (programId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { gateId: string; currentGuess: string }) =>
      requestClue(programId, variables.gateId, variables.currentGuess),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PROGRAM_KEYS.progression(programId),
      });
    },
  });
};
