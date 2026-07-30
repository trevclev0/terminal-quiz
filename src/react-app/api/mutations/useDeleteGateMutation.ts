import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

const DELETE_GATE_MUTATION = `
  mutation DeleteGate($id: String!) {
    deleteGate(id: $id)
  }
`;

const deleteGate = async (id: string): Promise<void> => {
  await graphqlFetch(DELETE_GATE_MUTATION, { id });
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
