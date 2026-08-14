# Authoring UX & AI Spend Guardrail — Implementation Plan

**Status:** Plan (pending approval → GitHub issues → feature branches)
**Owner:** clevertrevor
**Scope:** Improve the authoring experience for Programs/Gates (required-field validation, simplified guidance controls, themed controls) and add a global AI-spend guardrail so a single program cannot exhaust the account's daily Workers AI budget.

---

## 1. Background

### 1.1 Problems reported

1. **Silent save with missing required fields.** A Gate (or Program) can be saved with blank required fields. `updateGate` (gateMutations.ts) and `updateProgram` (programMutations.ts) accept empty strings — GraphQL `NonNull` checks presence, not content, and the DB `notNull` constraint happily stores `""`. The author clicks "Save Gate", nothing visibly changes, no error. `AddGateForm` already does this correctly (`required` attributes + disabled button, AddGateForm.tsx:38–82); `GateEditorCard` and `ProgramSettingsForm` do not.
2. **Guidance controls too complex for authors.** Three tuning knobs per gate (`acceptanceThreshold`, `guidanceEnabled`, `guidanceThreshold`) sit inline with the four content fields. `guidanceThreshold` is the weakest knob — authors won't intuit what "3" means — and the whole cluster crowds the card.
3. **Native controls clash with the terminal theme.** The `Guidance Enabled` checkbox (native, `accent-color`) and the `Visibility` select in `ProgramSettingsForm` don't match the `ProgramSelector` dropdown styling (`appearance:none` + caret `::after` + black option background, ProgramSelector.module.css:18–50).

### 1.2 Cost analysis (workers AI free tier)

- Workers AI free tier: **10,000 Neurons/day**, resetting daily at 00:00 UTC. Past the cap, requests fail with an error (429/403). Llama-class text generation consumes roughly **30–75 Neurons per request**, i.e. on the order of **~200 clue generations per day** for free.
- Crucially, **the `guidanceThreshold` setting does not drive AI cost.** Per-session spend is already hard-capped: `MAX_CLUES_PER_GATE = 3` (clueEligibility.ts:5) plus a per-session rolling rate limit (3 requests/60s, clueRateLimit.ts:6). Threshold only shifts *when* clues unlock, never *how many* per session.
- The real, unbounded dimension is **total sessions × players**: there is currently no global/account-level budget. On the Free plan this manifests as exhausting the shared daily Neuron pool — clues stop working for the whole app until midnight. On the Paid plan it would manifest as a bill. A guardrail is therefore **availability protection** (Free) and **cost protection** (Paid), not a symptom of the threshold field.

---

## 2. Approach

Two independent phases, each shipped as its own feature branch + PR.

| Phase | Scope | DB/migration | Env | Risk |
|---|---|---|---|---|
| **A** | Authoring UX (validation, guidance controls, styling) | No | No | Low |
| **B** | AI spend guardrail | Yes (new budget row) | Yes (budget value) | Medium |

Phase A has zero operational risk (no schema/behavior change to spend) and fixes the author-pain symptoms first. Phase B changes spend behavior and deserves an isolated review + release. File overlap between phases is nil: A touches `GateEditorCard`/`ProgramSettingsForm`; B touches the `requestClue` path (`useProgramPlay`, `ActiveGate`, `requestClueMutation`).

---

## 3. Phase A — Authoring UX

**Goal:** No silent saves; required fields obvious; guidance tuning simplified; themed controls.

### A1. Required-field validation (client)

- `GateEditorCard.tsx`: add `required` to label/question/correctAnswer/successMessage inputs; disable "Save Gate" while any of the four is blank (mirror the `AddGateForm` disabled-button pattern).
- `ProgramSettingsForm.tsx`: `required` on the Name input; disable "Save" while Name is blank.
- Visual indicator: `*` suffix on required-field labels across `GateEditorCard`, `ProgramSettingsForm`, and `AddGateForm` (for consistency). Invalid field styling (red border + `aria-invalid` + inline message) when a save is attempted with a blank field.

