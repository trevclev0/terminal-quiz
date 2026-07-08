import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TerminalConfirmModal from "./TerminalConfirmModal";

describe("TerminalConfirmModal", () => {
  it("renders the message", () => {
    render(
      <TerminalConfirmModal
        message="Are you sure?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("calls onConfirm when Confirm button is clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <TerminalConfirmModal
        message="test"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(
      <TerminalConfirmModal
        message="test"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Enter key is pressed", () => {
    const onConfirm = vi.fn();
    render(
      <TerminalConfirmModal
        message="test"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Escape key is pressed", () => {
    const onCancel = vi.fn();
    render(
      <TerminalConfirmModal
        message="test"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
