import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

const CREATE_PROGRAM_MUTATION = `
  mutation CreateProgram($name: String!, $visibility: String) {
    createProgram(name: $name, visibility: $visibility) {
      id
      name
      visibility
      authorId
      createdAt
    }
  }
`;

export type CreateProgramResponse = {
  id: string;
  name: string;
  visibility: string;
  authorId: string | null;
  createdAt: string;
};

const createProgram = async (
  name: string,
  visibility: string,
): Promise<CreateProgramResponse> => {
  const result = await graphqlFetch<{ createProgram: CreateProgramResponse }>(
    CREATE_PROGRAM_MUTATION,
    { name, visibility },
  );
  return result.createProgram;
};

export const useCreateProgramMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { name: string; visibility: string }) =>
      createProgram(variables.name, variables.visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MANAGEMENT_KEYS.myPrograms,
      });
    },
  });
};
