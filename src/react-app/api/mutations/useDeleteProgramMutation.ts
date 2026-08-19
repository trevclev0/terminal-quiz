import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DELETE_PROGRAM_MUTATION } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

const deleteProgram = async (id: string): Promise<void> => {
  await graphqlRequest(DELETE_PROGRAM_MUTATION, { id });
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
