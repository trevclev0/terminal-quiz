import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlFetch } from "../graphQlClient";
import { MANAGEMENT_KEYS } from "../queryKeys";

const CREATE_GATE_MUTATION = `
  mutation CreateGate(
    $programId: String!
    $label: String!
    $question: String!
    $correctAnswer: String!
    $successMessage: String!
    $sequenceOrder: Int!
    $acceptanceThreshold: Float
    $guidanceEnabled: Boolean
    $guidanceThreshold: Int
  ) {
    createGate(
      programId: $programId
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
      programId
      label
      question
      sequenceOrder
    }
  }
`;

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
