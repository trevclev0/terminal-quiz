import { env, exports } from "cloudflare:workers";
import {
  GET_IN_PROGRESS_PROGRAM_QUERY,
  GET_PROGRAM_PROGRESSION_QUERY,
  RESET_SESSION_MUTATION,
  SUBMIT_GUESS_MUTATION,
} from "@shared/gqlQueries";
import { sessionProgress } from "@shared/schema";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_PATH,
} from "@worker-middleware/session";
import { invalidateCachedSchema } from "@worker-routes/graphql";
import { gqlRequest } from "@worker-test-utils/gqlRequest";
import { setupTestDb } from "@worker-test-utils/setupDb";
import { drizzle } from "drizzle-orm/d1";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@worker-graphql/gameplay/analytics", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@worker-graphql/gameplay/analytics";

const db = drizzle(env.DB);

const E2E_PROGRAM_ID = "e2e00000-0000-0000-0000-000000000001";
const E2E_GATE_1_ID = "e2e00001-0000-0000-0000-000000000001";

const TRIPWIRE_HEADER = "x-session-id";

function makeSessionId(label: string): string {
  return `session-identity-${label}-${crypto.randomUUID()}`;
}

async function insertSession(sessionId: string): Promise<void> {
  await db.insert(sessionProgress).values({
    sessionId,
    programId: E2E_PROGRAM_ID,
    currentGateId: E2E_GATE_1_ID,
    status: "in_progress",
    attemptCount: 0,
  });
}

async function rawRequest(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  return exports.default.fetch(new Request(`http://localhost${url}`, init));
}

function extractMintedId(response: Response | { setCookie: string | null }) {
  const setCookie =
    response instanceof Response
      ? response.headers.get("set-cookie")
      : response.setCookie;
  expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
  return setCookie?.split(";")[0].replace(`${SESSION_COOKIE_NAME}=`, "") ?? "";
}

describe("server-issued session identity", () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(() => {
    invalidateCachedSchema();
  });

  it("mints a session cookie and sets sessionId on first request", async () => {
    const response = await gqlRequest(GET_PROGRAM_PROGRESSION_QUERY, {
      variables: { programId: E2E_PROGRAM_ID },
    });

    expect(response.status).toBe(200);
    const mintedId = extractMintedId(response);

    const calls = vi.mocked(trackEvent).mock.calls.filter(([c]) => {
      return c.get("sessionId") === mintedId;
    });
    expect(calls.length).toBeGreaterThan(0);
  });

  it("reuses the minted id when the cookie is present — no re-mint", async () => {
    const first = await gqlRequest(GET_PROGRAM_PROGRESSION_QUERY, {
      variables: { programId: E2E_PROGRAM_ID },
    });
    const mintedId = extractMintedId(first);

    const second = await gqlRequest(GET_PROGRAM_PROGRESSION_QUERY, {
      sessionId: mintedId,
      variables: { programId: E2E_PROGRAM_ID },
    });

    expect(second.status).toBe(200);
    expect(second.setCookie).toBeNull();
  });

  it("allows a query without the x-session-id header", async () => {
    const response = await rawRequest("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: GET_PROGRAM_PROGRESSION_QUERY,
        variables: { programId: E2E_PROGRAM_ID },
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(
      `${SESSION_COOKIE_NAME}=`,
    );
  });

  it("rejects a mutation with a valid cookie but no x-session-id header", async () => {
    const sessionId = makeSessionId("no-header");
    await insertSession(sessionId);

    const response = await rawRequest("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${SESSION_COOKIE_NAME}=${sessionId}`,
      },
      body: JSON.stringify({
        query: SUBMIT_GUESS_MUTATION,
        variables: {
          programId: E2E_PROGRAM_ID,
          gateId: E2E_GATE_1_ID,
          guess: "blue",
        },
      }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors?: { message: string }[] };
    expect(body.errors?.[0]?.message).toBe(
      `Missing required ${TRIPWIRE_HEADER} header.`,
    );
    expect(
      vi.mocked(trackEvent).mock.calls.some(([, event]) => {
        return event.name === "gate_attempt";
      }),
    ).toBe(false);
  });

  it("passes a mutation with both cookie and header (control)", async () => {
    const sessionId = makeSessionId("with-header");
    await insertSession(sessionId);

    const response = await gqlRequest(SUBMIT_GUESS_MUTATION, {
      sessionId,
      variables: {
        programId: E2E_PROGRAM_ID,
        gateId: E2E_GATE_1_ID,
        guess: "blue",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
  });

  it("rejects malformed JSON and unparseable queries (fail closed)", async () => {
    const malformedJson = await rawRequest("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    expect(malformedJson.status).toBe(400);

    const badQuery = await rawRequest("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "not a valid query" }),
    });
    expect(badQuery.status).toBe(400);
  });

  it("rejects a multi-operation document without an operationName", async () => {
    const multiOp = `${GET_IN_PROGRESS_PROGRAM_QUERY}\n${RESET_SESSION_MUTATION}`;

    const response = await rawRequest("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: multiOp }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors?: { message: string }[] };
    expect(body.errors?.[0]?.message).toBe(
      "GraphQL operation could not be resolved.",
    );
  });

  it("rejects a multi-operation document even with a header", async () => {
    const multiOp = `${GET_IN_PROGRESS_PROGRAM_QUERY}\n${RESET_SESSION_MUTATION}`;

    const response = await rawRequest("/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [TRIPWIRE_HEADER]: "terminal-quiz",
      },
      body: JSON.stringify({ query: multiOp }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors?: { message: string }[] };
    expect(body.errors?.[0]?.message).toBe(
      "GraphQL operation could not be resolved.",
    );
  });

  it("rejects a mutation over GET", async () => {
    const mutation = RESET_SESSION_MUTATION.replace(/\s+/g, " ");
    const response = await rawRequest(
      `/api/graphql?query=${encodeURIComponent(mutation)}`,
      {
        method: "GET",
        headers: { [TRIPWIRE_HEADER]: "terminal-quiz" },
      },
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { errors?: { message: string }[] };
    expect(body.errors?.[0]?.message).toBe(
      "Mutations are not supported over GET.",
    );
  });

  it("allows a headerless query-less GET through (GraphiQL entry)", async () => {
    const response = await rawRequest("/api/graphql", { method: "GET" });

    expect(response.status).toBe(200);
  });

  it("sets the cookie scoped to /api with HttpOnly, Secure and SameSite=Lax", async () => {
    const response = await rawRequest("/api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: GET_IN_PROGRESS_PROGRAM_QUERY }),
    });

    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`Path=${SESSION_COOKIE_PATH}`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Secure");
  });
});
