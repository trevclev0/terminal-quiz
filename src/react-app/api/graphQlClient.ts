import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import type { RequestDocument } from "graphql-request";
import { ClientError, GraphQLClient } from "graphql-request";

const SESSION_HEADER = "x-session-id";
// Constant, value-agnostic same-origin tripwire required on mutations by the
// worker's requireSessionHeader. Presence proves same-origin JS; identity is
// the server-issued session cookie (HttpOnly), never this header.
const SESSION_HEADER_VALUE = "terminal-quiz";

const GRAPHQL_ENDPOINT = new URL(
  "/api/graphql",
  globalThis.location?.origin ?? "http://localhost",
).toString();

/**
 * Shared GraphQL client. Handles transport, headers, and JSON serialization;
 * documents are TypedDocumentNode constants (typed-document-node) from
 * `src/shared/gqlQueries.ts`.
 */
export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT, {
  headers: {
    "Content-Type": "application/json",
    [SESSION_HEADER]: SESSION_HEADER_VALUE,
  },
});

/**
 * Typed GraphQL request helper. Thin wrapper over `graphqlClient` that
 * normalizes `ClientError` (whose message embeds the full request/response
 * JSON) down to the first GraphQL error message, preserving the previous
 * fetch-based contract. Network and parse errors pass through unchanged.
 */
export const graphqlRequest = async <
  TData,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(
  document: TypedDocumentNode<TData, TVariables>,
  variables?: TVariables,
): Promise<TData> => {
  try {
    const data = await graphqlClient.request<TData>(
      document as unknown as RequestDocument,
      variables,
    );
    if (data === undefined || data === null) {
      throw new Error("GraphQL response did not include data.");
    }
    return data;
  } catch (error) {
    if (error instanceof ClientError) {
      const message =
        error.response.errors?.[0]?.message ??
        `GraphQL request failed with HTTP ${error.response.status}.`;
      throw new Error(message);
    }
    throw error;
  }
};
