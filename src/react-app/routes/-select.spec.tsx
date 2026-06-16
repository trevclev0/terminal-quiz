import {
  createTestRouter,
  renderWithRouter,
} from "@test-utils/reactRouterUtils";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrograms = [
  { id: "1", name: "Program 1", isSelected: false, gates: [] },
  { id: "2", name: "Program 2", isSelected: false, gates: [] },
];

describe("Select Route Integration", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it("loads data via the router loader and renders the selector", async () => {
    let resolveApi!: (value: Response) => void;
    const apiPromise = new Promise<Response>((resolve) => {
      resolveApi = resolve;
    });

    vi.spyOn(globalThis, "fetch").mockReturnValueOnce(
      apiPromise as Promise<Response>,
    );
    const router = createTestRouter("/select");

    renderWithRouter(router);

    expect(await screen.findByText("Loading Programs...")).toBeInTheDocument();

    resolveApi({
      ok: true,
      json: async () => ({ data: { programs: mockPrograms } }),
    } as Response);

    await waitFor(() => {
      expect(screen.queryByText("Loading Programs...")).not.toBeInTheDocument();
    });

    const selectElement = screen.getByRole("combobox");
    expect(screen.getByText("Program 1")).toBeInTheDocument();

    await userEvent.selectOptions(selectElement, "2");
    expect((selectElement as HTMLSelectElement).value).toBe("2");
  });

  it("renders a warning when the loader returns empty programs", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { programs: [] } }),
    } as Response);

    const router = createTestRouter("/select");
    renderWithRouter(router);

    expect(await screen.findByText("No programs found")).toBeInTheDocument();
  });
});
