# File-Length Refactor Plan

Refactor the oversized source files to keep every logic file under ~200 lines.

**Status:** Phases 1-3 complete. Phase 4 (queries) pending.
Split on single responsibility, not mechanically. Declarative data files
(`schema.ts`, `gqlQueries.ts`, `types.ts`) and test files are exempt from the
target — long is normal for those.

## Current state (audited Jul 2026)

| File | Lines | Type | Verdict |
|---|---|---|---|
| `src/react-app/components/ManageProgramEditor.tsx` | 560 → 204 | Logic (container) | ✅ Split (Phase 1, Jul 2026) |
| `src/worker/graphql/gameplay/managementMutations.ts` | 368 | Logic (7 GraphQL resolvers) | ✅ Split (Phase 2, Jul 2026) |
| `src/worker/graphql/gameplay/mutations.ts` | 366 | Logic (3 resolvers, complex) | ✅ Split (Phase 3, Jul 2026) |
| `src/worker/graphql/gameplay/queries.ts` | 230 | Logic (7 resolvers, small) | 🟠 Pending (Phase 4) |
| `src/shared/gqlQueries.ts` | 222 | Data (17 query strings) | 🟢 Keep |
| `src/shared/schema.ts` | 202 | Data (5 table definitions) | 🟢 Keep |

Test files (887, 717, 589, 484, 453, ...) are intentionally long — leave alone.

## Import graph (must update when splitting)

- `src/worker/routes/graphql.ts` imports named resolver exports from the
  backend files:
  - `programMutations` → `createProgram, updateProgram, deleteProgram`
  - `gateMutations` → `createGate, updateGate, deleteGate`
  - `reorderGatesMutation` → `reorderGates`
  - `requestClueMutation` → `requestClue`
  - `resetSessionMutation` → `resetSession`
  - `submitGuessMutation` → `submitGuess`
  - `queries` → `getInProgressProgram, getProgramProgression, getPrograms, me, myPrograms, program, programGates`
- Specs import directly from source files (update these too):
  - `managementMutations.spec.ts` → `./programMutations`, `./gateMutations`, `./reorderGatesMutation`
  - `mutations.spec.ts` → `./requestClueMutation`, `./resetSessionMutation`, `./submitGuessMutation`
  - `queries.spec.ts` → `./queries`
- No barrel files (`index.ts` re-exports) per CONVENTIONS.md — update the
  importing files directly after each split.

---

## Phase 1 — Frontend: split `ManageProgramEditor.tsx` (560)

Currently mixes 5 responsibilities: program settings editing, gate list +
reorder, per-gate edit cards, add-gate form, and draft-state orchestration.

### New files

| New file | Contents | Est. lines |
|---|---|---|
| `ManageProgramEditor.tsx` | container: draft state, effects, mutation wiring, orchestration | ~150 |
| `ProgramSettingsForm.tsx` | program name/visibility/save/copy-link section (current L214-265) | ~70 |
| `GateEditorCard.tsx` | one gate's edit card + reorder buttons (current L287-478) | ~190 |
| `AddGateForm.tsx` | add-gate form (current L484-560) | ~95 |

### CSS split

Each new component gets its own co-located `.module.css` (per project
convention). Move the relevant classes out of `ManageProgramEditor.module.css`:

- `ProgramSettingsForm.module.css`: `.metaRow`, `.label`, `.input`, `.select`,
  `.button`, `.copyLinkButton`, `.errorText`
- `GateEditorCard.module.css`: `.gateCard`, `.gateHeader`, `.gateIndex`,
  `.reorderButton`, `.gateFields`, `.field`, `.input`, `.textarea`,
  `.inputSmall`, `.checkbox`, `.inlineFields`, `.gateActions`, `.deleteButton`,
  `.errorText`
- `AddGateForm.module.css`: `.addGateForm`, `.addGateTitle`, `.field`, `.input`,
  `.textarea`, `.button`, `.errorText`
- `ManageProgramEditor.module.css` keeps: `.container`, `.heading`, `.section`,
  `.sectionTitle`, `.gateList`, `.empty`

