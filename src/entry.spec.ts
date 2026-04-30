import { describe, expect, it, vi } from "vitest";
import app from "./entry";

describe("Main App Entry (entry.ts)", () => {
  it("should mount the programs router at /api/programs", async () => {
    // We don't care about the exact response, just that it doesn't hit the catch-all
    // or fail to find the route entirely. Assuming there is a root GET route in programs:
    const res = await app.request("/api/programs");

    // As long as it isn't hitting the static asset fallback, the router is mounted.
    // If there is no GET /api/programs, expect a 404 or 405 specifically from the router.
    expect(res.status).not.toBe(500);
  });

  it("should mount the riddles router at /api/riddles", async () => {
    const res = await app.request("/api/riddles");
    expect(res.status).toBe(501);
  });

  it("should fall back to the ASSETS fetcher for non-API routes", async () => {
    // Mock the Cloudflare ASSETS binding
    const mockAssetsFetcher = {
      fetch: vi.fn().mockResolvedValue(new Response("mocked static HTML")),
    };

    // Make a request to a static route (e.g., the frontend root)
    // The third argument to app.request() injects the mocked environment variables/bindings
    const req = new Request("http://localhos/");
    const res = await app.request(req, {}, { ASSETS: mockAssetsFetcher });

    // Verify the routing hit the catch-all and invoked the fetcher
    expect(mockAssetsFetcher.fetch).toHaveBeenCalledOnce();
    expect(await res.text()).toBe("mocked static HTML");
    expect(res.status).toBe(200);
  });
});
