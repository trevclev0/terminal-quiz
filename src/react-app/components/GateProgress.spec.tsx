import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GateProgress from "./GateProgress";

describe("GateProgress", () => {
  it("renders the bar with the completed count against the total", () => {
    render(<GateProgress completed={6} total={14} />);

    // 6/14 is 42.9%, which floors to 4 of 10 cells.
    expect(screen.getByTestId("gate-progress")).toHaveTextContent(
      "PROGRESS: [####......] 6/14",
    );
  });

  it("renders an empty bar before any gate is solved", () => {
    render(<GateProgress completed={0} total={3} />);

    expect(screen.getByTestId("gate-progress")).toHaveTextContent(
      "[..........] 0/3",
    );
  });

  it("fills the bar only once every gate is solved", () => {
    const { rerender } = render(<GateProgress completed={19} total={20} />);
    expect(screen.getByTestId("gate-progress")).toHaveTextContent(
      "[#########.] 19/20",
    );

    rerender(<GateProgress completed={20} total={20} />);
    expect(screen.getByTestId("gate-progress")).toHaveTextContent(
      "[##########] 20/20",
    );
  });

  it("clamps a completed count above the total", () => {
    render(<GateProgress completed={5} total={3} />);

    expect(screen.getByTestId("gate-progress")).toHaveTextContent(
      "[##########] 3/3",
    );
  });

  it("renders nothing for a program with no gates", () => {
    const { container } = render(<GateProgress completed={0} total={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("exposes progress to assistive technology as a progressbar", () => {
    render(<GateProgress completed={2} total={5} />);

    const bar = screen.getByRole("progressbar", { name: "Program progress" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "5");
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuetext", "2 of 5 gates completed");
  });
});
