# Typewriter Text Effect — Implementation Plan

**Status:** Proposed (merged from two independently drafted plans — see
"Provenance" below)
**Origin:** `docs/feature-ideas.md` §2.5 ("Typewriter Text Effect")
**Owner:** TBD

## Goal

Add a character-by-character text reveal effect, starting with gameplay
question text and the CRT boot banner, built on a single reusable hook so
later expansion (nav, buttons, dropdowns, response text, narrative copy) is
additive rather than a rewrite.

## Scope decision (deliberate — see conversation history)

Scope is being held **tight to gate question text + boot banner only** for
this round. A companion plan (`feat/170-typewriter-text` branch) proposed a
larger Phase 2–4 rollout (response messages, clue text, program titles, nav,
settings toggle). That scope is **explicitly deferred, not rejected** —
we don't yet know how the effect *feels* in practice, and per the team
discussion, watching Phase 1 land in the two target surfaces first will
tell us whether per-component typing reads as a coherent aesthetic or
whether it needs a different (e.g. whole-screen-sequenced) approach before
expanding further. Expanding scope now, before that signal exists, risks
building toward the wrong shape.

## Non-goals (this plan)

- Applying typewriter effect to nav links, buttons, dropdowns, response
  messages, clue text, program titles, or any UI outside gate question text
  and the CRT boot banner. The hook is designed to support this later, but
  no components outside Phase 1/2 are touched in this round.
- A global typewriter enable/disable settings toggle or keyboard shortcut —
  deferred alongside the rest of the broader rollout.
- Sound effects (tick/click per character) — out of scope, could be a
  follow-up once `docs/feature-ideas.md` §4.4 (Sound Effects) exists.
- Configurable typing speed exposed to end users (e.g. a settings toggle) —
  speed is a prop for the component author, not a user-facing setting.

## Provenance

This document merges two independently drafted plans for the same feature:

1. This plan (hook-first, Phase 0/1/2/3 structure, PR-splitting emphasis)
2. A companion plan on `feat/170-typewriter-text` (broader phased rollout,
   stronger accessibility/safety detail in its Phase 1)

The merge keeps this plan's phase structure and PR-splitting approach (Phase
0 isolation, `skip()` escape hatch) and folds in the companion plan's
accessibility, safety-cap, and test-resilience detail. The companion plan's
Phase 2–4 scope (response text, narrative text, settings/hotkey layer) is
captured in "Deferred scope" below for future reference, not built now.

---

## Architecture

### New primitive: `useTypewriter`

**File:** `src/react-app/hooks/useTypewriter.ts`

```ts
type TypewriterOptions = {
  enabled?: boolean;     // false -> instant full text, default true
  speed?: number;        // ms per character, default 30
  startDelay?: number;   // ms before typing begins, default 0
  onComplete?: () => void;
};

type TypewriterResult = {
  displayedText: string;
  isComplete: boolean;
  skip: () => void;      // jump to full text instantly
};

function useTypewriter(text: string, options?: TypewriterOptions): TypewriterResult;
```

Behavior:
- On mount, and whenever `text` changes, resets and re-types from empty.
- Respects `prefers-reduced-motion: reduce` — when set, `displayedText` is
  `text` immediately, `isComplete` is `true` on the first render, no timers
  are scheduled. Follow the existing pattern in `useCrtPreferences`/
  `CrtOverlay.tsx` (`window.matchMedia("(prefers-reduced-motion: reduce)")`).
- `enabled: false` behaves identically to reduced-motion — instant full
  text, no timers, `isComplete` immediately. Compose the two checks as
  `enabled === false || reducedMotion` so a future settings toggle (see
  "Deferred scope") can layer on top without another API change.
  Consumers needing a per-surface override pass `enabled` explicitly;
  `useTypewriter` itself never reads a global setting.
- `skip()` immediately sets `displayedText` to the full `text` and fires
  `onComplete` if not already fired. Exposed so callers can bind it to a
  click/keypress ("skip to end") — expected UX for typewriter effects.
- `onComplete` fires exactly once per `text` value (guard against
  double-fire from a `skip()` call after natural completion, and from
  StrictMode double-invocation in dev).
