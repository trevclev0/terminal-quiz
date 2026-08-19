import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CREATE_PROGRAM_MUTATION } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

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
  const result = await graphqlRequest(CREATE_PROGRAM_MUTATION, {
    name,
    visibility,
  });
  if (!result.createProgram) {
    throw new Error("Failed to create program.");
  }
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
