import useKeyboardShortcuts, {
  isTypingTarget,
} from "@hooks/useKeyboardShortcuts";
import { fireEvent, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  document.body.innerHTML = "";
});

function append<T extends HTMLElement>(el: T): T {
  document.body.appendChild(el);
  return el;
}

describe("useKeyboardShortcuts", () => {
  it("fires for lower and upper case keys", () => {
    const onKey = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "r", onKey }]));

    fireEvent.keyDown(window, { key: "r" });
    fireEvent.keyDown(window, { key: "R" });

    expect(onKey).toHaveBeenCalledTimes(2);
  });

  it("fires for ? with shift held", () => {
    const onKey = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "?", onKey }]));

    fireEvent.keyDown(window, { key: "?", shiftKey: true });

    expect(onKey).toHaveBeenCalledTimes(1);
  });

  it("prevents default on a match", () => {
    renderHook(() => useKeyboardShortcuts([{ key: "r", onKey: vi.fn() }]));

    const notCancelled = fireEvent.keyDown(window, { key: "r" });

    expect(notCancelled).toBe(false);
  });

  it("ignores other keys without preventing default", () => {
    const onKey = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "r", onKey }]));

    const notCancelled = fireEvent.keyDown(window, { key: "x" });

    expect(onKey).not.toHaveBeenCalled();
    expect(notCancelled).toBe(true);
  });

  it.each(["ctrlKey", "metaKey", "altKey"] as const)(
    "does not fire or trap the browser shortcut with %s",
    (modifier) => {
      const onKey = vi.fn();
      renderHook(() => useKeyboardShortcuts([{ key: "r", onKey }]));

      const notCancelled = fireEvent.keyDown(window, {
        key: "r",
        [modifier]: true,
      });

      expect(onKey).not.toHaveBeenCalled();
      expect(notCancelled).toBe(true);
    },
  );

  it("does not fire on key repeat", () => {
    const onKey = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "r", onKey }]));

    const notCancelled = fireEvent.keyDown(window, { key: "r", repeat: true });

    expect(onKey).not.toHaveBeenCalled();
    expect(notCancelled).toBe(true);
  });

  it.each([
    ["input", () => document.createElement("input")],
    ["textarea", () => document.createElement("textarea")],
    ["select", () => document.createElement("select")],
    [
      "contenteditable div",
      () => {
        const div = document.createElement("div");
        div.setAttribute("contenteditable", "true");
        return div;
      },
    ],
  ])("does not fire from a %s", (_name, make) => {
    const onKey = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "r", onKey }]));
    const el = append(make());

    const notCancelled = fireEvent.keyDown(el, { key: "r" });

    expect(onKey).not.toHaveBeenCalled();
    expect(notCancelled).toBe(true);
  });

  it("fires from a non-editable element", () => {
    const onKey = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: "r", onKey }]));
    const el = append(document.createElement("div"));

    fireEvent.keyDown(el, { key: "r" });

    expect(onKey).toHaveBeenCalledTimes(1);
  });

  it("skips disabled shortcuts and falls through to the next match", () => {
    const disabled = vi.fn();
    const enabled = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { key: "r", onKey: disabled, enabled: false },
        { key: "r", onKey: enabled },
      ]),
    );

    fireEvent.keyDown(window, { key: "r" });

    expect(disabled).not.toHaveBeenCalled();
    expect(enabled).toHaveBeenCalledTimes(1);
  });

  it("does not prevent default when the only match is disabled", () => {
    renderHook(() =>
      useKeyboardShortcuts([{ key: "r", onKey: vi.fn(), enabled: false }]),
    );

    expect(fireEvent.keyDown(window, { key: "r" })).toBe(true);
  });

  it("calls only the first enabled match", () => {
    const first = vi.fn();
    const second = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        { key: "r", onKey: first },
        { key: "r", onKey: second },
      ]),
    );

    fireEvent.keyDown(window, { key: "r" });

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it("uses the latest shortcuts without re-subscribing", () => {
    const add = vi.spyOn(window, "addEventListener");
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ onKey }) => useKeyboardShortcuts([{ key: "r", onKey }]),
      { initialProps: { onKey: first } },
    );

    rerender({ onKey: second });
    fireEvent.keyDown(window, { key: "r" });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(add.mock.calls.filter(([type]) => type === "keydown")).toHaveLength(
      1,
    );
  });

  it("removes the listener on unmount", () => {
    const onKey = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts([{ key: "r", onKey }]),
    );

    unmount();
    fireEvent.keyDown(window, { key: "r" });

    expect(onKey).not.toHaveBeenCalled();
  });
});

describe("isTypingTarget", () => {
  it("is false for null and non-element targets", () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(window)).toBe(false);
    expect(isTypingTarget(document)).toBe(false);
  });

  it("is true for an element nested inside a contenteditable host", () => {
    const host = document.createElement("div");
    host.setAttribute("contenteditable", "");
    const child = document.createElement("span");
    host.appendChild(child);
    append(host);

    expect(isTypingTarget(child)).toBe(true);
  });

  it("is false for a button", () => {
    expect(isTypingTarget(append(document.createElement("button")))).toBe(
      false,
    );
  });
});
