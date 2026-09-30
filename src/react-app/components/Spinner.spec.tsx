import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("is decorative: hidden from assistive technology and text-free", () => {
    render(<Spinner />);

    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveAttribute("aria-hidden", "true");
    // Glyphs come from CSS, so neighbouring text is matched exactly.
    expect(spinner).toBeEmptyDOMElement();
  });
});
