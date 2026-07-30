import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

const DELETE_PROGRAM_MUTATION = `
  mutation DeleteProgram($id: String!) {
    deleteProgram(id: $id)
  }
`;

const deleteProgram = async (id: string): Promise<void> => {
  await graphqlFetch(DELETE_PROGRAM_MUTATION, { id });
};

export const useDeleteProgramMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string }) => deleteProgram(variables.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MANAGEMENT_KEYS.myPrograms,
      });
    },
  });
};
