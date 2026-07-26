import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useCrtPreferences from "./useCrtPreferences";

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
});

afterEach(() => {
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

describe("useCrtPreferences", () => {
  it("defaults to full preset when no stored settings", () => {
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.settings).toEqual(FULL_SETTINGS);
    expect(result.current.presetLabel).toBe("full");
  });

  it("marks first visit when localStorage is empty", () => {
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.isFirstVisit).toBe(true);
  });

  it("does NOT mark first visit when settings exist", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify(FULL_SETTINGS),
    );
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.isFirstVisit).toBe(false);
  });

  it("normalizes stored settings missing new fields", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: true,
        textGlow: true,
        flicker: true,
        powerOn: true,
      }),
    );
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.settings.chromaticAberration).toBe(false);
  });

  it("restores persisted settings", () => {
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
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.presetLabel).toBe("medium");
  });

  it("cycles presets in descending order: full -> medium -> light -> off -> full", () => {
    const { result } = renderHook(() => useCrtPreferences());
    // Start at full (default)
    expect(result.current.presetLabel).toBe("full");
    act(() => result.current.cyclePreset());
    expect(result.current.presetLabel).toBe("medium");
    act(() => result.current.cyclePreset());
    expect(result.current.presetLabel).toBe("light");
    act(() => result.current.cyclePreset());
    expect(result.current.presetLabel).toBe("off");
    act(() => result.current.cyclePreset());
    expect(result.current.presetLabel).toBe("full");
  });

  it("full preset has all effects enabled", () => {
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.settings).toEqual(FULL_SETTINGS);
  });

  it("persists settings to localStorage after cycle", () => {
    const { result } = renderHook(() => useCrtPreferences());
    // Start at full, cycle to medium
    act(() => result.current.cyclePreset());
    expect(result.current.presetLabel).toBe("medium");
    const raw = localStorage.getItem("terminal_quiz_crt_settings");
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string);
    expect(stored).toEqual({
      scanlines: true,
      glow: true,
      textGlow: true,
      chromaticAberration: false,
      flicker: false,
      powerOn: false,
    });
  });

  it("label is 'custom' when settings don't match any preset", () => {
    const { result } = renderHook(() => useCrtPreferences());
    act(() => {
      result.current.setSettings({
        scanlines: true,
        glow: false,
        textGlow: false,
        chromaticAberration: false,
        flicker: true,
        powerOn: false,
      });
    });
    expect(result.current.presetLabel).toBe("custom");
  });

  it("responds to Ctrl+Shift+, hotkey", () => {
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.presetLabel).toBe("full");
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Comma",
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    // Should cycle down to medium
    expect(result.current.presetLabel).toBe("medium");
  });

  it("does not respond to comma alone without modifiers", () => {
    const { result } = renderHook(() => useCrtPreferences());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          code: "Comma",
          ctrlKey: false,
          shiftKey: false,
          bubbles: true,
        }),
      );
    });
    expect(result.current.presetLabel).toBe("full");
  });

  it("falls back to full default when localStorage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => {
        throw new Error("unavailable");
      }),
      setItem: vi.fn(),
    });
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.settings).toEqual(FULL_SETTINGS);
  });
});
