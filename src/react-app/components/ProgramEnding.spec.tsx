import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { stubReducedMotion } from "@test-utils/reducedMotion";
import ProgramEnding, {
  THE_END_TEXT,
  THE_END_TYPE_SPEED,
} from "./ProgramEnding";

const HEADING_TYPING_MS = THE_END_TEXT.length * THE_END_TYPE_SPEED;

const onSelectNewProgram = vi.fn();
const onPlayAgain = vi.fn();

function renderEnding(
  props: Partial<React.ComponentProps<typeof ProgramEnding>> = {},
) {
  return render(
    <ProgramEnding
      canType
      resetError={null}
      isResetting={false}
      onSelectNewProgram={onSelectNewProgram}
      onPlayAgain={onPlayAgain}
      {...props}
    />,
  );
}

// Durations come from the component's exported constants, so retuning the
// heading speed cannot silently desync this helper.
function advancePastHeading() {
  act(() => vi.advanceTimersByTime(HEADING_TYPING_MS));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("ProgramEnding", () => {
  it("types the heading rather than showing it at once", () => {
    renderEnding();

    expect(screen.getByTestId("the-end-heading")).toHaveTextContent("");

    act(() => vi.advanceTimersByTime(THE_END_TYPE_SPEED));
    expect(screen.getByTestId("the-end-heading")).toHaveTextContent("T");

    advancePastHeading();
    expect(screen.getByTestId("the-end-heading")).toHaveTextContent(
      THE_END_TEXT,
    );
  });

  it("withholds the buttons until the heading finishes", () => {
    renderEnding();

    expect(screen.queryByText("Select new program")).not.toBeInTheDocument();
    expect(screen.queryByText("Play program again")).not.toBeInTheDocument();

    advancePastHeading();

    expect(screen.getByText("Select new program")).toBeInTheDocument();
    expect(screen.getByText("Play program again")).toBeInTheDocument();
  });

  it("focuses the first button as it appears", () => {
    renderEnding();
    advancePastHeading();

    expect(screen.getByText("Select new program")).toHaveFocus();
  });

  it("holds the heading back until typing is cleared to start", () => {
    const { rerender } = renderEnding({ canType: false });

    advancePastHeading();

    expect(screen.getByTestId("the-end-heading")).toHaveTextContent("");
    expect(screen.queryByText("Select new program")).not.toBeInTheDocument();

    rerender(
      <ProgramEnding
        canType
        resetError={null}
        isResetting={false}
        onSelectNewProgram={onSelectNewProgram}
        onPlayAgain={onPlayAgain}
      />,
    );
    advancePastHeading();

    expect(screen.getByTestId("the-end-heading")).toHaveTextContent(
      THE_END_TEXT,
    );
    expect(screen.getByText("Select new program")).toBeInTheDocument();
  });

  it("keeps the heading readable to assistive tech while held back", () => {
    const { container } = renderEnding({ canType: false });

    expect(container.querySelector(".sr-only")).toHaveTextContent(THE_END_TEXT);
  });

  it("hides the animated heading node from assistive tech", () => {
    renderEnding();

    expect(screen.getByTestId("the-end-heading")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("reveals the buttons immediately under reduced motion", () => {
    stubReducedMotion();

    renderEnding();

    expect(screen.getByText("Select new program")).toBeInTheDocument();
    expect(screen.getByTestId("the-end-heading")).toHaveTextContent(
      THE_END_TEXT,
    );
  });

  it("renders a reset error alongside the heading", () => {
    renderEnding({ resetError: "Failed to reset progress." });

    expect(screen.getByText("Failed to reset progress.")).toBeInTheDocument();
  });

  it("disables both buttons while a reset is in flight", () => {
    renderEnding({ isResetting: true });
    advancePastHeading();

    expect(screen.getByText("Select new program")).toBeDisabled();
    expect(screen.getByText("Restarting...")).toBeDisabled();
  });

  it("reports button presses to its parent", () => {
    renderEnding();
    advancePastHeading();

    screen.getByText("Select new program").click();
    screen.getByText("Play program again").click();

    expect(onSelectNewProgram).toHaveBeenCalledTimes(1);
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });
});
