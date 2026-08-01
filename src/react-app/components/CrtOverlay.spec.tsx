import { act, fireEvent, render, screen } from "@testing-library/react";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CrtOverlay from "./CrtOverlay";
import styles from "./CrtOverlay.module.css";

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

const FULL_SETTINGS = {
  scanlines: true,
  glow: true,
  textGlow: true,
  chromaticAberration: true,
  flicker: true,
  powerOn: true,
};

describe("CrtOverlay", () => {
  it("renders status bar showing default preset (full)", () => {
    render(<CrtOverlay />);
    act(() => vi.advanceTimersByTime(1750));
    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: full");
  });

  it("shows hotkey hint on first visit", () => {
    render(<CrtOverlay />);
    act(() => vi.advanceTimersByTime(1750));
    expect(screen.getByTestId("crt-status")).toHaveTextContent("Ctrl+Shift+,");
  });

  it("hides hint and shows only preset after timeout", () => {
    render(<CrtOverlay />);
    act(() => vi.advanceTimersByTime(1750));
    expect(screen.getByTestId("crt-status")).toHaveTextContent("Ctrl+Shift+,");

    act(() => vi.advanceTimersByTime(3600));

    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: full");
    expect(screen.getByTestId("crt-status")).not.toHaveTextContent(
      "Ctrl+Shift+,",
    );
  });

  it("does not show hint on return visit", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    render(<CrtOverlay />);
    act(() => vi.advanceTimersByTime(1750));
    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: full");
    expect(screen.getByTestId("crt-status")).not.toHaveTextContent(
      "Ctrl+Shift+,",
    );
  });

  it("cycles preset on status bar click (descending)", () => {
    render(<CrtOverlay />);
    act(() => vi.advanceTimersByTime(1750));
    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: full");

    fireEvent.click(screen.getByTestId("crt-status"));

    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: medium");
  });

  it("renders power-on boot layer when powerOn setting is active", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-poweron")).toBeInTheDocument();
  });

  it("removes power-on layer after 1.75 seconds", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-poweron")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1750));

    expect(screen.queryByTestId("crt-poweron")).not.toBeInTheDocument();
  });

  it("shows banner then removes boot layer", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-poweron")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1100));

    expect(screen.getByText("VT220 OK")).toBeInTheDocument();
    expect(screen.getByText("Terminal Quiz")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(650));

    expect(screen.queryByTestId("crt-poweron")).not.toBeInTheDocument();
  });

  it("does not render power-on layer when powerOn is off", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: false,
        textGlow: false,
        chromaticAberration: false,
        flicker: false,
        powerOn: false,
      }),
    );
    render(<CrtOverlay />);
    expect(screen.queryByTestId("crt-poweron")).not.toBeInTheDocument();
  });

  it("does not render overlay wrapper when all effects off", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: false,
        glow: false,
        textGlow: false,
        chromaticAberration: false,
        flicker: false,
        powerOn: false,
      }),
    );
    render(<CrtOverlay />);
    expect(screen.queryByTestId("crt-overlay")).not.toBeInTheDocument();
  });

  it("renders overlay wrapper when scan lines active", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: false,
        textGlow: false,
        chromaticAberration: false,
        flicker: false,
        powerOn: false,
      }),
    );
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-overlay")).toBeInTheDocument();
  });

  it("applies text glow to document root when textGlow is on", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: true,
        textGlow: true,
        chromaticAberration: false,
        flicker: false,
        powerOn: false,
      }),
    );
    render(<CrtOverlay />);
    expect(document.documentElement.style.textShadow).toContain(
      "rgba(76,175,80,0.55)",
    );
  });

  it("applies chromatic aberration to document root when chromAb is on", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    render(<CrtOverlay />);
    expect(document.documentElement.style.textShadow).toContain(
      "rgba(255,60,60,0.18)",
    );
    expect(document.documentElement.style.textShadow).toContain(
      "rgba(60,60,255,0.18)",
    );
  });

  it("clears text shadow from document root on unmount", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: true,
        textGlow: true,
        chromaticAberration: false,
        flicker: false,
        powerOn: false,
      }),
    );
    const { unmount } = render(<CrtOverlay />);
    expect(document.documentElement.style.textShadow).toContain(
      "rgba(76,175,80,0.55)",
    );
    unmount();
    expect(document.documentElement.style.textShadow).toBe("");
  });

  it("applies heavy scanlines class for full preset", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    render(<CrtOverlay />);
    act(() => vi.advanceTimersByTime(1750));
    expect(screen.getByTestId("crt-overlay")).toHaveClass(
      styles.scanlinesHeavy,
    );
    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: full");
  });

  it("status bar has title tooltip with hotkey hint", () => {
    render(<CrtOverlay />);
    act(() => vi.advanceTimersByTime(1750));
    expect(screen.getByTestId("crt-status")).toHaveAttribute(
      "title",
      "Toggle CRT effect (Ctrl+Shift+,)",
    );
  });
});
