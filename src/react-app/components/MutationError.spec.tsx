import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MutationError from "./MutationError";

describe("MutationError", () => {
  it("renders nothing when there is no error", () => {
    const { container } = render(<MutationError action="save" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the error is null", () => {
    const { container } = render(<MutationError action="save" error={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the error is an empty string", () => {
    const { container } = render(<MutationError action="save" error="" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the action and message as a single sentence", () => {
    render(<MutationError action="save" error="Update failed" />);

    expect(
      screen.getByText("Failed to save: Update failed"),
    ).toBeInTheDocument();
  });

  it("uses the action verb it is given", () => {
    render(<MutationError action="reorder" error="Reorder failed" />);

    expect(
      screen.getByText("Failed to reorder: Reorder failed"),
    ).toBeInTheDocument();
  });
});
