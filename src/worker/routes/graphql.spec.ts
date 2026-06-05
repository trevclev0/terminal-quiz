import { type Context, Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Env } from "..";
import { setupDb } from "../middleware/db";
import { invalidateCachedSchema } from "./graphql";

vi.mock("@hono/graphql-server", () => ({
  graphqlServer: vi.fn(
    () => (c: Context) => c.json({ data: { test: "success" } }),
  ),
}));

vi.mock("drizzle-graphql", () => ({
  buildSchema: vi.fn(() => ({
    entities: { queries: {}, mutations: {}, types: {}, inputs: {} },
  })),
}));

vi.mock("drizzle-orm/d1", () => ({
  drizzle: vi.fn(() => ({})),
}));

const mockEnv: Env["Bindings"] = {
  DB: {} as unknown as D1Database,
  ENVIRONMENT: "development",
};

describe("GraphQL Route Integration", () => {
  beforeEach(() => {
    invalidateCachedSchema();
  });

  it("responds to POST / requests", async () => {
    const app = new Hono<Env>().use("*", setupDb);

    const graphqlRoutes = (await import("./graphql")).default;
    app.route("/graphql", graphqlRoutes);

    const res = await app.request(
      "/graphql",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "{ test }",
        }),
      },
      mockEnv,
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { test: string } };

    expect(body.data.test).toBe("success");
  });
});
