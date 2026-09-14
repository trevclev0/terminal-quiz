import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FormField from "./FormField";

describe("FormField", () => {
  it("labels the control it wraps", () => {
    render(
      <FormField label="Question">
        <input type="text" />
      </FormField>,
    );

    expect(screen.getByLabelText("Question")).toBeInTheDocument();
  });

  it("renders the label as plain text when not required", () => {
    const { container } = render(
      <FormField label="Acceptance">
        <input type="number" />
      </FormField>,
    );

    expect(screen.getByText("Acceptance")).toBeInTheDocument();
    expect(container.querySelector("span")).toBeNull();
  });

  it("wraps the label in a marker element when required", () => {
    const { container } = render(
      <FormField label="Label" required>
        <input type="text" />
      </FormField>,
    );

    const marker = container.querySelector("span");
    expect(marker).not.toBeNull();
    expect(marker).toHaveTextContent("Label");
    // The control keeps labelling, so the marker must not break association.
    expect(screen.getByLabelText("Label")).toBeInTheDocument();
  });

  it("renders helper content that follows the control", () => {
    render(
      <FormField label="Guidance Threshold">
        <input type="number" />
        <span>First clue unlocks after N failed guesses</span>
      </FormField>,
    );

    expect(
      screen.getByText("First clue unlocks after N failed guesses"),
    ).toBeInTheDocument();
  });
});
