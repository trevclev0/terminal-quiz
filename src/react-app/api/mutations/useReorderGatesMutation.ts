import { useMutation, useQueryClient } from "@tanstack/react-query";
import { REORDER_GATES_MUTATION } from "../../../shared/gqlQueries";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

export type ReorderGatesVariables = {
  programId: string;
  orderedGateIds: string[];
};

const reorderGates = async (
  variables: ReorderGatesVariables,
): Promise<void> => {
  await graphqlFetch(REORDER_GATES_MUTATION, variables);
};

export const useReorderGatesMutation = (programId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: ReorderGatesVariables) => reorderGates(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MANAGEMENT_KEYS.programGates(programId),
      });
    },
  });
};
