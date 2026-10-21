import { type RefObject, useEffect, useRef } from "react";

/**
 * Plumbing for a native `<dialog>` that is mounted to open and unmounted to
 * close. Attach the returned ref to the dialog; `getInitialFocus` picks the
 * control that receives focus once it is open. Pass `deps` for anything
 * `getInitialFocus` reads, so focus is re-chosen when it changes.
 */
export function useModalDialog(
  getInitialFocus: () => HTMLElement | null,
  deps: unknown[] = [],
): RefObject<HTMLDialogElement | null> {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const getInitialFocusRef = useRef(getInitialFocus);
  getInitialFocusRef.current = getInitialFocus;

  /*
   * Call sites dismiss this dialog by unmounting it rather than calling
   * dialog.close(), so the browser never runs its own focus restoration and a
   * keyboard user is dropped back to the document. Capture the trigger before
   * the focus effect below moves focus in, and hand it back on unmount.
   */
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    return () => {
      const trigger = triggerRef.current;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    getInitialFocusRef.current()?.focus();
    // biome-ignore lint/correctness/useExhaustiveDependencies: the caller's deps drive re-focus; the getter is read through a ref
  }, deps);

  return dialogRef;
}
