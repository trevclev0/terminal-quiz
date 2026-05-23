import { testClient } from "hono/testing";
import { describe, expect, it, vi } from "vitest";
import app, { type AppType, type Env } from "..";

const mockPrograms = [
  {
    id: "uuid-1",
    name: "Test Program 1",
    isSelected: true,
    selectedAt: null,
    completedAt: null,
    gates: [],
  },
  {
    id: "uuid-2",
    name: "Test Program 2",
    isSelected: false,
    selectedAt: null,
    completedAt: null,
    gates: [],
  },
];

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({
    query: {
      programs: {
        findMany: vi.fn().mockResolvedValue(mockPrograms),
      },
    },
  })),
}));

const mockEnv: Env["Bindings"] = {
  DB: {} as unknown as D1Database,
};

describe("Programs Router (/api/programs)", () => {
  const client = testClient<AppType>(app, mockEnv);

  it("should return a 200 status and a list of programs", async () => {
    const res = await client.api.programs.$get();

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const data = await res.json();
    expect(data).toHaveLength(2);
    expect(data).toEqual(mockPrograms);
    expect(data[1].isSelected).toBe(false);
  });
});
