import type { Ai, D1Database } from "@cloudflare/workers-types";
import type { Context } from "hono";
import { vi } from "vitest";
import type { Env } from "../index";

export function createMockEnv(
  overrides: Partial<Env["Bindings"]> = {},
): Env["Bindings"] {
  return {
    DB: {} as unknown as D1Database,
    ENVIRONMENT: "development",
    ...overrides,
  };
}

export function createMockHonoContext(
  envOverrides: Partial<Env["Bindings"]> = {},
) {
  const aiRunMock = vi.fn();
  const mockAi = { run: aiRunMock } as unknown as Ai;
  const mockEnv = createMockEnv({ AI: mockAi, ...envOverrides });
  const c = { env: mockEnv } as unknown as Context;

  return { c, aiRunMock };
}
