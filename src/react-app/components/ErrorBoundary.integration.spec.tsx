import ErrorBoundary from "@components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Explosion!");
  return <p>Safe content</p>;
}

describe("ErrorBoundary with QueryClientProvider (production tree)", () => {
  it("catches errors thrown inside QueryClientProvider", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Bomb shouldThrow />
        </QueryClientProvider>
      </ErrorBoundary>,
    );

    expect(screen.getByText("A critical error occurred.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <ErrorBoundary fallback={<p>Custom error screen</p>}>
        <QueryClientProvider client={queryClient}>
          <Bomb shouldThrow />
        </QueryClientProvider>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error screen")).toBeInTheDocument();
    expect(
      screen.queryByText("A critical error occurred."),
    ).not.toBeInTheDocument();
  });

  it("recovers when Retry is clicked and error is resolved", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const user = userEvent.setup();

    const { rerender } = render(
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Bomb shouldThrow />
        </QueryClientProvider>
      </ErrorBoundary>,
    );

    expect(screen.getByText("A critical error occurred.")).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Bomb shouldThrow={false} />
        </QueryClientProvider>
      </ErrorBoundary>,
    );

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(screen.getByText("Safe content")).toBeInTheDocument();
    expect(
      screen.queryByText("A critical error occurred."),
    ).not.toBeInTheDocument();
  });
});
