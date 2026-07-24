import {
  createTestRouter,
  handlers,
  mockCompletedGate,
  mockProgram,
  mockProgression,
  renderWithRouter,
} from "@test-utils";
import { screen, waitFor } from "@testing-library/react";
import { graphql, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const server = setupServer(
  graphql.query("GetPrograms", () =>
    HttpResponse.json({ data: { programs: [mockProgram()] } }),
  ),
  ...handlers,
);

describe("Program Play Route Integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("loads program progression data via the router loader", async () => {
    const router = createTestRouter("/programs/test-program-id");
    renderWithRouter(router);

    await waitFor(() => {
      expect(screen.getByText("Test Program")).toBeInTheDocument();
    });

    expect(screen.getByText("Gate 1")).toBeInTheDocument();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
  });

  it("renders the end state when program is completed", async () => {
    server.use(
      graphql.query("GetProgramProgression", async () => {
        return HttpResponse.json({
          data: {
            getProgramProgression: mockProgression({
              currentGate: null,
              completedGates: [mockCompletedGate()],
              status: "completed",
            }),
          },
        });
      }),
    );

    const router = createTestRouter("/programs/test-program-id");
    renderWithRouter(router);

    await waitFor(() => {
      expect(screen.getByText("The End")).toBeInTheDocument();
    });

    expect(screen.getByText("Select new program")).toBeInTheDocument();
    expect(screen.getByText("Play program again")).toBeEnabled();
  });

  it("shows error fallback when progression query returns GraphQL error", async () => {
    server.use(
      graphql.query("GetProgramProgression", () =>
        HttpResponse.json({
          errors: [{ message: "Progression fetch failed" }],
        }),
      ),
    );

    const router = createTestRouter("/programs/test-program-id");
    renderWithRouter(router);

    // Wait for loader to settle (error or success)
    await waitFor(() => {
      expect(screen.queryByText("Loading Program...")).not.toBeInTheDocument();
    });

    // Now error path should have executed, not success content
    expect(screen.queryByText("Test Program")).not.toBeInTheDocument();
    expect(screen.queryByText("Gate 1")).not.toBeInTheDocument();
  });
});