### Component props sketch

- `ProgramSettingsForm`: `programName`, `programVisibility`,
  `onProgramNameChange`, `onProgramVisibilityChange`, `onSave`, `isSaving`,
  `isUnlisted`, `onCopyLink`, `copied`, `copyFailed`, `updateError`
- `GateEditorCard`: `gate`, `draft` (the per-gate `GateForm` from
  `gateDrafts[gate.id]`, not the full `Record`), `isFirst`, `isLast`,
  `isReorderPending`, `isSaving`, `onReorder(idx, direction)`, `onSave`,
  `onDelete`, `onDraftChange(patch)`, `updateError`, `deleteError`
- `AddGateForm`: `newGate`, `onNewGateChange(patch)`, `onSubmit`, `isPending`,
  `createError`

### Behavioral notes

- The `if (!draft) return null` dance inside the gate `.map()` disappears — the
  container maps gates to
  `<GateEditorCard draft={gateDrafts[gate.id]} ... />`.
- Keep the draft-state `Record<string, GateForm>` in the container. The card
  receives the per-gate form (`gateDrafts[gate.id]`) and calls `onDraftChange`
  with a partial patch; the container binds it to that gate's id:
  `onDraftChange={(patch) =>
    setGateDrafts((prev) => ({
      ...prev,
      [gate.id]: { ...prev[gate.id], ...patch },
    }))
  }`.
- Keep copy-timer `useEffect`s (`copied`, `copyFailed`) in the container or move
  them into `ProgramSettingsForm` (whichever reads cleaner; timers are
  copy-link-scoped so `ProgramSettingsForm` is the better home).
- `ManageProgramEditor.spec.tsx` (345 lines) mocks the api hooks, so it should
  pass unchanged — verify after the split.

### Phase 1 result (Jul 2026)

| File | Lines | Notes |
|---|---|---|
| `ManageProgramEditor.tsx` | 183 | container: draft state, effects, mutation wiring |
| `GateEditorCard.tsx` | 182 | owns `GateForm` type |
| `ProgramSettingsForm.tsx` | 116 | owns `copied`/`copyFailed` timers + clipboard write |
| `AddGateForm.tsx` | 88 | owns `NewGateForm` type |
| `useGateDrafts.ts` (new hook) | 39 | gates→draft sync effect, extracted to keep container <200 |
| `useProgramSettings.ts` (new hook) | 26 | program name/visibility state + sync effect |
| `useNewGateForm.ts` (new hook) | 20 | add-gate form state + change/reset |

Follow-up (post-split tightening): container brought from 204 → 183 by
extracting `useProgramSettings` + `useNewGateForm`. Added per-component specs
(`GateEditorCard.spec.tsx`, `ProgramSettingsForm.spec.tsx`,
`AddGateForm.spec.tsx`) and hook specs (`useGateDrafts`, `useProgramSettings`,
`useNewGateForm`).

Deviations from the sketch above (documented decisions):

- **`useGateDrafts` hook added** (5th file) — without it the container was 230
  lines. Lives in `src/react-app/hooks/` per project convention.
- **Card gets an `index` prop** — needed for `#N` heading and `onReorder(index,
  ...)` calls (not in original props sketch).
- **`isDeletePending` prop added** — preserves original
  `disabled={deleteGate.isPending}` on the delete button.
- **Copy link moved into `ProgramSettingsForm`** — container passes `copyUrl`;
  the child does `navigator.clipboard.writeText` and owns the feedback state.
  `onCopyLink` prop replaced.
- **`if (!draft) return null` guard stays in the container** — `gateDrafts[gate.id]`
  is undefined on the first post-load render (sync effect runs after render);
  dropping it needs an undefined-typed draft prop or a derived-state refactor.
- **Container `.module.css` keeps `.errorText`** — used by "Program not found"
  and the reorder error; plan's CSS split omitted it.

Testing notes (spec authoring gotchas):

- Controlled inputs don't propagate edits back in isolated component tests —
  use `fireEvent.change`, not `userEvent.type` (per-keystroke resets to the
  prop value).
