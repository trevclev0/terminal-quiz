import { useMutation } from "@tanstack/react-query";
import type { RequestHintMutation } from "../../../shared/generated/graphql";
import { REQUEST_HINT_MUTATION } from "../../../shared/gqlQueries";
import { graphqlRequest } from "../graphQlClient";

export type RequestHintResponse = NonNullable<
  RequestHintMutation["requestHint"]
>;

const requestHint = async (
  programId: string,
  gateId: string,
): Promise<RequestHintResponse> => {
  const result = await graphqlRequest(REQUEST_HINT_MUTATION, {
    programId,
    gateId,
  });
  if (!result.requestHint) {
    throw new Error("Failed to request hint.");
  }
  return result.requestHint;
};

export const useRequestHintMutation = (programId: string) => {
  return useMutation({
    mutationFn: (variables: { gateId: string }) =>
      requestHint(programId, variables.gateId),
  });
};
