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

describe("useCrtPreferences", () => {
  it("defaults to off preset when no stored settings", () => {
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.settings).toEqual({
      scanlines: false,
      glow: false,
      flicker: false,
      powerOn: false,
    });
    expect(result.current.presetLabel).toBe("off");
  });

  it("marks first visit when localStorage is empty", () => {
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.isFirstVisit).toBe(true);
  });

  it("does NOT mark first visit when settings exist", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: false,
        flicker: false,
        powerOn: false,
      }),
    );
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.isFirstVisit).toBe(false);
  });

  it("restores persisted settings", () => {
    localStorage.setItem(
      "terminal_quiz_crt_settings",
      JSON.stringify({
        scanlines: true,
        glow: true,
        flicker: false,
        powerOn: false,
      }),
    );
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.presetLabel).toBe("medium");
  });

  it("cycles presets in order: off -> light -> medium -> full -> off", () => {
    const { result } = renderHook(() => useCrtPreferences());
    const labels: string[] = [];
    for (let i = 0; i < 5; i++) {
      labels.push(result.current.presetLabel);
      act(() => result.current.cyclePreset());
    }
    expect(labels).toEqual(["off", "light", "medium", "full", "off"]);
  });

  it("persists settings to localStorage after cycle", () => {
    const { result } = renderHook(() => useCrtPreferences());
    act(() => result.current.cyclePreset());
    expect(result.current.presetLabel).toBe("light");
    const raw = localStorage.getItem("terminal_quiz_crt_settings");
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string);
    expect(stored).toEqual({
      scanlines: true,
      glow: false,
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
        flicker: true,
        powerOn: false,
      });
    });
    expect(result.current.presetLabel).toBe("custom");
  });

  it("responds to Ctrl+Shift+T hotkey", () => {
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.presetLabel).toBe("off");
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "t",
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        }),
      );
    });
    expect(result.current.presetLabel).toBe("light");
  });

  it("does not respond to 't' alone", () => {
    const { result } = renderHook(() => useCrtPreferences());
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "t",
          ctrlKey: false,
          shiftKey: false,
          bubbles: true,
        }),
      );
    });
    expect(result.current.presetLabel).toBe("off");
  });

  it("falls back to default when localStorage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => {
        throw new Error("unavailable");
      }),
      setItem: vi.fn(),
    });
    const { result } = renderHook(() => useCrtPreferences());
    expect(result.current.settings).toEqual({
      scanlines: false,
      glow: false,
      flicker: false,
      powerOn: false,
    });
  });
});