- `userEvent.setup()` (v14) intercepts `navigator.clipboard` — use
  `fireEvent.click` + `act` for copy-link tests so the real stub is exercised.
- `getByDisplayValue("public")` does not match a `<select>` with `value`
  attribute — use `getByLabelText(...)` + `toHaveValue()`.
- HTML5 `required` validation blocks form submit when other required fields
  are empty — fill all fields in submit tests.

Verification: `check:code`, `build`, `test --run` (467 pass), `test:integration`
(27 pass). Original container spec passed unchanged.

---

## Phase 2 — Backend: split `managementMutations.ts` (368) — ✅ DONE (Jul 2026)

Domain split: program CRUD vs gate CRUD, plus shared validation helpers.

### New files

| New file | Contents | Est. lines |
|---|---|---|
| `managementHelpers.ts` | `requireUser`, `assertVisibility`, `VALID_VISIBILITY` (current L18-33) | ~25 |
| `programMutations.ts` | `createProgram`, `updateProgram`, `deleteProgram` (current L35-118) | ~170 |
| `gateMutations.ts` | `createGate`, `updateGate`, `deleteGate` (current L119-297) | ~185 |
| `reorderGatesMutation.ts` | `reorderGates` (current L299-368) | ~90 |

### Import updates

- `graphql.ts`: split the `managementMutations` import into
  `programMutations`, `gateMutations`, and `reorderGatesMutation`.
- `managementMutations.spec.ts`: split its import to match.
- `authorizeProgram.ts` is already separate — unchanged.

### Phase 2 result (Jul 2026)

| File | Lines |
|---|---|
| `managementHelpers.ts` | 20 |
| `programMutations.ts` | 90 |
| `gateMutations.ts` | 192 |
| `reorderGatesMutation.ts` | 82 |

Deviations from the sketch above:

- **`reorderGates` split into its own file** (`reorderGatesMutation.ts`) — the
  plan estimated `gateMutations.ts` (incl. reorder) at ~190, but the real slice
  was ~250 + imports ≈ 275. Splitting is justified on shape, not just size:
  `reorderGates` is bulk/collection logic (permutation validation + two-pass
  atomic `db.batch()`), algorithmically distinct from single-entity gate CRUD,
  and matches Phase 3's one-mutation-per-file granularity. Keeps every logic
  file under ~200.
- **`managementMutations.ts` deleted** — replaced by the 4 files above; both
  importers (`graphql.ts`, `managementMutations.spec.ts`) updated. Spec file
  name kept (it covers all management mutations collectively).
- `managementHelpers.ts` came in at 18 lines (estimate ~25) — `VALID_VISIBILITY`
  stays module-private, only `requireUser`/`assertVisibility` exported.

Verification: `check:code`, `build`, `test --run`, `test:integration` all pass.

---

## Phase 3 — Backend: split `mutations.ts` (366) — ✅ DONE (Jul 2026)

One file per gameplay mutation.

### New files

| New file | Contents | Est. lines |
|---|---|---|
| `submitGuessMutation.ts` | `submitGuess` (current L38-183) | ~145 |
| `requestClueMutation.ts` | `requestClue` (current L184-304) | ~120 |
| `resetSessionMutation.ts` | `resetSession` (current L305-366) | ~60 |

### Shared helper move

`getExistingCluesForGate` (current L24-36) and `MAX_GUESS_LENGTH` (current L22)
are used by both `submitGuess` and `requestClue`. Move both into
`clueEligibility.ts` (clue-related; already imported by both) and update the
imports in the two new mutation files.

### Import updates

- `graphql.ts`: split the `mutations` import into the three new files.
- `mutations.spec.ts` (887 lines): split its import to match.

### Phase 3 result (Jul 2026)

| File | Lines |
|---|---|
| `submitGuessMutation.ts` | 156 |
| `requestClueMutation.ts` | 133 |
| `resetSessionMutation.ts` | 72 |
| `clueEligibility.ts` | 53 |
| `guessValidation.ts` | 1 |
| `activeSession.ts` | 41 |

Deviations from the sketch above (documented decisions):

