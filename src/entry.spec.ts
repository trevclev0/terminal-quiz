import { describe, expect, it, vi } from "vitest";
import app from "./entry";

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({
    query: {
      programs: {
        findMany: vi.fn().mockResolvedValue([]),
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

describe("Main App Entry (entry.ts)", () => {
  it("should mount the programs router at /api/programs", async () => {
    const res = await app.request("/api/programs", {}, mockEnv);

    expect(res.status).not.toBe(500);
    expect(res.headers.get("content-type")).toContain("application/json");
  });

  it("should mount the gates router at /api/gates", async () => {
    const res = await app.request("/api/gates", {}, mockEnv);
    expect(res.status).not.toBe(500);
  });

  it("should fall back to the ASSETS fetcher for non-API routes", async () => {
    const req = new Request("http://localhost/");
    const res = await app.request(req, {}, mockEnv);

    expect(mockEnv.ASSETS.fetch).toHaveBeenCalledOnce();
    expect(await res.text()).toBe("mocked static HTML");
    expect(res.status).toBe(200);
  });
});
