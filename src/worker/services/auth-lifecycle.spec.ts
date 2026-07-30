import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("better-auth", () => ({
  betterAuth: vi.fn(() => ({})),
}));

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: vi.fn(() => ({})),
}));

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({})),
}));

import { clearAuthInstance, getAuth } from "./auth";

function createMockContext(envOverrides: Record<string, unknown> = {}) {
  const env = {
    ENVIRONMENT: "development",
    BETTER_AUTH_SECRET: "super-secret-key-that-is-32-chars!",
    BETTER_AUTH_URL: "http://localhost:5173",
    DB: {},
    ...envOverrides,
  };
  return { env, set: vi.fn() };
}

describe("auth lifecycle", () => {
  beforeEach(() => {
    clearAuthInstance();
  });

  it("throws on missing BETTER_AUTH_SECRET", () => {
    const c = createMockContext({ BETTER_AUTH_SECRET: undefined });
    expect(() => getAuth(c as never)).toThrow(
      "Missing required auth binding: BETTER_AUTH_SECRET",
    );
  });

  it("throws on missing BETTER_AUTH_URL", () => {
    const c = createMockContext({ BETTER_AUTH_URL: undefined });
    expect(() => getAuth(c as never)).toThrow(
      "Missing required auth binding: BETTER_AUTH_URL",
    );
  });

  it("throws on missing OAuth keys in production", () => {
    const c = createMockContext({ ENVIRONMENT: "production" });
    expect(() => getAuth(c as never)).toThrow(
      "Missing required auth binding: GOOGLE_CLIENT_ID",
    );
  });

  it("throws on short BETTER_AUTH_SECRET in production", () => {
    const c = createMockContext({
      ENVIRONMENT: "production",
      GOOGLE_CLIENT_ID: "google-id",
      GOOGLE_CLIENT_SECRET: "google-secret",
      GITHUB_CLIENT_ID: "github-id",
      GITHUB_CLIENT_SECRET: "github-secret",
      BETTER_AUTH_SECRET: "short",
    });
    expect(() => getAuth(c as never)).toThrow(
      "BETTER_AUTH_SECRET must be at least 32 characters",
    );
  });

  it("skips OAuth key validation in non-production", () => {
    const c = createMockContext();
    expect(() => getAuth(c as never)).not.toThrow();
  });

  it("returns auth instance on success", () => {
    const c = createMockContext();
    const auth = getAuth(c as never);
    expect(auth).toBeDefined();
  });

  it("returns cached instance on subsequent calls", () => {
    const c = createMockContext();
    const first = getAuth(c as never);
    const second = getAuth(c as never);
    expect(first).toBe(second);
  });

  it("creates new instance after clearAuthInstance", () => {
    const c = createMockContext();
    const first = getAuth(c as never);
    clearAuthInstance();
    const second = getAuth(c as never);
    expect(first).not.toBe(second);
  });
});