- **`guessValidation.ts` added** (3rd helper file) — the plan moved
  `MAX_GUESS_LENGTH` into `clueEligibility.ts`, but it's a guess-validation
  const, not clue logic. Splitting the shared constants by concern keeps
  `clueEligibility.ts` clue-only (`MAX_CLUES_PER_GATE`, `computeCluesRemaining`,
  `computeCanRequestClue`, `getExistingCluesForGate`). Both mutations import
  `MAX_GUESS_LENGTH` from the new file.
- **`getExistingCluesForGate` moved to `clueEligibility.ts`** as planned and is
  now exported (was module-private). Clue-related, so it stays out of
  `guessValidation.ts`.
- **`mutations.ts` deleted** — replaced by the 3 mutation files above; both
  importers (`graphql.ts`, `mutations.spec.ts`) updated. Spec file name kept (it
  covers all gameplay mutations collectively).
- **`activeSession.ts` added in the post-Phase-3 review round** — extracts the
  duplicated progress/completed-state/currentGateId/gate-loading validation
  shared by `submitGuess` and `requestClue` into `loadActiveSession()` (takes a
  `desyncMessage` param, since the two mutations use different wording).
  `resetSession` is deliberately excluded — its lookup is
  `columns: { id: true }`, no-ops on a missing session, and does no
  currentGateId/gate validation.
- Import pruning per file: `submitGuess` drops `desc` + `gateClues` (only used
  by the moved helper); `requestClue` keeps `gateClues` (own `db.insert`);
  `resetSession` takes only what it uses. Biome enforces.

Verification: `check:code`, `build`, `test --run` (470 pass), `test:integration`
(27 pass) all green.

---

## Phase 4 — Backend: split `queries.ts` (230)

Domain split: auth, programs, session.

### New files

| New file | Contents | Est. lines |
|---|---|---|
| `authQueries.ts` | `me` (current L18-26) | ~25 |
| `programQueries.ts` | `getPrograms`, `program`, `myPrograms`, `programGates` (current L144-230) | ~120 |
| `sessionQueries.ts` | `getProgramProgression`, `getInProgressProgram` (current L27-143) | ~110 |

### Import updates

- `graphql.ts`: split the `queries` import into the three new files.
- `queries.spec.ts` (589 lines): split its import to match.

### Phase 4 note (post-Phase-3 review)

`activeSession.ts`'s `loadActiveSession` is mutation-scoped — strict validation
(completed-state + currentGateId throws). Phase 4's session queries are
read-side and lenient (`getProgramProgression` insert-seeds a missing session;
`getInProgressProgram` filters `status = "in_progress"` + `orderBy updatedAt`).
Do NOT route them through `loadActiveSession`. Only the trivial 3-line
`findFirst({ where: sessionId + programId })` lookup + "Missing Session ID"
guard overlap; decide then whether to extract that lookup or leave it
duplicated (3 lines each).

---

## Verification (after each phase, ideally)

```bash
bun run check:code        # lint + format + import sort
bun run build             # tsc -b + vite build
bun run test --run        # unit/component tests
bun run test:integration  # backend resolvers moved — must re-verify
```

Run at minimum after the backend phases (2, 3, 4) and after Phase 1.

---

## Notes / deferred

- **Biome enforcement**: `noExcessiveLinesPerFile` exists (nursery group,
  since v2.3.12, `maxLines` default 300, supports `skipBlankLines`) but was
  deliberately **not** enabled. If enabling later, set `maxLines: 300` (must
  clear `gqlQueries.ts` at 222 and `schema.ts` at 202) and add an `overrides`
  block exempting `**/*.spec.ts`, `**/*.spec.tsx`,
  `**/*.integration.spec.ts`.
- **`noExcessiveLinesPerFunction`** (stable, complexity group, default 50): do
  not enable without a deeper resolver-internal refactor — `submitGuess`'s
  resolve body is ~140 lines alone.
- **`graphql-codegen`**: tracked separately (GitHub issue); if adopted, removes
  the need for manual `gqlQueries.ts` strings entirely.
