import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

const SUBMIT_GUESS_MUTATION = `
  mutation SubmitGuess($programId: String!, $gateId: String!, $guess: String!) {
    submitGuess(programId: $programId, gateId: $gateId, guess: $guess) {
      success
      message
      nextGate {
        id
        label
        question
      }
    }
  }
`;

export type SubmitGuessResponse = {
  success: boolean;
  message?: string;
  nextGate: {
    id: string;
    label: string;
    question: string;
  } | null;
};

const submitGuess = async (
  programId: string,
  gateId: string,
  guess: string,
): Promise<SubmitGuessResponse> => {
  const result = await graphqlFetch<{ submitGuess: SubmitGuessResponse }>(
    SUBMIT_GUESS_MUTATION,
    { programId, gateId, guess },
  );
  return result.submitGuess;
};

export const useSubmitGuessMutation = (programId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { gateId: string; guess: string }) =>
      submitGuess(programId, variables.gateId, variables.guess),
    onSuccess: () => {
      // Invalidate the program progression query to refetch the latest state
      queryClient.invalidateQueries({
        queryKey: PROGRAM_KEYS.progression(programId),
      });
    },
  });
};
