import { useMutation } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";

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

export const useRequestClueMutation = () => {
  return useMutation({
    mutationFn: (variables: { gateId: string; currentGuess: string }) =>
      requestClue(variables.gateId, variables.currentGuess),
  });
};
