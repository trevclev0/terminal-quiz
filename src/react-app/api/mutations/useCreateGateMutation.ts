import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CREATE_GATE_MUTATION } from "../../../shared/gqlQueries";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

export type CreateGateVariables = {
  programId: string;
  label: string;
  question: string;
  correctAnswer: string;
  successMessage: string;
  sequenceOrder: number;
  acceptanceThreshold?: number;
  guidanceEnabled?: boolean;
  guidanceThreshold?: number;
};

const createGate = async (variables: CreateGateVariables): Promise<void> => {
  await graphqlFetch(CREATE_GATE_MUTATION, variables);
};

export const useCreateGateMutation = (programId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: CreateGateVariables) => createGate(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MANAGEMENT_KEYS.programGates(programId),
      });
    },
  });
};