### A2. Required-field validation (server, defense-in-depth)

- `gateMutations.ts` (`createGate`, `updateGate`): reject blank/trimmed-empty `label`, `question`, `correctAnswer`, `successMessage` with a readable error. Optional length caps.
- `programMutations.ts` (`createProgram`, `updateProgram`): reject blank/trimmed-empty `name`.
- Shared validation helper in `managementHelpers.ts` to keep the two mutations consistent.

### A3. Guidance controls — collapse into "Advanced" section

- `GateEditorCard.tsx`: move `Acceptance`, `Guidance Enabled`, and `Guidance Threshold` out of the inline field row into a `<details>/<summary>` collapsible ("Advanced"), **default collapsed**. This reuses the codebase idiom already used for gates in `ActiveGate.tsx:88` and `CompletedGate.tsx:25`.
- Summary line is **state-aware** so tuning stays discoverable while collapsed, e.g. `[+] Advanced — guidance off · acceptance 87.5%` (updates as fields change).
- `guidanceThreshold` input: `min=1`, `max=MAX_CLUES_PER_GATE` (3), disabled while `guidanceEnabled` is unchecked. Label synced to the player UI wording ("Get 1st/2nd/3rd Clue", ActiveGate.tsx:67–76): *"First clue unlocks after N failed guesses"*.
- `gateMutations.ts` (`createGate`, `updateGate`): server-side validation — reject `guidanceThreshold < 1` or `> 3` (and non-integer values). Client clamps defensively; the server rejects so no out-of-range value is ever persisted.
- Styling in `GateEditorCard.module.css` (terminal caret/bracket marker on the summary).

### A4. Themed controls

- **Checkbox:** replace the native checkbox with a custom `[ ]`/`[x]` bracket control matching the `[^]`/`[v]` reorder buttons (GateEditorCard.module.css). Implementation keeps a hidden native `input[type=checkbox]` (or `role=checkbox` span) so keyboard + a11y semantics are preserved; styling via label span.
- **Select:** extract the `ProgramSelector` dropdown treatment (`appearance:none`, caret `::after`, black option background, `:focus-visible` outline) into a shared CSS module; apply to `ProgramSettingsForm`'s Visibility select (and the shared select component if one emerges).

### A5. Tests (Phase A)

- `ManageProgramEditor.spec.tsx`: save button disabled on blank fields; `*` markers render; Advanced section collapses/expands; threshold input disabled when guidance unchecked.
- `AddGateForm` spec: `*` markers (if covered separately).
- `gateMutations` integration spec: blank-field rejection, threshold clamp (0 and 4 rejected).
- `programMutations` integration spec: blank-name rejection.
- `useGateErrorState` / hook specs: unchanged unless validation moves.

### Files touched (Phase A)

`GateEditorCard.tsx` + `.module.css`, `ProgramSettingsForm.tsx` + `.module.css`, `AddGateForm.tsx` + `.module.css`, `ManageProgramEditor.tsx` (if needed), `manageEditorTypes.ts`, `gateMutations.ts`, `programMutations.ts`, `managementHelpers.ts`, shared select CSS, `gqlQueries.ts` (only if a new error surface is added), plus specs above.

---

## 4. Phase B — AI Spend Guardrail

**Goal:** Bound total daily AI spend so one program/player cannot exhaust the account's daily budget and kill clues app-wide.

### B1. Budget row + migration

- New D1 table (or key-value row) keyed by UTC date + count, e.g. `ai_usage(usage_date TEXT PK, request_count INTEGER)`. Migration generated via `bun run migrate:generate` — never hand-edit migration SQL.
- Budget value from env: `AI_DAILY_CLUE_BUDGET` (default ~150, comfortably under the free-tier ~200-call daily equivalent). Wrangler binding, not a hardcoded constant.

### B2. Server flow (`requestClueMutation.ts`)

