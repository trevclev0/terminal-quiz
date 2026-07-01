import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

const REQUEST_CLUE_MUTATION = `
  mutation RequestClue($gateId: String!, $currentGuess: String!) {
    requestClue(gateId: $gateId, currentGuess: $currentGuess) {
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
  gateId: string,
  currentGuess: string,
): Promise<RequestClueResponse> => {
  const result = await graphqlFetch<{ requestClue: RequestClueResponse }>(
    REQUEST_CLUE_MUTATION,
    { gateId, currentGuess },
  );
  return result.requestClue;
};

export const useRequestClueMutation = (programId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { gateId: string; currentGuess: string }) =>
      requestClue(variables.gateId, variables.currentGuess),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PROGRAM_KEYS.progression(programId),
      });
    },
  });
};
