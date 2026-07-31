import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProgramSettingsForm from "./ProgramSettingsForm";

const copyUrl = "https://example.com/programs/prog-1";

function setup(overrides: Record<string, unknown> = {}) {
  const props = {
    programName: "Test Program",
    programVisibility: "public",
    onProgramNameChange: vi.fn(),
    onProgramVisibilityChange: vi.fn(),
    onSave: vi.fn(),
    isSaving: false,
    isUnlisted: false,
    copyUrl,
    updateError: null,
    ...overrides,
  };
  render(<ProgramSettingsForm {...props} />);
  return props;
}

function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

describe("ProgramSettingsForm", () => {
  beforeEach(() => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
  });

  it("renders name and visibility values", () => {
    setup();

    expect(screen.getByDisplayValue("Test Program")).toBeInTheDocument();
    expect(screen.getByLabelText("Visibility")).toHaveValue("public");
  });

  it("hides copy link button when program is public", () => {
    setup({ isUnlisted: false });

    expect(
      screen.queryByRole("button", { name: "Copy Link" }),
    ).not.toBeInTheDocument();
  });

  it("calls onProgramNameChange on name edit", () => {
    const { onProgramNameChange } = setup();

    fireEvent.change(screen.getByDisplayValue("Test Program"), {
      target: { value: "Renamed Program" },
    });

    expect(onProgramNameChange).toHaveBeenCalledWith("Renamed Program");
  });

  it("calls onProgramVisibilityChange on visibility change", async () => {
    const { onProgramVisibilityChange } = setup();
    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText("Visibility"), "unlisted");

    expect(onProgramVisibilityChange).toHaveBeenCalledWith("unlisted");
  });

  it("saves program metadata", async () => {
    const { onSave } = setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalled();
  });

  it("shows Saving state while saving", () => {
    setup({ isSaving: true });

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });

  it("copies the program link and shows feedback", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    setup({ isUnlisted: true });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy Link" }));
    });

    expect(writeText).toHaveBeenCalledWith(copyUrl);
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
  });

  it("shows failure feedback when copy fails", async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    setup({ isUnlisted: true });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy Link" }));
    });

    expect(screen.getByRole("button", { name: "Failed" })).toBeInTheDocument();
  });

  it("shows the update error", () => {
    setup({ updateError: "Save failed" });

    expect(screen.getByText("Failed to save: Save failed")).toBeInTheDocument();
  });
});
