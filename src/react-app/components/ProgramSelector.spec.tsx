import usePrograms from "@hooks/usePrograms";
import { useNavigate } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { Route } from "../routes/select";
import ProgramSelector from "./ProgramSelector";

vi.mock("@hooks/usePrograms");

vi.mock("@tanstack/react-router", () => ({
  useNavigate: vi.fn(),
}));

vi.mock("../routes/select", () => ({
  Route: {
    useSearch: vi.fn(),
    fullPath: "/select",
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
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders the dropdown with the default placeholder when no programId is in the URL", () => {
    render(<ProgramSelector />);

    const selectElement = screen.getByRole("combobox") as HTMLSelectElement;
    expect(selectElement).toBeInTheDocument();

    expect(selectElement.value).toBe("");
    expect(screen.getByText("Select your program")).toBeInTheDocument();
    expect(screen.getByText("Program Alpha")).toBeInTheDocument();
  });

  it("pre-selects the correct option if programId exists in the URL parameters", () => {
    (Route.useSearch as Mock).mockReturnValue({ programId: "2" });

    render(<ProgramSelector />);

    const selectElement = screen.getByRole("combobox") as HTMLSelectElement;
    expect(selectElement.value).toBe("2");
  });

  it("calls navigate with the updated search param when a new option is chosen", async () => {
    render(<ProgramSelector />);

    const selectElement = screen.getByRole("combobox");

    await userEvent.selectOptions(selectElement, "2");

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({
      search: { programId: "2" },
    });
  });

  it("focuses the select element on initial mount", () => {
    render(<ProgramSelector />);

    const selectElement = screen.getByRole("combobox");
    expect(selectElement).toHaveFocus();
  });
});
