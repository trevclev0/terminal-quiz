import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

const REORDER_GATES_MUTATION = `
  mutation ReorderGates($programId: String!, $orderedGateIds: [String!]!) {
    reorderGates(programId: $programId, orderedGateIds: $orderedGateIds)
  }
`;

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
