import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DELETE_PROGRAM_MUTATION } from "../../../shared/gqlQueries";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

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