- Cleans up its interval/timeout on unmount and on `text` change (mirrors
  `useShake`'s `clearTimeout` cleanup pattern).

### Testing the hook

**File:** `src/react-app/hooks/useTypewriter.spec.ts`

Use `vi.useFakeTimers()` + `renderHook`, following `useShake.spec.ts` and
`useProgressionScroll.spec.ts` as the house style. Cases to cover:

- starts with empty `displayedText`, `isComplete: false`
- advances one character per `speed` ms
- reaches full text and sets `isComplete: true`
- calls `onComplete` exactly once
- `skip()` jumps to full text immediately and sets `isComplete: true`
- `skip()` before typing finishes does not double-fire `onComplete`
- changing `text` mid-type resets and retypes the new value
- `startDelay` delays the first character
- reduced-motion: mock `window.matchMedia` to return `matches: true`;
  assert `displayedText === text` and `isComplete === true` synchronously,
  no timers scheduled (assert via `vi.getTimerCount() === 0` or similar)
- `enabled: false`: same synchronous behavior as reduced-motion (instant
  full text, no timers scheduled)

This spec is required before either Phase 1 or Phase 2 can land, since both
depend on it.

---

## Phase 1 — Gameplay question text

**Scope:** `ActiveGate.tsx` question text only. `CompletedGate.tsx` is
explicitly excluded — a solved gate's question re-typing every time it
scrolls into view (e.g. after `useProgressionScroll` fires) would be
distracting, not delightful.

### 1a. Wire the hook into `ActiveGate`

- Import `useTypewriter` in `src/react-app/components/ActiveGate.tsx`.
- Replace the static `<p className="description">{gate.question}</p>` with
  an `aria-hidden` `<p className="description">{displayedText}</p>` plus a
  visually-hidden full-text span (see 1c), where `displayedText` comes from
  `useTypewriter(gate.question)`.
- **Interactivity is never gated on typing completion.** The password
  input, submit, and clue button all remain immediately usable regardless
  of `isComplete`. This preserves existing E2E timing
  (`GamePage.waitForLoad`, `submitAnswer`, etc. in `e2e/pages/gamePage.ts`)
  and avoids adding artificial friction for repeat players.
- Do not gate the shake animation, response message, or clue list on the
  typewriter state — those are unrelated to question-reveal timing.

### 1b. Reset behavior on gate change

`useProgramPlay.ts` already has an effect that clears `message`, `clues`,
etc. when `currentGateId` changes. The typewriter hook resets on its own
(driven by `text` prop change via `gate.question`), so **no changes are
needed in `useProgramPlay.ts`** — the hook's internal `text`-change reset
handles this automatically since `ActiveGate` receives a new `gate.question`
on gate transitions.

### 1c. Accessibility

The animated `<p>` should be hidden from assistive tech, and the complete
question delivered once via a visually-hidden sibling — **not** `aria-label`
on the `<p>`. `aria-label` on a plain paragraph is unreliably exposed as an
accessible name across screen readers, and it would not mask the
character-by-character content from a virtual cursor anyway. Pattern:

- Render the animated output in
  `<p className="description" aria-hidden="true">{displayedText}</p>` so
  assistive tech never reads it filling in char-by-char.
- Immediately after it, render a visually-hidden sibling:
  `<span className="sr-only">{gate.question}</span>`, always holding the
  full string (not swapped in on completion), so the complete question is
  announced once, up front.
- `.sr-only` does not exist in the codebase yet (verified 2026-08-03) —
  add the standard utility class to `src/react-app/index.css` (global
  stylesheet): visually clipped, 1px, `clip-path`, `white-space: nowrap`,
  `position: absolute`. Standard SR-only recipe, no third-party dependency.
- The existing `role="status"` / `aria-live="polite"` response-message node
  in `ActiveGate` is untouched by this phase (response text isn't
  typewritten yet — see "Deferred scope"), but confirm no incidental
  regression to its live-region behavior while making the question-text
  change.

### 1d. Component test updates

**File:** `src/react-app/components/ActiveGate.spec.tsx`

- Existing tests query for `screen.getByText("What is 2+2?")` — these will
  break unless the hook's `speed` default is fast enough to have completed
  by the time RTL's default `render()` synchronously returns, which it will
  not (fake timers not advanced yet).
- Fix: either (a) wrap the test file's setup with
  `vi.useFakeTimers()` + `vi.runAllTimers()` after each render before
  assertions that check question text, or (b) mock `useTypewriter` at the
  top of `ActiveGate.spec.tsx` — **recommended**, since `ActiveGate.spec.tsx`
  is a unit test for `ActiveGate`'s own rendering logic, not for the
  typewriter effect (which has its own spec). Follow the existing mocking
  pattern used for `useShake` in `useProgramPlay.spec.ts`. Mock shape:
  `vi.mock("@hooks/useTypewriter", ...)` where the factory forwards the
  hook's `text` argument and returns a completed state:
  `(text: string) => ({ displayedText: text, isComplete: true, skip: vi.fn() })`.
  (`vi.mock` factory hoists to module top — use `vi.hoisted` if the `vi.fn`
  needs to be referenced in assertions.)
- New tests:
  - the animated question `<p>` has `aria-hidden="true"`;
  - a `sr-only` sibling exists whose text always equals the full
    `gate.question`, independent of `displayedText` state.

### 1e. E2E and integration test impact

- `e2e/pages/gamePage.ts` locates the question via role/label selectors on
  the form and input, not the `<p className="description">` text itself —
  no changes expected. Confirm during implementation that no E2E assertion
  does a literal text match against the question paragraph mid-type.
- If `prefers-reduced-motion` is not set in the Playwright browser context
  by default (Chromium/Firefox default to `no-preference`), the typewriter
  will animate during E2E runs. Given `speed` defaults to ~30ms/char and
  E2E questions are short (`"What color is the sky?"` etc.), this adds at
  most ~1s per gate — acceptable, but confirm total E2E suite runtime
  doesn't regress meaningfully. If it does, consider forcing
  `prefers-reduced-motion: reduce` in `playwright.config.ts`'s `use` block
  for CI runs only.
- `src/react-app/components/ProgramPlay.integration.spec.tsx` asserts
  question text directly (`findByText("What is 2+2?")`,
  `findByText("What is 3+3?")`). These use `findBy*`, which already polls,
  but bump the explicit timeout (e.g. `{ timeout: 3000 }`) so a full
  typewriter pass reliably completes within the wait window rather than
  relying on the default RTL timeout by coincidence.

**Deliverable for a standalone PR:** 1a + 1b + 1c + 1d + 1e. This PR depends
only on the `useTypewriter` hook PR (below) and touches no other
components.

---

## Phase 0 — Hook + spec (prerequisite PR)

Ship `useTypewriter.ts` + `useTypewriter.spec.ts` alone, with zero
consumers, as the first PR. This keeps the diff reviewable in isolation and
unblocks both Phase 1 and Phase 2 to proceed independently/in parallel
afterward.

**Deliverable:** `src/react-app/hooks/useTypewriter.ts` +
`src/react-app/hooks/useTypewriter.spec.ts`. No other files touched.

---

## Phase 2 — Boot screen banner

**Scope:** `CrtOverlay.tsx`'s `banner` boot stage only. This is the riskier
phase — it touches existing, timer-driven, tested code.

### 2a. Understand current boot sequence

Current stages in `CrtOverlay.tsx` (driven by `bootStage` state):

```
flash (0ms) → blackout (150ms) → cursor (500ms) → banner (1100ms) → done (1750ms)
```

Each transition is a hardcoded `setTimeout`. The `banner` stage currently
renders static text instantly:

```tsx
{bootStage === "banner" && (
  <div className={styles.bootBanner}>
    <span className={styles.bootBannerInverse}>VT220 OK</span>
    <div>Terminal Quiz</div>
  </div>
)}
```

### 2b. Make banner duration typing-driven, not fixed

Replace the fixed `banner → done` timeout (currently fires at 1750ms
absolute, i.e. 650ms after entering `banner` at 1100ms) with:

- Enter `banner` stage at 1100ms (unchanged — flash/blackout/cursor timing
  stays fixed, only the banner→done transition changes).
- Type `"VT220 OK"` via `useTypewriter` with a fast `speed` (e.g. 15–20ms/
  char — boot text should feel snappy, not laborious; 8 characters at 20ms
  = 160ms, well within the original 650ms window).
- On `onComplete`, optionally type `"Terminal Quiz"` next (sequential, not
  simultaneous — matches how a real terminal boot banner would print line
  by line), or keep `"Terminal Quiz"` appearing instantly once `"VT220 OK"`
  finishes (simpler, still reads as intentional). **Decision needed during
  implementation** — recommend starting with the simpler "second line
  appears instantly" version and only sequencing both lines if it looks
  wrong in practice.
- After the last line's `onComplete` (plus a small fixed pause, e.g.
  150-300ms, so the "OK" banner doesn't vanish the instant it finishes
  typing), transition to `done`.
