# Typewriter Text Effect — Implementation Plan

**Status:** Phases 0, 1, and 2 shipped and committed. Current working-tree
work: `CompletedGate.successMessage` typing + sequential
question/successMessage orchestration (pulled forward from Deferred scope,
see "Latest findings (orchestration)" below) — code complete, uncommitted,
pending review. Phase 3 not started.
**Origin:** `docs/feature-ideas.md` §2.5 ("Typewriter Text Effect")
**Owner:** TBD

**Recent updates:** Phase 0 shipped successfully. During Phase 1 implementation,
the team discovered that a dual-node sr-only pattern is more robust than the
original single-node `aria-label` approach, and that this pattern creates an
RTL text-duplication issue requiring selector-scoped assertions. §1c and §1d
(and PR table) have been updated to reflect the actual implementation. Phase 2
decisions (BootBanner subcomponent, single-line typing, exact-timer test
strategy) were resolved during planning and are folded into §2b/§2d. See
"Latest findings" below.

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

## Latest findings (Phase 1 implementation)

During Phase 1 development, the team discovered several issues not caught in
planning:

1. **Dual-node sr-only pattern is more robust than single-node `aria-label`:**
   the original plan's `aria-label` approach is simpler but less reliable for
   AT announcing full text while a single node updates. The implemented
   approach uses two nodes: an `aria-hidden` node carrying `displayedText`
   (the animation), and a visually-hidden sr-only node carrying the full
   `gate.question` at all times. This decouples the typing reveal from
   accessibility announcements. §1c reflects this change.

2. **Dual-node creates RTL text-duplication ("multiple elements found"):** once
   typing completes, both nodes hold the full question text, and RTL's
   `getByText`/`findByText` throw when querying by exact text match. Fix:
   scope all question assertions to the sr-only span via `data-testid`
   (consistent with existing `data-testid="clue-text"` pattern elsewhere in
   `ActiveGate.tsx`). This selector-scoping also eliminates timing sensitivity
   — the sr-only node always holds the full text regardless of animation
   state. §1d and the PR table reflect this fix.

3. **Route spec was missed:** `routes/programs/-$programId.spec.tsx:46`
   renders the real component chain and needs the same selector-scoping fix.
   Added to Phase 1 files.

4. **No timeout bumps needed:** the original plan proposed bumping RTL timeout
   on `findByText` queries to wait for typing to complete. This is unnecessary
   with selector-scoped queries, which are immediate. Removed from §1e.

5. **Mock export shape matters:** `useTypewriter` is a **default export**.
   The `vi.mock` factory must key the mock as `default:` — a named-export key
   does not intercept the default import and the real (timer-driven) hook runs,
   reintroducing the fake-timer breakage. See §1d.

All other findings (`.description` CSS rule, sr-only span placement, mock
`skip()` simplification, E2E timing impact) are minor and do not require plan
updates beyond clarification.

## Latest findings (Phase 2 implementation)

Resolved during Phase 2 planning (decisions below are now folded into the
phase sections):

1. **BootBanner subcomponent, not parent-level `enabled` flag:** mounting the
   hook inside a `BootBanner` that appears only when `bootStage === "banner"`
   types from empty on mount. A parent-level `enabled: bootStage === "banner"`
   toggle would paint the full banner text for one frame before the effect
   resets and starts typing (visible flash). See §2b.
2. **Typing-driven `done` breaks single-`advanceTimersByTime` tests:** the
   boot → done chain now depends on React committing `banner` (mounting
   `BootBanner` and scheduling the typing interval), then committing
   `bannerDone` (scheduling the pause timer). A single
   `advanceTimersByTime(1750)` commits once at the end, so `bootStage`
   never commits as `banner` mid-advance, the interval is never scheduled,
   and `done` never fires. All nine tests that cross the boot boundary —
   not just the two banner-timing ones — must advance in steps that end on
   commit boundaries (a shared `advancePastBoot()` helper). See §2d.
3. **Do not use `vi.runAllTimers()` in the spec rewrite:** it also fires the
   5000ms first-visit timer and breaks `shows hotkey hint on first visit`,
   and it hits the same single-commit boundary problem as a single
   `advanceTimersByTime`. Drive exact durations in stepped `act` calls
   instead. See §2d.

## Latest findings (CompletedGate.successMessage + orchestration)

Pulled the deferred `CompletedGate.successMessage` typing forward (see
"Deferred scope") and coordinated it with the next gate's question so the
two never type in parallel:

