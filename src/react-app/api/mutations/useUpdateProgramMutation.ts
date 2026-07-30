import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

const UPDATE_PROGRAM_MUTATION = `
  mutation UpdateProgram($id: String!, $name: String, $visibility: String) {
    updateProgram(id: $id, name: $name, visibility: $visibility) {
      id
      name
      visibility
    }
  }
`;

const updateProgram = async (
  id: string,
  name?: string,
  visibility?: string,
): Promise<void> => {
  await graphqlFetch(UPDATE_PROGRAM_MUTATION, { id, name, visibility });
};

export const useUpdateProgramMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      id: string;
      name?: string;
      visibility?: string;
    }) => updateProgram(variables.id, variables.name, variables.visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MANAGEMENT_KEYS.myPrograms,
      });
    },
  });
};
