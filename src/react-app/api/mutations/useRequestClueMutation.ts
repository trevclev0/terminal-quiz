import { useMutation } from "@tanstack/react-query";
import { REQUEST_CLUE_MUTATION } from "../../../shared/gqlQueries";
import { graphqlFetch } from "../graphQlClient";

export type RequestClueResponse = {
  clueText: string | null;
  isClueLimitReached: boolean;
  cluesRemaining: number;
  isRateLimited: boolean;
  retryAfterMs: number | null;
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
  return useMutation({
    mutationFn: (variables: { gateId: string; currentGuess: string }) =>
      requestClue(programId, variables.gateId, variables.currentGuess),
  });
};
