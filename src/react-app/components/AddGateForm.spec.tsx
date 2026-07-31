import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AddGateForm from "./AddGateForm";
import type { NewGateForm } from "./manageEditorTypes";

const emptyNewGate: NewGateForm = {
  label: "",
  question: "",
  correctAnswer: "",
  successMessage: "",
};

function setup(overrides: Record<string, unknown> = {}) {
  const props = {
    newGate: emptyNewGate,
    onNewGateChange: vi.fn(),
    onSubmit: vi.fn(),
    isPending: false,
    createError: null,
    ...overrides,
  };
  render(<AddGateForm {...props} />);
  return props;
}

describe("AddGateForm", () => {
  it("renders the four gate fields", () => {
    setup();

    const form = screen.getByRole("form", { name: "Add Gate" });
    expect(within(form).getByLabelText("Label")).toBeInTheDocument();
    expect(within(form).getByLabelText("Question")).toBeInTheDocument();
    expect(within(form).getByLabelText("Correct Answer")).toBeInTheDocument();
    expect(within(form).getByLabelText("Success Message")).toBeInTheDocument();
  });

  it("calls onNewGateChange with a patch on edit", () => {
    const { onNewGateChange } = setup();

    fireEvent.change(screen.getByLabelText("Label"), {
      target: { value: "New Gate" },
    });

    expect(onNewGateChange).toHaveBeenCalledWith({ label: "New Gate" });
  });

  it("submits the form", async () => {
    const { onSubmit } = setup({
      newGate: {
        label: "New Gate",
        question: "Q?",
        correctAnswer: "A",
        successMessage: "OK",
      },
    });
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Add Gate" }));

    expect(onSubmit).toHaveBeenCalled();
  });

  it("disables submit while the label is empty", () => {
    setup();

    expect(screen.getByRole("button", { name: "Add Gate" })).toBeDisabled();
  });

  it("disables inputs and shows Adding label while pending", () => {
    setup({
      newGate: { ...emptyNewGate, label: "New Gate" },
      isPending: true,
    });

    expect(screen.getByLabelText("Label")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adding..." })).toBeDisabled();
  });

  it("shows the create error", () => {
    setup({ createError: "Create failed" });

    expect(
      screen.getByText("Failed to add: Create failed"),
    ).toBeInTheDocument();
  });
});
