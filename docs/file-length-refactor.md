# File-Length Refactor Plan

Refactor the oversized source files to keep every logic file under ~200 lines.
Split on single responsibility, not mechanically. Declarative data files
(`schema.ts`, `gqlQueries.ts`, `types.ts`) and test files are exempt from the
target — long is normal for those.

## Current state (audited Jul 2026)

| File | Lines | Type | Verdict |
|---|---|---|---|
| `src/react-app/components/ManageProgramEditor.tsx` | 560 | Logic (stateful component) | 🔴 Split into 4 |
| `src/worker/graphql/gameplay/managementMutations.ts` | 368 | Logic (7 GraphQL resolvers) | 🟠 Split into 2 + helpers |
| `src/worker/graphql/gameplay/mutations.ts` | 366 | Logic (3 resolvers, complex) | 🟠 Split into 3 + helper move |
| `src/worker/graphql/gameplay/queries.ts` | 230 | Logic (7 resolvers, small) | 🟡 Split into 3 |
| `src/shared/gqlQueries.ts` | 222 | Data (17 query strings) | 🟢 Keep |
| `src/shared/schema.ts` | 202 | Data (5 table definitions) | 🟢 Keep |

Test files (887, 717, 589, 484, 453, ...) are intentionally long — leave alone.

## Import graph (must update when splitting)

- `src/worker/routes/graphql.ts` imports named resolver exports from all three
  backend files:
  - `managementMutations` → `createGate, createProgram, deleteGate, deleteProgram, reorderGates, updateGate, updateProgram`
  - `mutations` → `requestClue, resetSession, submitGuess`
  - `queries` → `getInProgressProgram, getProgramProgression, getPrograms, me, myPrograms, program, programGates`
- Specs import directly from source files (update these too):
  - `managementMutations.spec.ts` → `./managementMutations`
  - `mutations.spec.ts` → `./mutations`
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
- `GateEditorCard`: `gate`, `draft`, `isFirst`, `isLast`, `isReorderPending`,
  `isSaving`, `onReorder(idx, direction)`, `onSave`, `onDelete`,
  `onDraftChange(patch)`, `updateError`, `deleteError`
- `AddGateForm`: `newGate`, `onNewGateChange(patch)`, `onSubmit`, `isPending`,
  `createError`

### Behavioral notes

- The `if (!draft) return null` dance inside the gate `.map()` disappears — the
  container maps gates to `<GateEditorCard draft={draft} />`.
- Keep the draft-state `Record<string, GateForm>` in the container; the card
  calls `onDraftChange` with a partial patch.
- Keep copy-timer `useEffect`s (`copied`, `copyFailed`) in the container or move
  them into `ProgramSettingsForm` (whichever reads cleaner; timers are
  copy-link-scoped so `ProgramSettingsForm` is the better home).
- `ManageProgramEditor.spec.tsx` (345 lines) mocks the api hooks, so it should
  pass unchanged — verify after the split.

---

## Phase 2 — Backend: split `managementMutations.ts` (368)

Domain split: program CRUD vs gate CRUD, plus shared validation helpers.

### New files

| New file | Contents | Est. lines |
|---|---|---|
| `managementHelpers.ts` | `requireUser`, `assertVisibility`, `VALID_VISIBILITY` (current L18-33) | ~25 |
| `programMutations.ts` | `createProgram`, `updateProgram`, `deleteProgram` (current L35-118) | ~170 |
| `gateMutations.ts` | `createGate`, `updateGate`, `deleteGate`, `reorderGates` (current L119-368) | ~190 |

### Import updates

- `graphql.ts`: split the `managementMutations` import into
  `programMutations` and `gateMutations`.
- `managementMutations.spec.ts`: split its import to match.
- `authorizeProgram.ts` is already separate — unchanged.

---

## Phase 3 — Backend: split `mutations.ts` (366)

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
