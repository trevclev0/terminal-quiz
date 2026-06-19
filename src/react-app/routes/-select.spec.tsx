import {
  createTestRouter,
  renderWithRouter,
} from "@test-utils/reactRouterUtils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, graphql, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const mockPrograms = [
  { id: "1", name: "Program 1" },
  { id: "2", name: "Program 2" },
];

const server = setupServer();

describe("Select Route Integration", () => {
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it("loads data via the router loader and updates the URL on selection", async () => {
    server.use(
      graphql.query("GetPrograms", async () => {
        // Automatically pause 150ms to simulate a real network call
        await delay(150);
        return HttpResponse.json({
          data: { programs: mockPrograms },
        });
      }),
    );

    const router = createTestRouter("/select");
    renderWithRouter(router);

    // Because MSW is delaying the response by 150ms, React Query will stay in
    // 'pending' state, and TanStack router will render the pendingComponent.
    expect(await screen.findByText("Loading Programs...")).toBeInTheDocument();

    // MSW eventually resolves, React Query gets the data, and the real UI renders
    await waitFor(() => {
      expect(screen.queryByText("Loading Programs...")).not.toBeInTheDocument();
    });

    const selectElement = screen.getByRole("combobox");
    expect(screen.getByText("Program 1")).toBeInTheDocument();

    await userEvent.selectOptions(selectElement, "2");
    expect((selectElement as HTMLSelectElement).value).toBe("2");
    expect(router.state.location.search.programId).toBe("2");
  });

  it("renders a warning when the loader returns empty programs", async () => {
    server.use(
      graphql.query("GetPrograms", () => {
        return HttpResponse.json({
          data: { programs: [] },
        });
      }),
    );

    const router = createTestRouter("/select");
    renderWithRouter(router);

    expect(await screen.findByText("No programs found")).toBeInTheDocument();
  });
});
