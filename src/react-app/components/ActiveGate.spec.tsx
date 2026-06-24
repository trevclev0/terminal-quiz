import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { ActiveGate as ActiveGateType } from "@api/queries/useProgramProgressionQuery";
import { createRef } from "react";
import ActiveGate from "./ActiveGate";

const mockActiveGate: ActiveGateType = {
  id: "gate-1",
  label: "Gate 1",
  question: "What is 2+2?",
};

const mockChangeHandler = vi.fn();
const mockSubmitHandler = vi.fn((e: React.FormEvent) => e.preventDefault());
const mockInputRef = createRef<HTMLInputElement>();

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ActiveGate", () => {
  it("renders label", () => {
    render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message={null}
        isShaking={false}
        isPending={false}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    expect(screen.getByText("Gate 1")).toBeInTheDocument();
  });

  it("renders question", () => {
    render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message={null}
        isShaking={false}
        isPending={false}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
  });

  it("input is enabled by default", () => {
    render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message={null}
        isShaking={false}
        isPending={false}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    expect(screen.getByRole("textbox")).not.toBeDisabled();
  });

  it("input is disabled when isPending is true", () => {
    render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message={null}
        isShaking={false}
        isPending={true}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("applies .shake class when isShaking is true", () => {
    const { container } = render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message={null}
        isShaking={true}
        isPending={false}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    const gateDiv = container.querySelector("#gate-0");
    expect(gateDiv).toHaveClass("shake");
  });

  it("does not apply .shake class when isShaking is false", () => {
    const { container } = render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message={null}
        isShaking={false}
        isPending={false}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    const gateDiv = container.querySelector("#gate-0");
    expect(gateDiv).not.toHaveClass("shake");
  });

  it("renders response message with .fail class for incorrect response", () => {
    render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message="Access Denied."
        isShaking={false}
        isPending={false}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    const response = screen.getByText("Access Denied.");
    expect(response).toHaveClass("fail");
  });

  it("renders response message without .fail class for correct response", () => {
    render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message="Access Granted."
        isShaking={false}
        isPending={false}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    const response = screen.getByText("Access Granted.");
    expect(response).not.toHaveClass("fail");
  });

  it("no response message rendered when message is null", () => {
    render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message={null}
        isShaking={false}
        isPending={false}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/Access/)).not.toBeInTheDocument();
  });

  it("calls changeHandler on input change", () => {
    render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message={null}
        isShaking={false}
        isPending={false}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });
    expect(mockChangeHandler).toHaveBeenCalledTimes(1);
  });

  it("calls handleSubmit on form submit", () => {
    render(
      <ActiveGate
        id="gate-0"
        gate={mockActiveGate}
        guess=""
        message={null}
        isShaking={false}
        isPending={false}
        inputRef={mockInputRef}
        changeHandler={mockChangeHandler}
        handleSubmit={mockSubmitHandler}
      />,
    );
    const form = screen.getByRole("form");
    fireEvent.submit(form);
    expect(mockSubmitHandler).toHaveBeenCalledTimes(1);
  });
});
