import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { mockCssModuleProxy } from "@test-utils/cssModuleMock";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("./RouteErrorFallback.module.css", () => ({
  default: mockCssModuleProxy(),
}));

import RouteErrorFallback from "./RouteErrorFallback";

describe("RouteErrorFallback", () => {
  describe("default message", () => {
    it('renders "Something went wrong." when no message prop given', () => {
      render(<RouteErrorFallback />);
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });
  });

  describe("custom message", () => {
    it("renders the provided message", () => {
      render(<RouteErrorFallback message="Custom error." />);
      expect(screen.getByText("Custom error.")).toBeInTheDocument();
    });
  });

  describe("error details", () => {
    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    it("renders details element with error message when error prop given", () => {
      const error = new Error("Network failure");
      render(<RouteErrorFallback error={error} />);
      expect(screen.getByText("Network failure")).toBeInTheDocument();
    });

    it("does not render details element when no error prop given", () => {
      render(<RouteErrorFallback />);
      expect(screen.queryByText("Error details")).not.toBeInTheDocument();
    });

    it("renders a non-Error throw as text instead of a blank details", () => {
      render(<RouteErrorFallback error="plain string failure" />);
      expect(screen.getByText("plain string failure")).toBeInTheDocument();
    });

    it.each([
      ["zero", 0, "0"],
      ["false", false, "false"],
      ["an empty string", "", ""],
      ["null", null, "null"],
      ["undefined", undefined, "undefined"],
    ])("still reports %s as an error", (_label, thrown, expected) => {
      render(<RouteErrorFallback error={thrown} />);
      expect(screen.getByText("Error details")).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith(
        "[RouteErrorFallback]",
        thrown,
      );
      if (expected !== "") {
        expect(screen.getByText(expected)).toBeInTheDocument();
      }
    });
  });

  describe("retry button", () => {
    it("renders Retry button when reset prop given", () => {
      render(<RouteErrorFallback reset={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });

    it("does not render Retry button when no reset prop given", () => {
      render(<RouteErrorFallback />);
      expect(
        screen.queryByRole("button", { name: "Retry" }),
      ).not.toBeInTheDocument();
    });

    it("calls reset on click", async () => {
      const user = userEvent.setup();
      const reset = vi.fn();
      render(<RouteErrorFallback reset={reset} />);
      await user.click(screen.getByRole("button", { name: "Retry" }));
      expect(reset).toHaveBeenCalledTimes(1);
    });
  });
});
