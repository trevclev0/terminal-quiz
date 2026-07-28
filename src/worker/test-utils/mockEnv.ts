import type { Ai, D1Database } from "@cloudflare/workers-types";
import type { Context } from "hono";
import { type Mock, vi } from "vitest";
import type { Env } from "..";
import type { AppGraphQLContext } from "../graphql/gameplay/types";

export function createMockEnv(
  overrides: Partial<Env["Bindings"]> = {},
): Env["Bindings"] {
  return {
    DB: {} as unknown as D1Database,
    ENVIRONMENT: "development",
    BETTER_AUTH_SECRET: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    BETTER_AUTH_URL: "http://localhost:5173",
    GOOGLE_CLIENT_ID: "test-google-client-id",
    GOOGLE_CLIENT_SECRET: "test-google-client-secret",
    GITHUB_CLIENT_ID: "test-github-client-id",
    GITHUB_CLIENT_SECRET: "test-github-client-secret",
    ...overrides,
  };
}

export function createMockHonoContext(
  envOverrides: Partial<Env["Bindings"]> = {},
): { c: Context; aiRunMock: Mock } {
  const aiRunMock = vi.fn();
  const mockAi = { run: aiRunMock } as unknown as Ai;
  const mockEnv = createMockEnv({ AI: mockAi, ...envOverrides });
  const c = { env: mockEnv } as unknown as Context;

  return { c, aiRunMock };
}

export function createMockGraphQLContext(options?: {
  db?: unknown;
  sessionId?: string;
}): AppGraphQLContext {
  const { db, sessionId } = options || {};
  return {
    get: vi.fn((key: string) => {
      if (key === "db") return db;
      if (key === "sessionId") return sessionId;
      return undefined;
    }),
  } as unknown as AppGraphQLContext;
}
