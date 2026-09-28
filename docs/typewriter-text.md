# Typewriter Text Effect

**Status:** Shipped. Epic #170 (hook #205; boot banner #206; gate question
#207), then round two: latest clue #213, boot gating #214, "The End" #215.
Open: #216 (whether to bind `skip()`). Deferred ideas live in #316.

This is the decision record: the rules every typed surface follows and the
traps found while building them. For the hook's API, read
`src/react-app/hooks/useTypewriter.ts` and its spec. The phase-by-phase
plan that produced this lives in git history and the issues above.

## Surface dispositions

| Surface | Component | Disposition |
|---|---|---|
| Gate question | `ActiveGate` → `TypedQuestion` | Typed |
| Latest clue | `ActiveGate` | Typed (#213) |
| `successMessage` of the latest solved gate | `CompletedGate` → `TypedSuccessMessage` | Typed only while a next gate follows; when the program ends, the final gate's message renders static |
| "The End" heading | `ProgramEnding` → `TypedHeading` | Typed slowly once boot completes; the end buttons mount after it finishes (#215) |
| CRT boot banner (`VT220 OK`) | `CrtOverlay` → `BootBanner` | Typed |
| Guess response ("Access Granted." / "Access Denied." / errors) | `ActiveGate` | **Never.** It sits on the `role="status"` live region; animating it would fight `aria-live` announcements |
| "Verifying..." pending state | `ActiveGate` | **Spinner, not typewriter** (#311) |
| Program title, `ConfirmDialog` message | `ProgramPlay`, `ConfirmDialog` | Static |
| Labels: buttons, menus, `ProgramSelector` / `NavBar` / `LoginPage` | various | Static (see rule 1) |
| Global on/off toggle, hotkey, speed setting | none | Not built (#316) |

## Rules

1. **Labels stay static; only narrative prose animates.** Interactive
   controls must be instantly readable. This also keeps typed prose from
   feeling incoherent against the surrounding chrome.
2. **Typing never gates interaction.** The guess input, submit and clue
   buttons are usable while text types. E2E flows depend on this. The one
   deliberate exception is the "The End" buttons, which appear after the
   heading types (#215).
3. **Never two typewriters at once.** The boot banner comes first:
   `BootContext.bootComplete` (#214) holds back the *head* of the gameplay
   chain. That's the first question on a fresh start, the latest
   `successMessage` on a mid-program reload, or "The End" on a finished
   program. After that, a solved gate's `successMessage` types, then the next
   question (`ProgramPlay` derives `canTypeQuestion` from a `releasedGateId`
   set by that `CompletedGate`'s `onComplete`). Only the latest completed gate
   types, and only when another gate follows (`isLast` requires a
   `currentGate`). Earlier gates, and the final gate once the program ends,
   render static, so nothing re-types on scroll, and "The End" never races a
   `successMessage`.
4. **The hook stays content-agnostic.** String in, string out. No
   gate-, CRT- or settings-specific logic inside `useTypewriter`; `speed` and
   `startDelay` are per-call props, not globals. A future global toggle must
   *compose* with `prefers-reduced-motion` (`enabled === false ||
   reducedMotion`) and mirror `useCrtPreferences`' `localStorage` + hotkey
   pattern. It must not replace the reduced-motion check.

## Mount when active

Every typed surface is a small subcomponent that **mounts only when it is
allowed to type** (`BootBanner`, `TypedQuestion`, `TypedSuccessMessage`,
the "The End" heading). Never gate the hook with its `enabled` option:
`enabled: false` resolves to *instant full text*, so the first render
would paint the whole string for a frame, then wipe it and re-type. That
visible flash is the bug this pattern exists to prevent. It also caused a
page-refresh bug where the last gate's question showed in full, then
retyped once the `successMessage` finished.

Derive "may type now" at render time (as `canTypeQuestion` does), not by
resetting state in an effect. An effect-reset lags one frame and flashes
the same way.

## Accessibility: dual-node pattern

Each typed surface renders two nodes:

- an `aria-hidden` node carrying the animated `displayedText`, and
- a visually-hidden (`.sr-only`, global in `index.css`) sibling carrying the
  **full text at all times**.

This beats overriding `aria-label` on a single updating node, which depends on
uneven AT support for live `aria-label` changes. Screen readers get the
whole text immediately, whatever the animation state. Under
`prefers-reduced-motion: reduce` the hook returns full text on the first
render and schedules no timers. `CrtOverlay` separately skips the whole boot
sequence under reduced motion.

## Testing lessons

- **Target typed text by `data-testid`, not `getByText`.** Once typing
  finishes, both nodes hold the same text, and RTL's exact-match `getByText`
  throws "Found multiple elements". Know which node an ID sits on:
  - `gate-question` is on the **sr-only** node. It always holds the full
    question, so assertions against it need no timer advancement or
    timeout bumps.
  - `clue-text`, `success-message`, `the-end-heading` and
    `boot-banner-line1` / `-line2` are on the **animated `aria-hidden`**
    node. Use them to assert typing progress (`toHaveTextContent` under fake
    timers). Assert the final text only after typing completes.
- **`useTypewriter` is a default export**, so a `vi.mock` factory must key it
  as `default:`. A named key doesn't intercept the import, the real
  timer-driven hook runs, and fake-timer specs break.
- **Advance fake timers in commit-sized steps** across the boot sequence
  (the `advancePastBoot()` helper in `CrtOverlay.spec.tsx`). `done` depends on
  React committing `banner` (which mounts `BootBanner` and schedules typing),
  then committing `bannerDone` (which schedules the pause). A single
  `advanceTimersByTime` commits only once at the end, so the chain never
  runs. Don't use `vi.runAllTimers()` either: it also fires the first-visit
  hint timer.
- **E2E makes no assertions on typed text**, and typing never blocks
  interaction, so the suite isn't timing-coupled. If typing ever slows the
  suite noticeably, force `prefers-reduced-motion: reduce` in
  `playwright.config.ts` for CI.

## Boot banner specifics

Only the first line (`VT220 OK`) types. `Terminal Quiz` appears instantly
once it completes, because typing both lines would roughly double the banner
window. After typing, a fixed pause precedes `done`. A hard fallback timer
forces `done` if `onComplete` never fires. The timings are the exported
constants at the top of `CrtOverlay.tsx`; they're tunable by eye.

## Resolved: does per-component typing read as coherent?

This was the open checkpoint after round one: independent per-surface
typing, or one whole-screen pass like a real terminal? Round two answered it
with **sequencing** (rule 3). Each surface keeps its own subcomponent, but
only one types at a time, in reading order. Extending typing to a new
surface means slotting it into that sequence, not adding a parallel
animation.
