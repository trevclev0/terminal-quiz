import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { stubReducedMotion } from "@test-utils/reducedMotion";
import ProgramEnding, {
  type RunStats,
  STATS_TYPE_SPEED,
  THE_END_TEXT,
  THE_END_TYPE_SPEED,
} from "./ProgramEnding";

const HEADING_TYPING_MS = THE_END_TEXT.length * THE_END_TYPE_SPEED;

// Far longer than any readout, so a single advance types it out. The stats
// interval is already running by then, so one step is enough.
const STATS_TYPING_MS = STATS_TYPE_SPEED * 200;

const FULL_STATS: RunStats = {
  totalGuesses: 14,
  cluesUsed: 2,
  elapsedSeconds: 724,
};

const onSelectNewProgram = vi.fn();
const onPlayAgain = vi.fn();

function endingProps(
  props: Partial<React.ComponentProps<typeof ProgramEnding>> = {},
): React.ComponentProps<typeof ProgramEnding> {
  return {
    canType: true,
    resetError: null,
    isResetting: false,
    shortcutsEnabled: true,
    stats: null,
    onSelectNewProgram,
    onPlayAgain,
    ...props,
  };
}

function renderEnding(
  props: Partial<React.ComponentProps<typeof ProgramEnding>> = {},
) {
  return render(<ProgramEnding {...endingProps(props)} />);
}

// Durations come from the component's exported constants, so retuning the
// heading speed cannot silently desync this helper.
function advancePastHeading() {
  act(() => vi.advanceTimersByTime(HEADING_TYPING_MS));
}

function advancePastStats() {
  act(() => vi.advanceTimersByTime(STATS_TYPING_MS));
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

    rerender(<ProgramEnding {...endingProps()} />);
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

  describe("keyboard shortcuts", () => {
    it("plays again on R and selects a new program on N once the heading is typed", () => {
      renderEnding();
      advancePastHeading();

      fireEvent.keyDown(window, { key: "r" });
      expect(onPlayAgain).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(window, { key: "N" });
      expect(onSelectNewProgram).toHaveBeenCalledTimes(1);
    });

    it("ignores R and N before the heading finishes", () => {
      renderEnding();

      fireEvent.keyDown(window, { key: "r" });
      fireEvent.keyDown(window, { key: "n" });

      expect(onPlayAgain).not.toHaveBeenCalled();
      expect(onSelectNewProgram).not.toHaveBeenCalled();
    });

    it("ignores R and N while a reset is in flight", () => {
      renderEnding({ isResetting: true });
      advancePastHeading();

      fireEvent.keyDown(window, { key: "r" });
      fireEvent.keyDown(window, { key: "n" });

      expect(onPlayAgain).not.toHaveBeenCalled();
      expect(onSelectNewProgram).not.toHaveBeenCalled();
    });

    it("ignores R and N when the parent has shortcuts disabled", () => {
      renderEnding({ shortcutsEnabled: false });
      advancePastHeading();

      fireEvent.keyDown(window, { key: "r" });
      fireEvent.keyDown(window, { key: "n" });

      expect(onPlayAgain).not.toHaveBeenCalled();
      expect(onSelectNewProgram).not.toHaveBeenCalled();
    });

    it("leaves Ctrl+R to the browser", () => {
      renderEnding();
      advancePastHeading();

      fireEvent.keyDown(window, { key: "r", ctrlKey: true });

      expect(onPlayAgain).not.toHaveBeenCalled();
    });
  });

  describe("run stats", () => {
    it("types stats after the heading", () => {
      renderEnding({ stats: FULL_STATS });

      expect(screen.queryByTestId("run-stats")).not.toBeInTheDocument();

      advancePastHeading();
      const typed = screen.getByTestId("run-stats-typed");
      expect(typed).toHaveAttribute("aria-hidden", "true");
      expect(typed).not.toHaveTextContent("12m 04s");

      advancePastStats();
      const readout = screen.getByTestId("run-stats");
      expect(readout.querySelector(".sr-only")).toHaveTextContent("guesses 14");
      expect(readout.querySelector(".sr-only")).toHaveTextContent(
        "hints used 2",
      );
      expect(readout.querySelector(".sr-only")).toHaveTextContent(
        "time 12m 04s",
      );
      expect(typed).toHaveTextContent(/guesses\s\.+\s14/);
      expect(typed).toHaveTextContent(/hints used\s\.+\s2/);
      expect(typed).toHaveTextContent(/time\s\.+\s12m 04s/);
    });

    it("keeps every leader line the same width", () => {
      renderEnding({ stats: FULL_STATS });
      advancePastHeading();
      advancePastStats();

      const lines = screen
        .getByTestId("run-stats-typed")
        .textContent?.split("\n");
      expect(lines).toHaveLength(3);
      expect(new Set(lines?.map((line) => line.length)).size).toBe(1);
    });

    it("gives the buttons focus without waiting for stats to type", () => {
      renderEnding({ stats: FULL_STATS });
      advancePastHeading();

      expect(screen.getByTestId("run-stats-typed")).not.toHaveTextContent(
        "12m 04s",
      );
      expect(screen.getByText("Select new program")).toBeInTheDocument();
      expect(screen.getByText("Select new program")).toHaveFocus();
    });

    it("omits guesses and time when untracked", () => {
      renderEnding({
        stats: { totalGuesses: null, cluesUsed: 1, elapsedSeconds: null },
      });
      advancePastHeading();
      advancePastStats();

      const readout = screen.getByTestId("run-stats");
      expect(readout).toHaveTextContent("hints used 1");
      expect(readout).not.toHaveTextContent("guesses");
      expect(readout).not.toHaveTextContent("time");
      expect(readout).not.toHaveTextContent("0");
    });

    it("renders no stats block when stats is null", () => {
      renderEnding({ stats: null });
      advancePastHeading();
      advancePastStats();

      expect(screen.queryByTestId("run-stats")).not.toBeInTheDocument();
      expect(screen.getByText("Select new program")).toBeInTheDocument();
    });

    it("shows stats that arrive after the heading finished", () => {
      const { rerender } = renderEnding({ stats: null });
      advancePastHeading();
      expect(screen.queryByTestId("run-stats")).not.toBeInTheDocument();

      rerender(<ProgramEnding {...endingProps({ stats: FULL_STATS })} />);
      advancePastStats();

      expect(screen.getByTestId("run-stats-typed")).toHaveTextContent(
        /time\s\.+\s12m 04s/,
      );
    });

    it("shows stats instantly under reduced motion", () => {
      stubReducedMotion();

      renderEnding({ stats: FULL_STATS });

      expect(screen.getByTestId("run-stats-typed")).toHaveTextContent(
        /time\s\.+\s12m 04s/,
      );
    });
  });
});
