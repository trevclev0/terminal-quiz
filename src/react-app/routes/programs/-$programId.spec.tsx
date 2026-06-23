import {
  createTestRouter,
  renderWithRouter,
} from "@test-utils/reactRouterUtils";
import { screen, waitFor } from "@testing-library/react";
import { graphql, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const mockProgression = {
  currentGate: {
    id: "gate-1",
    label: "Gate 1",
    question: "What is 2+2?",
  },
  completedGates: [],
  status: "in_progress",
};

const server = setupServer();

describe("Program Play Route Integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("loads program progression data via the router loader", async () => {
    server.use(
      graphql.query("GetProgramProgression", async () => {
        return HttpResponse.json({
          data: { getProgramProgression: mockProgression },
        });
      }),
    );

    const router = createTestRouter("/programs/test-program-id");
    renderWithRouter(router);

    await waitFor(() => {
      expect(screen.getByText("test-program-id")).toBeInTheDocument();
    });

    expect(screen.getByText("Gate 1")).toBeInTheDocument();
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
  });

  it("renders the end state when program is completed", async () => {
    server.use(
      graphql.query("GetProgramProgression", async () => {
        return HttpResponse.json({
          data: {
            getProgramProgression: {
              currentGate: null,
              completedGates: [
                {
                  id: "gate-1",
                  label: "Gate 1",
                  question: "What is 2+2?",
                  correctAnswer: "4",
                  successMessage: "Correct!",
                },
              ],
              status: "completed",
            },
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
    expect(
      screen.getByTitle("Restarting isn't available yet"),
    ).toBeInTheDocument();
  });
});