- Net effect: total boot duration becomes typing-speed-dependent instead of
  a magic `1750`. Under reduced-motion, `useTypewriter` resolves instantly,
  so the pause-before-`done` becomes the only remaining delay — keep it
  short (verify it doesn't feel like a hang).
- **Safety cap:** add a hard fallback timer (e.g. ~4s from entering the
  `banner` stage) that forces `bootStage` to `"done"` regardless of typing
  state. This guards against the boot screen hanging indefinitely if
  `onComplete` somehow never fires (e.g. a future bug in sequencing two
  chained `useTypewriter` calls). Clear this fallback timer normally when
  the typing-driven transition fires first.

### 2c. Reduced-motion interaction with existing boot skip

`CrtOverlay.tsx` already has a separate reduced-motion check that skips the
entire boot sequence (`bootStage` starts at `"done"` immediately). This
stays as-is — Phase 2 only affects the *timed* path when boot animation
runs normally. No double-handling needed since `useTypewriter` internally
also short-circuits under reduced motion, but the existing top-level skip
means the hook's reduced-motion branch won't even be reached for the boot
banner in practice (belt-and-suspenders, not a conflict).

### 2d. Test rewrite

**File:** `src/react-app/components/CrtOverlay.spec.tsx`

These existing tests assert against fixed timings and **will break**:

- `"removes power-on layer after 1.75 seconds"` — `vi.advanceTimersByTime(1750)`
- `"shows banner then removes boot layer"` — `vi.advanceTimersByTime(1100)` then `650`
- Any other test asserting `crt-poweron` disappears at a specific fixed ms

Rewrite approach: replace fixed-ms assertions with `vi.runAllTimers()` (or
`vi.advanceTimersByTime()` past the *known-fixed* stages, then explicitly
drive the typewriter completion via fake-timer advancement matching the new
`speed` value) before asserting `crt-poweron` is gone. Add new
banner-specific tests:

- banner text appears character-by-character (advance timers partially,
  assert `displayedText` is a substring/prefix)
- full banner text visible after typing completes
- boot layer removed only after banner typing + pause complete, not before

**Deliverable for a standalone PR:** 2a–2d, scoped to `CrtOverlay.tsx` +
its spec only. Depends on Phase 0 (hook). Independent of Phase 1 — can land
before, after, or in parallel with the gameplay PR.

---

## Phase 3 — Design-for-later (no code changes now)

Not a build phase — a set of constraints to keep in mind so Phase 1/2 don't
have to be redone if/when broader scope (below) gets picked back up:

- `useTypewriter` must stay content-agnostic (string in, string out) — no
  gate-specific or CRT-specific logic leaks into the hook itself. Confirm
  this holds after Phase 1 and Phase 2 land (i.e. neither phase required
  hook changes beyond options already in the Phase 0 signature).
- `speed`/`startDelay` must remain per-call props, not global constants —
  future consumers (nav links, buttons, response text) will likely want
  different speeds than gameplay question text or boot banner.
- No global "typewriter enabled/disabled" toggle is introduced yet — if one
  is needed later, it should compose with the existing
  `prefers-reduced-motion` check rather than replace it, and should mirror
  `useCrtPreferences`'s `localStorage` persistence + hotkey pattern rather
  than inventing a new mechanism.

No PR ships for this phase.

---

## Deferred scope (not built this round — reference only)

Captured here from the companion plan (`feat/170-typewriter-text` branch)
so the ideas aren't lost, and so a future round of scoping doesn't start
from zero. **None of this is committed work.** Whether any of it gets built,
and in what shape, depends on how Phase 1/2 feel once shipped — see "Scope
decision" above.

**Gameplay response text** (would extend the same `ActiveGate` surface):
- Guess response messages ("Access Granted." / "Access Denied." / errors)
  on the existing `role="status"` node — would need care to preserve
  `aria-live="polite"` behavior alongside typewriter reveal
- "Verifying..." pending state — candidate for a spinner instead of
  typewriter (mirrors `feature-ideas.md` §1.2)
- Clue text lines, typed as each new clue arrives
- `CompletedGate.successMessage` — typed once on gate completion (question
  text itself would stay static per the existing decision not to retype
  solved gates)
- Clue button labels — explicitly *not* candidates; interactive control
  labels should stay instantly readable

**Program-level narrative text** (broader UI surfaces):
- Program name title, "The End" heading + completion copy, confirm-modal
  message, in `ProgramPlay.tsx` / `TerminalConfirmModal.tsx`
- Explicit rule worth preserving if this is picked up: list/button/menu
  labels (`ProgramSelector`, `NavBar`, `LoginPage`) stay static; only
  narrative/description prose animates. This is also the mechanism that
  would keep per-component typing from feeling incoherent against
  interactive chrome, if that turns out to be a concern after Phase 1/2.

**Settings & control layer:**
- Global on/off toggle persisted in `localStorage`
  (`terminal_quiz_typewriter_settings`, mirroring
  `terminal_quiz_crt_settings`)
- Keyboard shortcut to toggle, mirroring the CRT `Ctrl+Shift+,` pattern
- Per-surface enable flags (hook already supports this via its `enabled`
  option)

**Surface inventory table** (for future rollout tracking, not needed while
scope is Phase 1/2 only):

| Surface | File | Would-be phase |
|---|---|---|
| Gate question text | `components/ActiveGate.tsx` | **Phase 1 — building now** |
| CRT boot banner | `components/CrtOverlay.tsx` | **Phase 2 — building now** |
| Guess response message | `components/ActiveGate.tsx` | Deferred |
| "Verifying..." pending | `components/ActiveGate.tsx` | Deferred |
| Clue text lines | `components/ActiveGate.tsx` | Deferred |
| `CompletedGate` successMessage | `components/CompletedGate.tsx` | Deferred |
| Program name title | `components/ProgramPlay.tsx` | Deferred |
| "The End" + completion copy | `components/ProgramPlay.tsx` | Deferred |
| `TerminalConfirmModal` message | `components/TerminalConfirmModal.tsx` | Deferred |
| `ProgramSelector` / `NavBar` / `LoginPage` labels | various | Deferred (likely stays static per the labels-stay-static rule) |
| Global toggle + hotkey + speed setting | new settings layer | Deferred |

---

## PR sequencing summary

| PR | Phase | Depends on | Files touched |
|---|---|---|---|
| 1 | 0 | — | `useTypewriter.ts`, `useTypewriter.spec.ts` |
| 2 | 1 | PR 1 | `ActiveGate.tsx`, `ActiveGate.spec.tsx`, `ProgramPlay.integration.spec.tsx`, `index.css` (sr-only utility), possibly `playwright.config.ts` |
| 3 | 2 | PR 1 | `CrtOverlay.tsx`, `CrtOverlay.spec.tsx` |

PRs 2 and 3 can be developed in parallel once PR 1 merges; they don't touch
overlapping files.

## Verification checklist (per PR)

```bash
bun run check:code
bun run build
bun run test --run
```

PR 2 (gameplay) additionally needs a local `bun run test:e2e` pass to catch
any timing-sensitive E2E breakage. PR 3 (boot screen) has no E2E coverage
today (boot sequence isn't asserted in Playwright specs) — component tests
are the only safety net, so be thorough in 2d.

## Open questions to resolve during implementation

1. Should `"Terminal Quiz"` type out sequentially after `"VT220 OK"`, or
   appear instantly once the first line completes? (§2b)
2. Does the default `speed` (~30ms/char) meaningfully slow down the E2E
   suite given gameplay questions are typed on every gate transition? (§1d)
3. Exact pause duration between banner typing completion and `done`
   transition (§2b) — needs a quick visual check, not just a number picked
   in the abstract.
4. After Phase 1/2 ship: does per-component typewriter (question types
   independently of boot banner, of future response text, etc.) feel
   coherent, or does it read as inconsistent against a retro-terminal
   theme where a real machine would type the whole screen in one pass?
   This determines whether "Deferred scope" gets picked up as-is, gets
   reshaped into a whole-screen-sequenced approach instead, or gets
   dropped. Not a blocker for Phase 1/2 — a checkpoint after.
