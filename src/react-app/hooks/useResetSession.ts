import { graphqlRequest } from "@api/graphQlClient";
import { programProgressionQueryOptions } from "@api/queries/useProgramProgressionQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RESET_SESSION_MUTATION } from "../../shared/gqlQueries";

type ResetSessionVariables = {
  programId: string;
};

export function useResetSession() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, ResetSessionVariables>({
    mutationFn: async (variables) => {
      const data = await graphqlRequest(RESET_SESSION_MUTATION, variables);
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
