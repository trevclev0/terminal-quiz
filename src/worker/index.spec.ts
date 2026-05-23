import { testClient } from "hono/testing";
import { describe, expect, it, vi } from "vitest";
import app, { type AppType, type Env } from ".";

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({
    query: {
      programs: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      gates: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
  })),
}));

const mockEnv: Env["Bindings"] = {
  DB: {} as unknown as D1Database,
};

describe("Main App Entry", () => {
  const client = testClient<AppType>(app, mockEnv);

  it("should mount the programs router at /api/programs", async () => {
    const res = await client.api.programs.$get();

    expect(res.status).not.toBe(500);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("should mount the gates router at /api/gates", async () => {
    const res = await client.api.gates[":id"].$get({
      param: { id: "some-id" },
    });

    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});
