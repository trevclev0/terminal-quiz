import { BootProvider, useBoot } from "@contexts/BootContext";
import { stubReducedMotion } from "@test-utils/reducedMotion";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CrtOverlay, {
  BANNER_PAUSE_MS,
  BANNER_TYPE_SPEED,
  BOOT_BANNER_MS,
} from "./CrtOverlay";
import styles from "./CrtOverlay.module.css";

const BANNER_TEXT = "VT220 OK";
const BANNER_TYPING_MS = BANNER_TEXT.length * BANNER_TYPE_SPEED;

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

// Boot is now typing-driven: `done` depends on React committing the
// `banner` stage (mounting BootBanner and scheduling the typing interval),
// then committing `bannerDone` (scheduling the pause timer). A single
// `advanceTimersByTime` call commits once at the end, so the sequence must
// be advanced in steps that each end on a commit boundary. Durations are
// derived from the component's exported timing constants so retuning the
// boot feel doesn't silently desync this helper.
function advancePastBoot() {
  // Banner stage commits, typing interval scheduled.
  act(() => vi.advanceTimersByTime(BOOT_BANNER_MS));
  // Typing done + onComplete, pause timer scheduled.
  act(() => vi.advanceTimersByTime(BANNER_TYPING_MS));
  // Pause elapses, `done` commits.
  act(() => vi.advanceTimersByTime(BANNER_PAUSE_MS));
}

describe("CrtOverlay", () => {
  it("renders status bar showing default preset (full)", () => {
    render(<CrtOverlay />);
    advancePastBoot();
    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: full");
  });

  it("shows hotkey hint on first visit", () => {
    render(<CrtOverlay />);
    advancePastBoot();
    expect(screen.getByTestId("crt-status")).toHaveTextContent("Ctrl+Shift+,");
  });

  it("hides hint and shows only preset after timeout", () => {
    render(<CrtOverlay />);
    advancePastBoot();
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
    advancePastBoot();
    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: full");
    expect(screen.getByTestId("crt-status")).not.toHaveTextContent(
      "Ctrl+Shift+,",
    );
  });

  it("cycles preset on status bar click (descending)", () => {
    render(<CrtOverlay />);
    advancePastBoot();
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

  it("removes power-on layer after banner typing and pause complete", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-poweron")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(BOOT_BANNER_MS));
    expect(screen.getByTestId("crt-poweron")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(BANNER_TYPING_MS));
    expect(screen.getByTestId("crt-poweron")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(BANNER_PAUSE_MS));

    expect(screen.queryByTestId("crt-poweron")).not.toBeInTheDocument();
  });

  it("types banner text character-by-character then removes boot layer", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    render(<CrtOverlay />);
    expect(screen.getByTestId("crt-poweron")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(BOOT_BANNER_MS));

    expect(screen.getByTestId("boot-banner-line1")).toHaveTextContent("");

    act(() => vi.advanceTimersByTime(BANNER_TYPE_SPEED));

    expect(screen.getByTestId("boot-banner-line1")).toHaveTextContent("V");
    expect(screen.queryByTestId("boot-banner-line2")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(BANNER_TYPING_MS - BANNER_TYPE_SPEED));

    expect(screen.getByTestId("boot-banner-line1")).toHaveTextContent(
      "VT220 OK",
    );
    expect(screen.getByTestId("boot-banner-line2")).toHaveTextContent(
      "Terminal Quiz",
    );

    act(() => vi.advanceTimersByTime(BANNER_PAUSE_MS));

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
    advancePastBoot();
    expect(screen.getByTestId("crt-overlay")).toHaveClass(
      styles.scanlinesHeavy,
    );
    expect(screen.getByTestId("crt-status")).toHaveTextContent("CRT: full");
  });

  it("status bar has title tooltip with hotkey hint", () => {
    render(<CrtOverlay />);
    advancePastBoot();
    expect(screen.getByTestId("crt-status")).toHaveAttribute(
      "title",
      "Toggle CRT effect (Ctrl+Shift+,)",
    );
  });
});

// CrtOverlay is the only thing that knows when the boot sequence is over.
// Typed gameplay surfaces gate their mount on the flag it reports, so every
// path into `done` — typed-out banner, power-off skip, reduced-motion skip —
// has to report, or the typing chain hangs and the player sees no question.
function BootProbe() {
  const { bootComplete } = useBoot();

  return (
    <span data-testid="boot-flag">{bootComplete ? "done" : "booting"}</span>
  );
}

function renderWithBoot() {
  return render(
    <BootProvider>
      <CrtOverlay />
      <BootProbe />
    </BootProvider>,
  );
}

describe("CrtOverlay boot reporting", () => {
  it("withholds the boot flag until the banner has typed out", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    renderWithBoot();

    expect(screen.getByTestId("boot-flag")).toHaveTextContent("booting");

    act(() => vi.advanceTimersByTime(BOOT_BANNER_MS));
    expect(screen.getByTestId("boot-flag")).toHaveTextContent("booting");

    act(() => vi.advanceTimersByTime(BANNER_TYPING_MS));
    expect(screen.getByTestId("boot-flag")).toHaveTextContent("booting");

    act(() => vi.advanceTimersByTime(BANNER_PAUSE_MS));

    expect(screen.getByTestId("boot-flag")).toHaveTextContent("done");
  });

  it("reports immediately when power-on boot is disabled", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({ ...FULL_SETTINGS, powerOn: false }),
    );
    renderWithBoot();

    expect(screen.getByTestId("boot-flag")).toHaveTextContent("done");
  });

  it("reports immediately under prefers-reduced-motion", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    stubReducedMotion(true);

    renderWithBoot();

    expect(screen.getByTestId("boot-flag")).toHaveTextContent("done");
  });

  it("reports when every CRT effect is switched off", () => {
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
    renderWithBoot();

    expect(screen.queryByTestId("crt-overlay")).not.toBeInTheDocument();
    expect(screen.getByTestId("boot-flag")).toHaveTextContent("done");
  });
});
