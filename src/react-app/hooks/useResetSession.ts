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
    onSettled: (_data, error, variables) => {
      if (!variables?.programId) return;
      const queryKey = programProgressionQueryOptions(
        variables.programId,
      ).queryKey;
      // The server starts the next run's clock on the first progression fetch
      // after a reset. TanStack awaits onSettled before mutateAsync resolves,
      // so an eager refetch here would stamp it at the click, even for a
      // player who is about to leave and returns days later. On success only
      // mark the cache stale; the caller refetches when it stays on the
      // program ("Play again"). After a failure the server state is unknown,
      // so resync at once.
      return queryClient.invalidateQueries(
        error ? { queryKey } : { queryKey, refetchType: "none" },
      );
    },
  });
}
