import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoadingScreen from "./LoadingScreen";

describe("LoadingScreen", () => {
  it("renders the message it is given", () => {
    render(<LoadingScreen message="Loading Editor..." />);

    expect(screen.getByText("Loading Editor...")).toBeInTheDocument();
  });

  it("falls back to a generic message", () => {
    render(<LoadingScreen />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders as a heading", () => {
    render(<LoadingScreen message="Loading Programs..." />);

    expect(
      screen.getByRole("heading", { name: "Loading Programs..." }),
    ).toBeInTheDocument();
  });
});
