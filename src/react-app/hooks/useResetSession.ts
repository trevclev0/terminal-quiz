import { graphqlFetch } from "@api/graphQlClient";
import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const RESET_SESSION_MUTATION = `
  mutation ResetSession($programId: String!) {
    resetSession(programId: $programId)
  }
`;

type ResetSessionVariables = {
  programId: string;
};

export function useResetSession() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, ResetSessionVariables>({
    mutationFn: async (variables) => {
      const data = await graphqlFetch<{ resetSession: boolean }>(
        RESET_SESSION_MUTATION,
        variables,
      );
      return data.resetSession;
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.programId) {
        return queryClient.invalidateQueries({
          queryKey: programProgressionQueryOptions(variables.programId)
            .queryKey,
        });
      }
    },
  });
}
