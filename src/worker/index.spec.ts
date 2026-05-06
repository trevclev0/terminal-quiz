import { describe, expect, it, vi } from "vitest";
import app from ".";

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

const mockEnv = {
  DB: {},
  ASSETS: {
    fetch: vi.fn().mockResolvedValue(new Response("mocked static HTML")),
  },
};

describe("Main App Entry", () => {
  it("should mount the programs router at /api/programs", async () => {
    const res = await app.request("/api/programs", {}, mockEnv);

    expect(res.status).not.toBe(500);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("should mount the gates router at /api/gates", async () => {
    const res = await app.request("/api/gates/some-id", {}, mockEnv);
    expect(res.status).toBe(404);
    expect(res.headers.get("content-type")).toContain("application/json");
  });
});
