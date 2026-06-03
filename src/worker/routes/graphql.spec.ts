import { type Context, Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import graphqlRoutes from "./graphql";

// Mock the dependencies your route requires
vi.mock("@hono/graphql-server", () => ({
  graphqlServer: vi.fn(
    () => (c: Context) => c.json({ data: { test: "success" } }),
  ),
}));

describe("GraphQL Route Integration", () => {
  it("responds to POST / requests", async () => {
    const app = new Hono();

    // Mount your graphql route onto a mock app just like your index.ts does
    app.route("/graphql", graphqlRoutes);

    // Send a real HTTP Request to the mock app
    const res = await app.request("/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "{ test }",
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { test: string } };

    // Verifies our middleware pipeline is correctly intercepting the request
    expect(body.data.test).toBe("success");
  });
});
