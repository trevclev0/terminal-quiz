import { graphqlFetch } from "@api/graphQlClient";
import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const RESET_SESSION_MUTATION = `
  mutation ResetSession($sessionId: ID!, $programId: ID!) {
    resetSession(sessionId: $sessionId, programId: $programId)
  }
`;

type ResetSessionVariables = {
  sessionId: string;
  programId: string;
};

export function useResetSession(programId: string) {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, ResetSessionVariables>({
    mutationFn: (variables) =>
      graphqlFetch<boolean>(RESET_SESSION_MUTATION, variables),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: programProgressionQueryOptions(programId).queryKey,
      });
    },
  });
}
