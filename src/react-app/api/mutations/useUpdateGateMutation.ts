import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UPDATE_GATE_MUTATION } from "../../../shared/gqlQueries";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

export type UpdateGateVariables = {
  id: string;
  label?: string;
  question?: string;
  correctAnswer?: string;
  successMessage?: string;
  sequenceOrder?: number;
  acceptanceThreshold?: number;
  guidanceEnabled?: boolean;
  guidanceThreshold?: number;
};

const updateGate = async (variables: UpdateGateVariables): Promise<void> => {
  await graphqlFetch(UPDATE_GATE_MUTATION, variables);
};

export const useUpdateGateMutation = (programId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: UpdateGateVariables) => updateGate(variables),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MANAGEMENT_KEYS.programGates(programId),
      });
    },
  });
};
