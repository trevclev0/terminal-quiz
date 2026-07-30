import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

const UPDATE_GATE_MUTATION = `
  mutation UpdateGate(
    $id: String!
    $label: String
    $question: String
    $correctAnswer: String
    $successMessage: String
    $sequenceOrder: Int
    $acceptanceThreshold: Float
    $guidanceEnabled: Boolean
    $guidanceThreshold: Int
  ) {
    updateGate(
      id: $id
      label: $label
      question: $question
      correctAnswer: $correctAnswer
      successMessage: $successMessage
      sequenceOrder: $sequenceOrder
      acceptanceThreshold: $acceptanceThreshold
      guidanceEnabled: $guidanceEnabled
      guidanceThreshold: $guidanceThreshold
    ) {
      id
      label
      sequenceOrder
    }
  }
`;

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
