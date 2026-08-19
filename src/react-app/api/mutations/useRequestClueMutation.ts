import { useMutation } from "@tanstack/react-query";
import { REQUEST_CLUE_MUTATION } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";

export type RequestClueResponse = {
  clueText: string | null;
  isClueLimitReached: boolean;
  cluesRemaining: number;
  isRateLimited: boolean;
  retryAfterMs: number | null;
  isAiBudgetExhausted: boolean;
};

const requestClue = async (
  programId: string,
  gateId: string,
  currentGuess: string,
): Promise<RequestClueResponse> => {
  const result = await graphqlRequest(REQUEST_CLUE_MUTATION, {
    programId,
    gateId,
    currentGuess,
  });
  if (!result.requestClue) {
    throw new Error("Failed to request clue.");
  }
  return result.requestClue;
};

export const useRequestClueMutation = (programId: string) => {
  return useMutation({
    mutationFn: (variables: { gateId: string; currentGuess: string }) =>
      requestClue(programId, variables.gateId, variables.currentGuess),
  });
};