1. **Sequential orchestration via derived state:** `ProgramPlay.tsx` tracks
   a `releasedGateId` set by the last `CompletedGate`'s `onComplete`, and a
   derived `canTypeQuestion` gates the next `ActiveGate` (`enabled={canTypeQuestion}`).
   Derived at render time, not reset in an effect, so a gate transition
   gates the new question immediately — an effect-reset would lag one frame
   and flash the full text.
2. **Mount-when-enabled, not `enabled` flag (same pattern as §2b):** the
   hook's `enabled: false` contract resolves to instant full text, so
   gating by `enabled` would paint the full question for a frame, then wipe
   and retype. `ActiveGate` now renders a `TypedQuestion` subcomponent that
   mounts only when typing is allowed. This also fixed the page-refresh bug
   where the last gate's question showed fully, then retyped after the
   successMessage finished.
3. **`CompletedGate` gains `isLast` + `onComplete` props:** typing of
   `successMessage` is enabled only for the last completed gate; `onComplete`
   fires the orchestration. Live solve sequence: successMessage types →
   `onComplete` → next question types.

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
  `<p className="description">{displayedText}</p>` where
  `displayedText` comes from `useTypewriter(gate.question)`.
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

**Pattern (supersedes earlier `aria-label`-only draft):** two nodes instead
of one — an `aria-hidden` node carrying the animated `displayedText`, plus
a visually-hidden ("sr-only") node carrying the full `gate.question` at all
times. This is more robust than overriding `aria-label` on a single node
(avoids relying on AT/browser support for live `aria-label` updates) and
matches how `ActiveGate.tsx` already disambiguates repeated text elsewhere
(see test-targeting note below).

- Add a visually-hidden `<span>{gate.question}</span>` **before** the
  animated `<p>` in DOM order, so a screen reader announces the full
  question first, then encounters the (aria-hidden, ignored) typing node.
- Mark the animated `<p aria-hidden="true">{displayedText}</p>` hidden from
  assistive tech — it's decorative-in-progress, the sr-only span is the
  real content.
- Tag the sr-only span with `data-testid="gate-question"` for test
  targeting (see 1d) — consistent with the existing `data-testid="clue-text"`
  pattern already used in `ActiveGate.tsx`'s clue list for the same kind of
  duplicate/ambiguous-text-node problem. Prefer this over a `.sr-only`
  class selector: a CSS class is a styling implementation detail, and using
  it as a test hook means a future visually-hidden-technique refactor can
  break tests for reasons unrelated to logic. `data-testid` decouples that.
- `.sr-only` does not exist in the codebase yet (verified 2026-08-03) —
  add the standard utility class to `src/react-app/index.css` (global
  stylesheet): visually clipped, 1px, `clip-path`, `white-space: nowrap`,
  `position: absolute`. Standard SR-only recipe, no third-party dependency.
- The sr-only span always holds the full question text, independent of
  typing state — this is what makes it safe to assert against without any
  timing dependency (see 1d/1e).
- The existing `role="status"` / `aria-live="polite"` response-message node
  in `ActiveGate` is untouched by this phase (response text isn't
  typewritten yet — see "Deferred scope"), but confirm no incidental
  regression to its live-region behavior while making the question-text
  change.

### 1d. Component test updates

**Files affected:**
- `src/react-app/components/ActiveGate.spec.tsx`
- `src/react-app/routes/programs/-$programId.spec.tsx` (missed in original plan)
- `src/react-app/components/ProgramPlay.integration.spec.tsx`

**Duplication problem:** once typing completes, both the animated `<p>` and
the sr-only `<span>` contain the full question. RTL `getByText`/`findByText`
with an exact match now throw "Found multiple elements" — a false breakage.

**Fix:** scope all question-text assertions to the sr-only span via
`data-testid`. This also eliminates the timing-sensitivity problem entirely
since the sr-only span always holds the full text regardless of `displayedText`
state — no timers need to be advanced.

```ts
// Before (breaks with the new dual-node setup):
screen.getByText("What is 2+2?")

// After (scoped to sr-only node, timing-independent):
screen.getByText("What is 2+2?", { selector: "[data-testid='gate-question']" })

// Or using data-testid directly (preferred):
screen.getByTestId("gate-question")
```

Affected assertions in detail:

1. `ActiveGate.spec.tsx` — `getByText("What is 2+2?")` → use
   `getByTestId("gate-question")` + verify content.
2. `routes/programs/-$programId.spec.tsx` — synchronous `getByText` after
   title appears. Route spec renders the real component chain (router →
   ProgramPlay → ActiveGate), so it needs the same selector-scoping fix.
   No timeout bump needed; scoped query is immediate.
