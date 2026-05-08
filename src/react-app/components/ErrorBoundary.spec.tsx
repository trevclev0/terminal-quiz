import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import ErrorBoundary from "@components/ErrorBoundary";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Suppress the expected console.error output from React's error boundary machinery
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper — a component that conditionally throws
// ---------------------------------------------------------------------------

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Explosion!");
  return <p>Safe content</p>;
}

// ---------------------------------------------------------------------------
// Normal (no error) rendering
// ---------------------------------------------------------------------------

describe("when no child throws", () => {
  it("renders children normally", () => {
    render(
      <ErrorBoundary>
        <p>Hello</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Error state — default fallback
// ---------------------------------------------------------------------------

describe("when a child throws and no fallback prop is given", () => {
  it("renders the built-in error UI", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("A critical error occurred.")).toBeInTheDocument();
  });

  it("renders a Retry button", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("does not render the children", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.queryByText("Safe content")).not.toBeInTheDocument();
  });

  it("logs the error via console.error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(console.error).toHaveBeenCalledWith(
      "[ErrorBoundary]",
      expect.any(Error),
      expect.any(String),
    );
  });
});

// ---------------------------------------------------------------------------
// Error state — custom fallback prop
// ---------------------------------------------------------------------------

describe("when a child throws and a fallback prop is provided", () => {
  it("renders the custom fallback instead of the built-in UI", () => {
    render(
      <ErrorBoundary fallback={<p>Custom fallback</p>}>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Custom fallback")).toBeInTheDocument();
    expect(
      screen.queryByText("A critical error occurred."),
    ).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Reset behaviour
// ---------------------------------------------------------------------------

describe("reset via Retry button", () => {
  it("clears the error state and re-renders children when the child no longer throws", async () => {
    const user = userEvent.setup();

    // A simpler, more deterministic approach: render a controlled version
    // where we can flip shouldThrow before clicking Retry
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText("A critical error occurred.")).toBeInTheDocument();

    // Re-render with a non-throwing child before clicking Retry
    rerender(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByText("Safe content")).toBeInTheDocument();
    expect(
      screen.queryByText("A critical error occurred."),
    ).not.toBeInTheDocument();
  });
});
