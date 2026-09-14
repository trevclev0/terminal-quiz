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

  describe("when the failure state is passed explicitly", () => {
    // Regression: these call sites previously gated on `isError`, so a failure
    // carrying an empty message still showed. graphQlClient can throw one —
    // its `??` fallback only catches a null/undefined GraphQL message.
    it("still reports a failure that carries no message", () => {
      render(<MutationError action="create" isError error="" />);

      expect(screen.getByText("Failed to create.")).toBeInTheDocument();
    });

    it("reports a failure whose message is undefined", () => {
      render(<MutationError action="reorder" isError />);

      expect(screen.getByText("Failed to reorder.")).toBeInTheDocument();
    });

    it("includes the message when there is one", () => {
      render(<MutationError action="delete" isError error="Delete failed" />);

      expect(
        screen.getByText("Failed to delete: Delete failed"),
      ).toBeInTheDocument();
    });

    it("renders nothing when it is told the mutation has not failed", () => {
      const { container } = render(
        <MutationError action="save" isError={false} error="stale message" />,
      );

      expect(container).toBeEmptyDOMElement();
    });
  });

  it("uses the action verb it is given", () => {
    render(<MutationError action="reorder" error="Reorder failed" />);

    expect(
      screen.getByText("Failed to reorder: Reorder failed"),
    ).toBeInTheDocument();
  });
});