3. `ProgramPlay.integration.spec.tsx` — `findByText`/`getByText` for
   question assertions (all five occurrences: initial gate, gate transition,
   reset). Use `getByTestId("gate-question")` + content assertion — immediate,
   no timeout-bump needed. Note this spec renders the **real** hook (not
   mocked), so once typing completes both nodes hold full text and the
   duplicate failure is real here too.

**Mock `useTypewriter`:** in `ActiveGate.spec.tsx` (a unit test of
`ActiveGate`'s own rendering, not of the effect), mock the hook at the top
of the file. `useTypewriter` is a **default export**, so the factory must key
the mock as `default:`:

```ts
vi.mock("@hooks/useTypewriter", () => ({
  default: (text: string) => ({
    displayedText: text,
    isComplete: true,
    skip: () => {},
  }),
}));
```

The `skip: () => {}` is a no-op since `ActiveGate` never calls it. A named
`useTypewriter:` key does **not** intercept the default import — the real
timer-driven hook would run and the fake-timer breakage returns.

**New test in `ActiveGate.spec.tsx`:** add a test that the animated
question `<p>` carries `aria-hidden="true"`, and that the sr-only span
(`getByTestId("gate-question")`) always holds the full `gate.question`,
independent of `displayedText` state. This documents the contract and guards
against accidental `aria-hidden` placement on the wrong node in future
refactors.

### 1e. E2E impact

- `e2e/pages/gamePage.ts` locates the question via role/label selectors on
  the form and input, not the `<p className="description">` text itself —
  no changes expected. Confirm during implementation that no E2E assertion
  does a literal text match against the question paragraph. (Verified: E2E
  has no question-text assertions; `authoring.spec.ts` only fills the
  authoring form.)
- If `prefers-reduced-motion` is not set in the Playwright browser context
  by default (Chromium/Firefox default to `no-preference`), the typewriter
  will animate during E2E runs. Given `speed` defaults to ~30ms/char and
  E2E questions are short (`"What color is the sky?"` etc.), this adds at
  most ~1s per gate — acceptable. Typing never gates interaction, so no E2E
  flow waits on it. If total E2E suite runtime regresses meaningfully,
  consider forcing `prefers-reduced-motion: reduce` in
  `playwright.config.ts`'s `use` block for CI runs only.

**Deliverable for a standalone PR:** 1a + 1b + 1c + 1d + 1e. This PR depends
only on the `useTypewriter` hook PR (Phase 0) and touches no other components
outside those listed in 1d.

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

```text
flash (0ms) → blackout (150ms) → cursor (500ms) → banner (1100ms) → done (1750ms)
```

Each transition is a hardcoded `setTimeout`. The `banner` stage renders
static text instantly:

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
- **Extract a `BootBanner` subcomponent** (same file) that calls
  `useTypewriter("VT220 OK", { speed: 20, onComplete })` on mount. Because
  the subcomponent only mounts when `bootStage === "banner"`, typing starts
  from empty exactly when the banner appears. Do **not** mount the hook at
  the `CrtOverlay` level gated by `enabled: bootStage === "banner"`: with
  `enabled: false` the hook resolves to the full text immediately, so the
  first `banner` render paints the complete banner for one frame before the
  effect resets and starts typing — a visible flash.
- **Type only `"VT220 OK"`** (8 chars at 20ms/char = 160ms); `"Terminal Quiz"`
  appears instantly when the first line's `isComplete` is `true`. This is the
  "simpler first" variant — real line-by-line typing of both lines (22 chars)
  would consume ~640ms of the 650ms banner window and land ~1740ms. Revisit
  full sequencing only if the simple version looks wrong in practice; it is
  an isolated change inside `BootBanner`.
- **Budget constraint:** typing (160ms) + fixed pause (200ms) = 360ms of the
  original 650ms banner window → boot ends ~1460ms, comfortably under the
  former 1750ms. (Test stability does not actually depend on this — see 2d —
  but it keeps boot from feeling longer than before.)
- **Transition to `done`:** parent state `bannerDone` is set by
  `BootBanner`'s `onComplete`. A `CrtOverlay` effect watching
  `bootStage === "banner" && bannerDone` schedules `setBootStage("done")`
  after the fixed 200ms pause (so the banner doesn't vanish the instant it
  finishes typing). `bannerDone` resets to `false` when a boot restarts
  (powerOn re-toggle) so re-boots re-type.
- **Safety cap:** an effect on `bootStage === "banner"` schedules a hard
  fallback `setBootStage("done")` at 4000ms, cleared on cleanup. Guards
  against the boot screen hanging indefinitely if `onComplete` never fires.
  Far beyond the ~360ms normal path, so it only fires on a sequencing bug.
- Net effect: total boot duration becomes typing-speed-dependent instead of
  a magic `1750`. Under reduced-motion, the top-level skip (see 2c) already
  short-circuits before `banner` is reached.

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

**Rewrite approach — stepped exact-duration advancement, not `vi.runAllTimers()`:**
`vi.runAllTimers()` would also fire the 5000ms first-visit timer, flipping
`firstVisitDone` and breaking `shows hotkey hint on first visit` (which
asserts the hint after boot). It also hits the same single-commit boundary
problem as a single `advanceTimersByTime` (see "Latest findings"). Drive the
fake timers in steps that each end on a commit boundary, via a shared helper:

```ts
// Boot is typing-driven: `done` needs banner to commit (mounts BootBanner,
// scheduling the typing interval), then bannerDone to commit (scheduling
// the pause timer). Each step ends on a commit boundary.
function advancePastBoot() {
  act(() => vi.advanceTimersByTime(1100)); // banner stage commits, interval scheduled
  act(() => vi.advanceTimersByTime(360));  // typing done + onComplete, pause timer scheduled
  act(() => vi.advanceTimersByTime(200));  // pause elapses, `done` commits
}
```

- **All nine tests that cross the boot boundary use `advancePastBoot()`** —
  the seven status-bar tests (formerly a single `advanceTimersByTime(1750)`)
  and the two rewritten banner-timing tests. The status-bar tests are *not*
  left untouched; the typing-driven chain requires commit-stepped
  advancement regardless of total duration.
- `"removes power-on layer after banner typing and pause complete"`: advance
  `1100` (banner shown, power-on layer present) → `160` (typing of
  `"VT220 OK"` at 20ms/char complete, but pause not elapsed — layer still
  present) → `200` (pause elapsed — layer gone). The intermediate assertion
  covers the plan's "not removed before typing + pause complete" contract.
- `"types banner text character-by-character then removes boot layer"`:
  at `1100` assert `boot-banner-line1` is empty; `+40` assert `"VT"` and
  that `Terminal Quiz` is absent; `+120` assert `"VT220 OK"` and
  `Terminal Quiz` present; `+200` assert the power-on layer is gone.

**Test targeting:** the typed line carries `data-testid="boot-banner-line1"`
for partial-typing assertions (same `data-testid` convention as Phase 1's
`gate-question` / existing `clue-text`). Partial text is asserted via
`toHaveTextContent`, which is timing-correct under fake-timer advancement.
The banner is purely decorative overlay — no sr-only sibling needed, no
`aria-hidden` change.

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
| `CompletedGate` successMessage | `components/CompletedGate.tsx` | Built — pull-forward (uncommitted) |
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
| 2 | 1 | PR 1 | `ActiveGate.tsx`, `ActiveGate.spec.tsx`, `routes/programs/-$programId.spec.tsx`, `ProgramPlay.integration.spec.tsx`, `index.css` (sr-only utility), possibly `playwright.config.ts` |
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

1. ~~Should `"Terminal Quiz"` type out sequentially after `"VT220 OK"`, or
   appear instantly once the first line completes?~~ **Resolved:** type
   `"VT220 OK"` only; `"Terminal Quiz"` appears instantly on completion
   (§2b). Full two-line sequencing may be revisited if it looks wrong in
   practice — isolated change inside `BootBanner`.
2. ~~Does the default `speed` (~30ms/char) meaningfully slow down the E2E
   suite given gameplay questions are typed on every gate transition?~~
   **Resolved:** typing never gates interaction, so no E2E flow waits on it;
   E2E has no question-text assertions. If total suite runtime regresses
   meaningfully, force `prefers-reduced-motion: reduce` in
   `playwright.config.ts` for CI.
3. ~~Exact pause duration between banner typing completion and `done`
   transition~~ **Resolved to 200ms**, flagged as visually tunable after a
   real look; the constant is a single module-level value in
   `CrtOverlay.tsx`.
4. After Phase 1/2 ship: does per-component typewriter (question types
   independently of boot banner, of future response text, etc.) feel
   coherent, or does it read as inconsistent against a retro-terminal
   theme where a real machine would type the whole screen in one pass?
   This determines whether "Deferred scope" gets picked up as-is, gets
   reshaped into a whole-screen-sequenced approach instead, or gets
   dropped. Not a blocker for Phase 1/2 — a checkpoint after.