- Check budget **before** `claimClueRateLimit` (requestClueMutation.ts:79) — when exhausted, return immediately so no rate-limit slot is burned, no `gate_clues` row inserted, and no AI call is made.
- Increment the counter after a **successful** `generateClue` (requestClueMutation.ts:98), not on failures.
- Add `isAiBudgetExhausted: boolean` to `RequestClueResultType` (`src/worker/graphql/gameplay/types.ts`) and `src/shared/gqlQueries.ts`.

### B3. Client UX (`useProgramPlay.ts`, `ActiveGate.tsx`)

- Today `clueText:null` + `isRateLimited:false` falls through to `"Failed to generate a clue. Please try again."` (useProgramPlay.ts:142) — misleading for budget exhaustion (retrying won't help until 00:00 UTC).
- New distinct branch: when `isAiBudgetExhausted`, show `"AI hint budget exhausted for today — try again tomorrow."` as a persistent status message. No cooldown timer. The "Get Clue" button stays visible; repeated clicks re-show the same message.
- End state: three distinct failure paths — AI failure (retry now), rate-limited (cooldown timer), budget exhausted (try tomorrow).

### B4. Tests (Phase B)

- `requestClueMutation` integration spec: budget exhausted returns `isAiBudgetExhausted: true`, no AI call, no rate-limit slot consumed, no `gate_clues` insert.
- Counter increments only on successful generation (AI-failure path does not increment).
- `useProgramPlay.spec.ts`: budget-exhausted response sets the new message, no cooldown.
- ActiveGate spec: budget-exhausted message renders when applicable.

### Files touched (Phase B)

`schema.ts`, `requestClueMutation.ts`, `aiService.ts` (budget helper), `types.ts`, `gqlQueries.ts`, `useProgramPlay.ts`, `ActiveGate.tsx` (only if message rendering changes), `migrations/`, `wrangler.jsonc` (env/binding), plus specs above.

---

## 5. Decisions Log

| Question | Decision | Why |
|---|---|---|
| Keep author control over guidance fields? | Keep all three, but collapse into an Advanced section and validate `guidanceThreshold` to reject anything outside `1..MAX_CLUES_PER_GATE` (client clamps; server rejects) | Acceptance and guidance-enabled are genuinely useful authorial knobs. Threshold is retained for pacing control but constrained so its semantics stay coherent with the 3-clue system. If still confusing post-ship, scrapping it is a trivial follow-up (server default 2, drop field). |
| `guidanceThreshold` max | `3` (`MAX_CLUES_PER_GATE`) | First clue can only be unlocked by a failed guess; three clues per gate means thresholds beyond 3 feel like a wall and break the "1st/2nd/3rd Clue" mental model. |
| Budget guardrail scope | Global daily counter (app-wide), not per-author | The failure mode is a shared daily pool; per-author accounting is more tables for marginal value at this scale. |
| Guardrail behavior on exhaust | Graceful `null` clue + distinct client message | Avoids raw 429s reaching players and misdirection from the generic "try again" message. |
| Phase B budget default | ~150/day (env-configurable) | Comfortably under free-tier ~200-call/day equivalent; tune after observing real usage. |

## 6. Assumptions & Open Items

- Budget value finalized during Phase B implementation (default in `.env.example` / `.dev.vars.example`, override in preview/prod).
- `AI_DAILY_CLUE_BUDGET` as a Worker secret/env var vs plain binding — confirm wrangler setup during Phase B.
- Free tier cannot overspend (hard cap), so Phase B is primarily availability protection today; the same guardrail becomes bill protection if the account moves to Workers Paid.
- No per-program budget or author-facing AI-usage UI in either phase — backlog candidates only.

## 7. Next Steps (post-approval)

1. Create GitHub issues: one per phase (Phase A, Phase B), each with the tasks above as a checklist.
2. Prime a feature branch for Phase A off latest `main`; implement; PR.
3. Phase B branch after Phase A merges (avoids interleaving two open branches touching disjoint files is safe, but sequential is cleaner for review).
4. Land each PR independently; semantic-release bumps version per merge.
