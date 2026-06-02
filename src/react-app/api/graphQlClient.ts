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

  let json: { data?: T; errors?: Array<{ message?: string }> };
  try {
    json = await response.json();
  } catch {
    throw new Error(`GraphQL request failed with HTTP ${response.status}.`);
  }

  if (!response.ok || (json.errors?.length ?? 0) > 0) {
    throw new Error(
      json.errors?.[0]?.message ||
        `GraphQL request failed with HTTP ${response.status}.`,
    );
  }

  if (json.data === undefined) {
    throw new Error("GraphQL response did not include data.");
  }

  return json.data;
};
