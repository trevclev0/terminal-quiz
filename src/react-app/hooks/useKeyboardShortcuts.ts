import { useEffect, useRef } from "react";

export type KeyboardShortcut = {
  /** Compared to `event.key.toLowerCase()`, e.g. "?", "r", "n". */
  key: string;
  onKey: () => void;
  enabled?: boolean;
};

const EDITABLE_HOST_SELECTOR = '[contenteditable=""], [contenteditable="true"]';

export function isTypingTarget(target: EventTarget | null): boolean {
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  ) {
    return true;
  }
  if (!(target instanceof HTMLElement)) return false;
  // happy-dom does not derive isContentEditable from the attribute, so also
  // look for an editable host.
  return (
    target.isContentEditable || target.closest(EDITABLE_HOST_SELECTOR) !== null
  );
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]): void {
  // Read through a ref so callers can pass inline arrays without the
  // listener re-subscribing on every render.
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Ignoring these (and never calling preventDefault) keeps browser
      // shortcuts such as Ctrl+R working.
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat)
        return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const match = shortcutsRef.current.find(
        (shortcut) => shortcut.enabled !== false && shortcut.key === key,
      );
      if (!match) return;

      event.preventDefault();
      match.onKey();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
