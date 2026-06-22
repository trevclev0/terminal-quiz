// src/react-app/components/ProgramSelector.spec.tsx
import usePrograms from "@hooks/usePrograms";
import { useNavigate } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { Route } from "../routes/programs/select";
import ProgramSelector from "./ProgramSelector";

vi.mock("@hooks/usePrograms");

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("../routes/programs/select", () => ({
  Route: {
    useSearch: vi.fn(),
    fullPath: "/programs/select",
  },
}));

describe("ProgramSelector Component", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useNavigate as Mock).mockReturnValue(mockNavigate);
    (Route.useSearch as Mock).mockReturnValue({ programId: undefined });
    (usePrograms as Mock).mockReturnValue({
      programs: [
        { id: "1", name: "Program Alpha" },
        { id: "2", name: "Program Beta" },
      ],
    });
  });

  it("renders 'No programs found' when the programs array is empty", () => {
    (usePrograms as Mock).mockReturnValue({ programs: [] });
    render(<ProgramSelector />);
    expect(screen.getByText("No programs found")).toBeInTheDocument();
  });

  it("pre-selects the correct option if programId exists and is valid", () => {
    (Route.useSearch as Mock).mockReturnValue({ programId: "2" });

    render(<ProgramSelector />);

    const selectElement = screen.getByRole("combobox") as HTMLSelectElement;
    expect(selectElement.value).toBe("2");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("clears the search parameter from the URL if programId does not match any existing program", () => {
    (Route.useSearch as Mock).mockReturnValue({ programId: "ghost-id-999" });

    render(<ProgramSelector />);

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      search: {},
      replace: true,
    });
  });

  it("calls navigate with the updated search param when a new option is chosen manually", async () => {
    render(<ProgramSelector />);
    const selectElement = screen.getByRole("combobox");

    await userEvent.selectOptions(selectElement, "2");

    expect(mockNavigate).toHaveBeenCalledWith({
      search: { programId: "2" },
      replace: true,
    });
  });

  it("focuses the select element on initial mount", () => {
    render(<ProgramSelector />);
    const selectElement = screen.getByRole("combobox");
    expect(selectElement).toHaveFocus();
  });
});
