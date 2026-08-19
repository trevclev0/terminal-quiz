import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DELETE_GATE_MUTATION } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

const deleteGate = async (id: string): Promise<void> => {
  await graphqlRequest(DELETE_GATE_MUTATION, { id });
};

export const useDeleteGateMutation = (programId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string }) => deleteGate(variables.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MANAGEMENT_KEYS.programGates(programId),
      });
    },
  });
};
