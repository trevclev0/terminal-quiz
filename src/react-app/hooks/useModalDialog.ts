import { type RefObject, useEffect, useRef } from "react";

/**
 * Plumbing for a native `<dialog>` that is mounted to open and unmounted to
 * close. Attach the returned ref to the dialog; `getInitialFocus` picks the
 * control that receives focus once it is open. Pass `deps` for anything
 * `getInitialFocus` reads, so focus is re-chosen when it changes.
 */
export function useModalDialog(
  getInitialFocus: () => HTMLElement | null,
  // Stryker disable next-line ArrayDeclaration: a constant default dep never changes, so it behaves like []
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
   *
   * Capture only once per instance: StrictMode re-runs this effect after the
   * dialog has taken focus, and a second capture would record the dialog's own
   * control (its simulated cleanup cannot refocus the trigger while the page
   * behind the modal is inert).
   */
  // Stryker disable ArrayDeclaration: the effect's constant [] deps never change, so any constant array is equivalent
  useEffect(() => {
    triggerRef.current ??= document.activeElement as HTMLElement | null;
    return () => {
      const trigger = triggerRef.current;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  // Stryker restore ArrayDeclaration

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
