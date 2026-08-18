const GRAPHQL_ENDPOINT = "/api/graphql";
const SESSION_HEADER = "x-session-id";
// Constant, value-agnostic same-origin tripwire required on mutations by the
// worker's requireSessionHeader. Presence proves same-origin JS; identity is
// the server-issued session cookie (HttpOnly), never this header.
const SESSION_HEADER_VALUE = "terminal-quiz";

export const graphqlFetch = async <T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> => {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [SESSION_HEADER]: SESSION_HEADER_VALUE,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  let json: { data?: T; errors?: Array<{ message?: string }> } = {};
  try {
    const parsed: unknown = await response.json();
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      json = parsed as { data?: T; errors?: Array<{ message?: string }> };
    }
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
