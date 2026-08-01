# Typewriter Text Effect — Phased Implementation Plan

Retro typewriter / "terminal types it out" text rendering for Terminal Quiz.

Branch: `feat/170-typewriter-text`. Source idea: `docs/feature-ideas.md` §2.5.

---

## Overview

A `useTypewriter` hook reveals text character-by-character with a blinking block
cursor, then settles on the full string. Driven by chained `setTimeout`s, it
retypes when its input `text` changes and honors `prefers-reduced-motion`
(instant reveal). The hook is deliberately dumb — consumers pass `text`,
optional `enabled`/`speed`, and read back `{ displayed, isTyping, isDone }`.

No backend, schema, or dependency changes. Purely frontend. Every touch point
follows the existing patterns: `useShake`-style timer hook, co-located CSS
Module files, co-located `*.spec.ts` / `*.spec.tsx` tests.

---

## Phase 1 — MVP (this PR)

Scope: **gate question text** (`ActiveGate`) and the **CRT boot banner**
(`CrtOverlay`). Question typewriter is always on, independent of CRT preset.
Boot typing is naturally limited to the `full` CRT preset because the boot
layer only renders when `powerOn` is true (full preset only).

### 1.1 `useTypewriter` hook — new

`src/react-app/hooks/useTypewriter.ts`

- Signature: `useTypewriter(text: string, options?: { enabled?: boolean; speed?: number })`
- Returns: `{ displayed, isTyping, isDone }`
- Chained `setTimeout` per character, cleanup on unmount
- Reset + retype when `text` changes (new gate → question types again)
- `enabled === false` or `prefers-reduced-motion: reduce` → instant full text,
  `isTyping === false`
- Empty `text` → `isDone` immediately
- Default `speed`: ~50ms/char (tune in Phase 4)

**Tests** — `src/react-app/hooks/useTypewriter.spec.ts` (fake timers):
- empty → full reveal char-by-char
- `isTyping` true while revealing, `isDone` true after
- retypes when `text` changes
- `enabled: false` → instant full text
- reduced-motion → instant full text (stub `window.matchMedia`)
- unmount cancels pending timers

### 1.2 Question text — `ActiveGate.tsx`

- Call `useTypewriter(gate.question)`; render `displayed` in the
  `<p className="description">` node
- Append blinking block cursor span while `isTyping`
  (`aria-hidden="true"`, new `.typeCursor` class in `ActiveGate.module.css`
  with blink `@keyframes`; no blink under reduced motion)
- `aria-label={gate.question}` on the `<p>` so assistive tech reads the full
  question instead of character-by-character output

**Tests** — update `src/react-app/components/ActiveGate.spec.tsx`:
- "renders question": fake timers + advance to completion
- new: partial reveal before completion
- new: cursor present while typing, absent when done

### 1.3 CRT boot banner — `CrtOverlay.tsx`

- Replace static banner content with an internal `BootBanner` component that
  types "VT220 OK" (inverse span) then "Terminal Quiz" sequentially
- Banner completion → `setBootStage("done")`; remove the fixed 1750ms "done"
  timer, keep a safety cap (~4s) so boot cannot hang
- Reduced-motion path unchanged (jumps straight to "done")
- New `.bootTypingCursor` class in `CrtOverlay.module.css`

**Tests** — update `src/react-app/components/CrtOverlay.spec.tsx`:
- rewrite boot-timing assertions (done now driven by typing duration)
- new: banner types line 1, then line 2
- new: boot completes after typing finishes; safety cap test

### 1.4 Integration test resilience

`src/react-app/components/ProgramPlay.integration.spec.tsx`:
- bump `findByText("What is 2+2?")` / `"What is 3+3?"` waits to
  `{ timeout: 3000 }` so typing completes within the wait window

### 1.5 Verification

- `bun run test --run`
- `bun run check:code`
- `bun run check`
- `bun run test:e2e` — E2E asserts gate labels, not question text; expected safe

---

## Phase 2 — Gameplay response text

Typewriter on per-turn feedback, still gameplay-scoped:

- **Guess response messages** in `ActiveGate` — "Access Granted." / "Access
  Denied." / error messages, on the `role="status"` node (keep `aria-live`)
- **"Verifying..."** pending message — may render as spinner or typed dots
  instead of a typewriter
- **Clue text** — typed when a new clue line lands in the clues list
- **Clue button label** — skip; button labels should stay instantly readable
- **`CompletedGate`** — `successMessage` (typed on render). Question + answer
  reveal: consider typing the answer only on reveal, or leaving static — decide
  in review

Effort: small per surface. Reuses the Phase 1 hook unchanged.

---

## Phase 3 — Program-level narrative text

Longer-form text, once-per-view reveals:

- **Program name title** in `ProgramPlay`
- **"The End" heading** + completion state copy
- **`TerminalConfirmModal` message**
- **`ProgramSelector`** program list labels
- **`NavBar`**, **`LoginPage`**, **`RouteErrorFallback`** / **`ErrorBoundary`**
  message text

Note: keep list/button/menu labels static for usability; only animate
narrative/description text.

---

## Phase 4 — Settings, control, polish

- **Global toggle** — persist in `localStorage` (mirror
  `useCrtPreferences` / `terminal_quiz_crt_settings` pattern, e.g.
  `terminal_quiz_typewriter_settings`)
- **Keyboard shortcut** to toggle — mirror `Ctrl+Shift+,` hotkey pattern
- **Speed configuration** — module default today; expose setting later
- **Per-surface enable flags** — allow disabling per text surface (hook already
  takes `enabled`)
- **Accessibility review** — confirm `aria-live` regions, `aria-label` full-text
  fallbacks, reduced-motion coverage on every animated surface
- **Loading states** — "Loading Program..." / "Loading..." text; prefer the
  standalone spinner idea (`feature-ideas.md` §1.2) over typewriter there

---

## Out of scope (all phases)

- No backend / GraphQL / schema changes
- No new dependencies
- No REST endpoints
- No gate-level URLs or routing changes

---

## Surface inventory (for rollout tracking)

| Surface | File | Phase |
|---|---|---|
| Gate question text | `components/ActiveGate.tsx` | 1 |
| CRT boot banner ("VT220 OK" / "Terminal Quiz") | `components/CrtOverlay.tsx` | 1 |
| Guess response message | `components/ActiveGate.tsx` | 2 |
| "Verifying..." pending | `components/ActiveGate.tsx` | 2 |
| Clue text lines | `components/ActiveGate.tsx` | 2 |
| `CompletedGate` successMessage + answer | `components/CompletedGate.tsx` | 2 |
| Program name title | `components/ProgramPlay.tsx` | 3 |
| "The End" + completion copy | `components/ProgramPlay.tsx` | 3 |
| `TerminalConfirmModal` message | `components/TerminalConfirmModal.tsx` | 3 |
| `ProgramSelector` labels | `components/ProgramSelector.tsx` | 3 |
| `NavBar` text | `components/NavBar.tsx` | 3 |
| `LoginPage` text | `components/LoginPage.tsx` | 3 |
| Error/fallback copy | `components/RouteErrorFallback.tsx`, `ErrorBoundary.tsx` | 3 |
| Loading screens | `routes/**`, `components/ProgramPlay.tsx`, `main.tsx` | 4 (spinner, not typewriter) |
| Global toggle + hotkey + speed | settings layer (new) | 4 |

*Originally documented 2026-08-01 on `feat/170-typewriter-text`.*
