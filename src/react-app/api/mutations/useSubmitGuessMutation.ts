import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SubmitGuessMutation } from "../../../shared/generated/graphql";
import { SUBMIT_GUESS_MUTATION } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";
import { PROGRAM_KEYS } from "../queryKeys";

export type SubmitGuessResponse = NonNullable<
  SubmitGuessMutation["submitGuess"]
>;

const submitGuess = async (
  programId: string,
  gateId: string,
  guess: string,
): Promise<SubmitGuessResponse> => {
  const result = await graphqlRequest(SUBMIT_GUESS_MUTATION, {
    programId,
    gateId,
    guess,
  });
  if (result.submitGuess === null) {
    throw new Error("submitGuess returned no payload.");
  }
  return result.submitGuess;
};

type SubmitGuessOptions = {
  /** Called for a correct guess, before the progression refetch starts. */
  onSolved?: (gateId: string) => void;
};

export const useSubmitGuessMutation = (
  programId: string,
  { onSolved }: SubmitGuessOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { gateId: string; guess: string }) =>
      submitGuess(programId, variables.gateId, variables.guess),
    onSuccess: (data, variables) => {
      // Before the invalidation: the refetch it starts can land before
      // mutateAsync's caller resumes, and whatever reacts to the solve (the
      // ACCESS GRANTED flash, #313) must not render a frame behind the data.
      if (data.success) {
        onSolved?.(variables.gateId);
      }
      // Invalidate the program progression query to refetch the latest state
      queryClient.invalidateQueries({
        queryKey: PROGRAM_KEYS.progression(programId),
      });
    },
  });
};
