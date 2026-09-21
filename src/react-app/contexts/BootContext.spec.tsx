import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { BootProvider, useBoot } from "./BootContext";

function BootProbe() {
  const { bootComplete, markBootComplete, resetBoot } = useBoot();

  return (
    <>
      <button type="button" onClick={markBootComplete} data-testid="probe">
        {bootComplete ? "complete" : "booting"}
      </button>
      <button type="button" onClick={resetBoot} data-testid="reset" />
    </>
  );
}

describe("BootContext", () => {
  it("starts incomplete inside a provider", () => {
    render(
      <BootProvider>
        <BootProbe />
      </BootProvider>,
    );

    expect(screen.getByTestId("probe")).toHaveTextContent("booting");
  });

  it("marks complete when a consumer reports boot finished", () => {
    render(
      <BootProvider>
        <BootProbe />
      </BootProvider>,
    );

    fireEvent.click(screen.getByTestId("probe"));

    expect(screen.getByTestId("probe")).toHaveTextContent("complete");
  });

  it("stays complete when reported more than once", () => {
    render(
      <BootProvider>
        <BootProbe />
      </BootProvider>,
    );

    fireEvent.click(screen.getByTestId("probe"));
    fireEvent.click(screen.getByTestId("probe"));

    expect(screen.getByTestId("probe")).toHaveTextContent("complete");
  });

  // Typed surfaces gate their mount on this flag, so a consumer rendered
  // without a provider must not be left waiting forever.
  it("reports complete with no provider above it", () => {
    render(<BootProbe />);

    expect(screen.getByTestId("probe")).toHaveTextContent("complete");
  });

  it("shares one flag across sibling consumers", () => {
    render(
      <BootProvider>
        <BootProbe />
        <BootProbe />
      </BootProvider>,
    );

    const [first, second] = screen.getAllByTestId("probe");
    expect(first).toHaveTextContent("booting");
    expect(second).toHaveTextContent("booting");

    fireEvent.click(first);

    expect(first).toHaveTextContent("complete");
    expect(second).toHaveTextContent("complete");
  });

  // The boot sequence replays when the CRT preset is cycled back to one with
  // powerOn, and the typed surfaces have to be re-gated for it.
  it("goes back to incomplete when a new boot starts", () => {
    render(
      <BootProvider>
        <BootProbe />
      </BootProvider>,
    );

    fireEvent.click(screen.getByTestId("probe"));
    expect(screen.getByTestId("probe")).toHaveTextContent("complete");

    fireEvent.click(screen.getByTestId("reset"));

    expect(screen.getByTestId("probe")).toHaveTextContent("booting");
  });

  it("can report complete again after a reset", () => {
    render(
      <BootProvider>
        <BootProbe />
      </BootProvider>,
    );

    fireEvent.click(screen.getByTestId("probe"));
    fireEvent.click(screen.getByTestId("reset"));
    fireEvent.click(screen.getByTestId("probe"));

    expect(screen.getByTestId("probe")).toHaveTextContent("complete");
  });
});
