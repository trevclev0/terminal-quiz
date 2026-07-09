import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import TerminalConfirmModal from "./TerminalConfirmModal";

describe("TerminalConfirmModal", () => {
  it("renders the message", () => {
    render(
      <TerminalConfirmModal
        message="Are you sure?"
        onConfirm={vi.fn()}
        onKeepProgress={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("calls onConfirm when Reset Progress button is clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <TerminalConfirmModal
        message="test"
        onConfirm={onConfirm}
        onKeepProgress={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Reset Progress"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onKeepProgress when Keep Progress button is clicked", async () => {
    const onKeepProgress = vi.fn();
    render(
      <TerminalConfirmModal
        message="test"
        onConfirm={vi.fn()}
        onKeepProgress={onKeepProgress}
        onCancel={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Keep Progress"));
    expect(onKeepProgress).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Enter key is pressed", async () => {
    const onConfirm = vi.fn();
    render(
      <TerminalConfirmModal
        message="test"
        onConfirm={onConfirm}
        onKeepProgress={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    // Confirm button is auto-focused, so Enter triggers a click
    await userEvent.keyboard("{Enter}");
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Escape key is pressed", async () => {
    const onCancel = vi.fn();
    render(
      <TerminalConfirmModal
        message="test"
        onConfirm={vi.fn()}
        onKeepProgress={vi.fn()}
        onCancel={onCancel}
      />,
    );
    // Escape triggers the cancel event on the dialog
    const dialog = screen.getByRole("dialog");
    fireEvent(dialog, new Event("cancel", { bubbles: true, cancelable: true }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
