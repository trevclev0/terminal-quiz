import { getSessionId } from "@utils/session";

const GRAPHQL_ENDPOINT = "/graphql";

export const graphqlFetch = async <T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": getSessionId(),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await response.json();

  if (json.errors) {
    throw new Error(
      json.errors[0].message || "An error occurred during the GraphQL request.",
    );
  }

  return json.data;
};
