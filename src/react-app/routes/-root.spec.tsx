import { createTestRouter, handlers, renderWithRouter } from "@test-utils";
import { graphql, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtools: () => <div data-testid="router-devtools" />,
}));

describe("Root Route", () => {
  it("should redirect to /programs/select when no in-progress program", async () => {
    const router = createTestRouter("/");
    renderWithRouter(router);

    // Wait for redirect to complete
    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe("/programs/select");
    });
  });

  it("should redirect to /programs/:programId when in-progress program exists", async () => {
    server.use(
      graphql.query("GetInProgressProgram", () => {
        return HttpResponse.json({
          data: { getInProgressProgram: "test-program-id" },
        });
      }),
    );

    const router = createTestRouter("/");
    renderWithRouter(router);

    // Wait for redirect to complete
    await vi.waitFor(() => {
      expect(router.state.location.pathname).toBe("/programs/test-program-id");
    });
  });
});
