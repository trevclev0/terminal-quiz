import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import ProgramSelector from "@components/ProgramSelector";
import { ProgramDataContext } from "@contexts/ProgramDataContext";
import userEvent from "@testing-library/user-event";
import type { ProgramWithGates } from "../../worker/db/types";
import { defaultNullishProgramProps } from "../test-utils/testTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const programs: ProgramWithGates[] = [
  {
    ...defaultNullishProgramProps,
    id: "001c25bc-991f-41d0-81ac-4f20b3227551",
    name: "Alpha",
    isSelected: false,
    gates: [],
  },
  {
    ...defaultNullishProgramProps,
    id: "b78d14cd-f3e9-4368-90c9-e7c5d242f90e",
    name: "Beta",
    isSelected: false,
    gates: [],
  },
];

function renderWithContext(overrides: Partial<ProgramDataContext> = {}) {
  const selectProgram = vi.fn();
  const contextValue: ProgramDataContext = {
    programs,
    activeProgram: undefined,
    selectProgram,
    updateProgram: vi.fn(),
    ...overrides,
  };

  render(
    <ProgramDataContext.Provider value={contextValue}>
      <ProgramSelector />
    </ProgramDataContext.Provider>,
  );

  return { selectProgram };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("rendering", () => {
  it("renders the placeholder option", () => {
    renderWithContext();
    expect(screen.getByText("Select your program")).toBeInTheDocument();
  });

  it("renders an option for each program", () => {
    renderWithContext();
    expect(screen.getByRole("option", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Beta" })).toBeInTheDocument();
  });

  it("renders the correct number of selectable options", () => {
    renderWithContext();
    // You might think there should be placeholder + 2 programs = 3 options,
    // but the placeholder is not selectable, so subtract 1
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("renders no program options when the programs list is empty", () => {
    renderWithContext({ programs: [] });
    expect(screen.getAllByText("No programs found")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

describe("selecting a program", () => {
  it("calls selectProgram with the chosen program name", async () => {
    const user = userEvent.setup();
    const { selectProgram } = renderWithContext();

    await user.selectOptions(screen.getByRole("combobox"), "Beta");

    expect(selectProgram).toHaveBeenCalledWith("Beta");
  });

  it("calls selectProgram once per selection change", async () => {
    const user = userEvent.setup();
    const { selectProgram } = renderWithContext();

    await user.selectOptions(screen.getByRole("combobox"), "Alpha");
    await user.selectOptions(screen.getByRole("combobox"), "Beta");

    expect(selectProgram).toHaveBeenCalledTimes(2);
  });
});
