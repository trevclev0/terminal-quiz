import { act, fireEvent, render, screen } from "@testing-library/react";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CrtOverlay from "./CrtOverlay";

function createFakeStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const k of Object.keys(store)) delete store[k];
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createFakeStorage());
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("CrtOverlay", () => {
  it("renders status bar showing default preset", () => {
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: off");
  });

  it("shows hotkey hint on first visit", () => {
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-status")).toHaveTextContent("Ctrl+Shift+T");
  });

  it("hides hint and shows only preset after timeout", () => {
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-status")).toHaveTextContent("Ctrl+Shift+T");

    act(() => vi.advanceTimersByTime(5000));

    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: off");
    expect(screen.getByTestId("crt-status")).not.toHaveTextContent(
      "Ctrl+Shift+T",
    );
  });

  it("does not show hint on return visit", () => {
    // Simulate returning user with stored settings
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: false,
        flicker: false,
        powerOn: false,
      }),
    );
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: light");
    expect(screen.getByTestId("crt-status")).not.toHaveTextContent(
      "Ctrl+Shift+T",
    );
  });

  it("cycles preset on status bar click", () => {
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: off");

    fireEvent.click(screen.getByTestId("crt-status"));

    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: light");
  });

  it("renders power-on boot layer when powerOn setting is active", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: true,
        flicker: true,
        powerOn: true,
      }),
    );
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-poweron")).toBeInTheDocument();
  });

  it("removes power-on layer after 1 second", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: true,
        flicker: true,
        powerOn: true,
      }),
    );
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-poweron")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.queryByTestId("crt-poweron")).not.toBeInTheDocument();
  });

  it("does not render power-on layer when powerOn is off", () => {
    render(<CrtOverlay />);
    expect(screen.queryByTestId("crt-poweron")).not.toBeInTheDocument();
  });

  it("does not render overlay wrapper when all effects off", () => {
    render(<CrtOverlay />);
    expect(screen.queryByTestId("crt-overlay")).not.toBeInTheDocument();
  });

  it("renders overlay wrapper when scan lines active", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: false,
        flicker: false,
        powerOn: false,
      }),
    );
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-overlay")).toBeInTheDocument();
  });

  it("status bar has title tooltip with hotkey hint", () => {
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-status")).toHaveAttribute(
      "title",
      "Toggle CRT effect (Ctrl+Shift+T)",
    );
  });
});
