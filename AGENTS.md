# Terminal Quiz — Agent Context

## Project Overview

Terminal Quiz is a full-stack SPA: React + TanStack Router on the frontend, Hono on the backend, deployed as a single Cloudflare Worker. It's a terminal-aesthetic riddle/puzzle game where players advance through a "program" (an ordered set of "gates") by answering correctly.

Live deployment: `https://quiz.clevertrevor.dev`

There is a **single, server-authoritative gameplay flow**: a session ID is minted server-side into an HttpOnly cookie (`anon_gameplay_session`, `Path=/api`) by `sessionMiddleware`; gameplay mutations also carry a constant `x-session-id` same-origin tripwire header enforced by `requireSessionHeader`. The server tracks per-session progression (current gate, completed gates, attempt count) in the `session_progress` / `session_completed_gates` tables. All gameplay mutations — `submitGuess`, `requestClue`, `resetSession` — are resolved server-side and validated against that session's row. There is no client-only or REST-based flow.

**User authentication** (Better Auth, OAuth-only: Google + GitHub) is layered on top for content authorship only — gameplay stays anonymous. Auth middleware sets `user` in Hono context; route guards (`requireUser` in `-requireUser.ts`) protect management routes. Two identity systems coexist: the `anon_gameplay_session` cookie for anonymous gameplay, Better Auth session cookie for authorship. Management mutations (`createProgram`, `updateProgram`, `deleteProgram`, `createGate`, `updateGate`, `deleteGate`, `reorderGates`) are auth-guarded via `requireUser`; the six existing-program mutations (all except `createProgram`) re-verify ownership via `authorizeProgramMutation()`, which checks `program.authorId === userId`, while `createProgram` uses `requireUser` + `assertVisibility`.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, TanStack Router |
| Backend | Hono 4, Cloudflare Workers |
| API | GraphQL only (`drizzle-graphql` auto-schema + custom gameplay resolvers) |
| Database | Cloudflare D1 (SQLite), Drizzle ORM |
| AI | Cloudflare Workers AI (`@cf/meta/llama-4-scout-17b-16e-instruct`), used for on-demand clue generation |
| Client cache/state | TanStack Query v5 |
| Package manager | Bun |
| Linter / Formatter | Biome |
| Testing | Vitest (unit + Workers-pool integration), Playwright (E2E), React Testing Library, MSW, happy-dom |
| Commits | cz-git + commitlint (gitmoji + conventional commits), Husky |
| Releases | semantic-release + semantic-release-gitmoji (standard semver, tagged `v{version}`) |
| CI/CD | GitHub Actions (`.github/workflows/`) |
| Tool/task management | mise (`mise.toml` — wraps every `bun run` script as a `mise run` task) |

---

## Local Development Setup

```bash
mise install    # provisions bun pinned in mise.toml

# Activate mise so bun resolves in this shell (husky hooks run
# `bun run lint-staged` / `bun run test --run` and fail with "command not
# found" otherwise). Run once per session — the shims are not on PATH by
# default, especially in non-interactive agent shells:
eval "$(mise activate zsh)"

# Fallback for any single command when activation isn't in effect:
#   mise exec -- <cmd>
# (e.g. `mise exec -- git commit ...` for the pre-commit hook)

bun install

cp .env.example .env
# Set DRIZZLE_DATABASE_URL to the local .wrangler SQLite file path

cp .dev.vars.example .dev.vars
# Set CLOUDFLARE_API_TOKEN (needed for local Workers AI calls), ENVIRONMENT,
# BETTER_AUTH_SECRET, BETTER_AUTH_URL, and OAuth client IDs/secrets

bun run dev

bun run migrate:local
bun run seed:local
```

Dev server: `http://localhost:5173`.

---

## Common Commands

```bash
bun run test --run      # run unit/component tests once
bun run test:integration # run backend integration tests (real D1 via @cloudflare/vitest-pool-workers)
bun run coverage        # single run with V8 coverage (unit tests only — see note below)
bun run test:ui         # browser-based Vitest UI
bun run test:e2e        # seed local D1 with E2E fixtures, then run Playwright against localhost

bun run lint            # biome lint .
bun run format          # biome format --write .
bun run check:code      # biome check --write . (lint + format + import sort)
bun run check           # build + wrangler deploy --dry-run (pre-deploy sanity check)

bun run build           # tsc -b && vite build
bun run preview         # build, then vite preview

bun run deploy          # wrangler deploy (production)
bun run deploy:preview  # build with CLOUDFLARE_ENV=preview, then wrangler deploy --env preview

bun run migrate:generate   # drizzle-kit generate, after editing schema.ts
bun run migrate:local      # apply migrations to local D1 file
bun run migrate:preview    # apply to preview D1
bun run migrate:prod       # apply to production D1

bun run seed:generate    # compile scripts/seed.ts + seed-e2e.ts -> scripts/generated/*.sql
bun run seed:local       # seed:generate, then wrangler d1 execute --file=scripts/generated/seed.sql (local D1)
bun run seed:preview     # seed:generate, then wrangler d1 execute --file=scripts/generated/seed.sql (preview D1)
bun run seed:prod        # seed:generate, then wrangler d1 execute --file=scripts/generated/seed.sql (production D1)
bun run seed:e2e:local   # seed:generate, then wrangler d1 execute --file=scripts/generated/seed-e2e.sql (local D1)
bun run seed:e2e:preview # seed:generate, then wrangler d1 execute --file=scripts/generated/seed-e2e.sql (preview D1)

bun run commit           # git-cz, interactive commit prompt (preferred over `git commit`)
bun run cf-typegen       # wrangler types, regenerates worker-configuration.d.ts
```

> Every command above also has a matching `mise run <task>` alias defined in `mise.toml` (e.g. `mise run test:run`, `mise run check:code`, `mise run test:e2e`).

---

## Project Structure

```sh
.
├── e2e/                          # Playwright E2E specs + page objects (gameplay, clue, reset-flow, wrong-answer, smoke, authoring)
├── migrations/                  # Drizzle SQL migrations + meta/ snapshots
├── public/                      # Static assets
├── scripts/                     # seedGenerator.ts + typed seedData.ts/seedE2eData.ts (checked in,
│                                #   compiled by seed.ts/seed-e2e.ts into git-ignored generated/*.sql)
├── src/
│   ├── react-app/
│   │   ├── api/
│   │   │   ├── graphQlClient.ts             # generic GraphQL fetch helper (adds x-session-id)
│   │   │   ├── queryClient.ts               # TanStack QueryClient setup
│   │   │   ├── queryKeys.ts
│   │   │   ├── queries/                     # useProgramsQuery, useProgramQuery,
│   │   │   │                                # useProgramProgressionQuery,
│   │   │   │                                # useInProgressProgramQuery,
│   │   │   │                                # useMyProgramsQuery, useProgramGatesQuery
│   │   │   └── mutations/                   # useSubmitGuessMutation, useRequestClueMutation,
│   │   │                                    # useCreateProgramMutation, etc.
│   │   ├── components/       # ActiveGate, CompletedGate, ErrorBoundary, ProgramPlay,
│   │   │                     # ProgramSelector, RouteErrorFallback, TerminalConfirmModal,
│   │   │                     # ManageProgramsList, ManageProgramEditor, NavBar, LoginPage
│   │   ├── hooks/             # useProgramPlay, usePrograms, useProgressionScroll,
│   │   │                     # useResetSession, useShake
│   │   ├── routes/            # TanStack file-based routes: __root, index, login,
│   │   │                     # programs/select, programs/$programId,
│   │   │                     # programs/manage, programs/manage/$programId
│   │   ├── test-utils/        # setupTests, queryTestUtils, reactRouterUtils, cssModuleMock, msw/
│   │   └── main.tsx           # bootstrap: ErrorBoundary + QueryClientProvider + RouterProvider
│   ├── shared/
│   │   ├── schema.ts          # Drizzle schema — single source of truth for DB + types
│   │   ├── authSchema.ts      # Better Auth tables (user, account, session, verification)
│   │   ├── types.ts           # Program, Gate, and related types (inferred from schema)
│   │   └── gqlQueries.ts      # Single source of truth for all GraphQL query/mutation strings
│   └── worker/
│       ├── index.ts                # Hono entry, mounts /api/auth/* + /api/graphql
│       ├── middleware/             # db (Drizzle setup), logger, session (reads x-session-id),
│       │                          # auth (Better Auth session resolution)
│       ├── routes/                 # graphql.ts — builds and serves the GraphQL schema
│       ├── graphql/gameplay/       # query resolvers (authQueries.ts, programQueries.ts,
│       │                          #   sessionQueries.ts), mutations (submitGuessMutation.ts,
│       │                          #   requestClueMutation.ts, resetSessionMutation.ts,
│       │                          #   programMutations.ts, gateMutations.ts,
│       │                          #   reorderGatesMutation.ts), shared (types.ts,
│       │                          #   authorizeProgram.ts, managementHelpers.ts,
│       │                          #   activeSession.ts, clueEligibility.ts, guessValidation.ts),
│       │                          # plus *.integration.spec.ts files (real D1 via cloudflare:test)
│       ├── services/                # aiService.ts — Workers AI clue generation,
│       │                           # auth.ts — Better Auth lifecycle (create, get, clear, validate)
│       ├── utils/                   # isGuessCloseEnough.ts, errorHandler.ts
│       └── test-utils/              # mockEnv.ts (unit-test mocks), setupDb.ts + gqlRequest.ts (integration helpers)
├── biome.json
├── commitlint.config.ts
├── drizzle.config.ts
├── playwright.config.ts
├── release.config.mjs
├── vite.config.ts
├── vitest.config.integration.ts   # separate Vitest config: @cloudflare/vitest-pool-workers + real D1
└── wrangler.jsonc
```

---

## Code Style

This project uses **Biome** (not ESLint or Prettier), run automatically via `lint-staged`. `bun run check:code` runs linting, formatting, and import organization together.

- Double quotes for JS/TS strings
- 2-space indentation, LF line endings, UTF-8, final newline (`.editorconfig`)
- Max line length: 80 characters
- TypeScript strict mode plus `noUnusedLocals`, `noUnusedParameters`, etc. — do not disable these

See `CONVENTIONS.md` for additional architectural and style rules (e.g. no `useEffect` for data fetching, Hono handlers stay thin, early returns preferred).

---

## Commit Conventions

All commits **must** follow the gitmoji + conventional commits format, enforced by `commitlint` and `cz-git`:

```bash
bun run commit
# or: git cz
```

Husky hooks enforce this on every `git commit`. Headers are capped at 100 characters.

```sh
✨ feat(gates): add AI guidance for repeated failed attempts
🐛 fix(session): reject guesses submitted for a stale gate
♻️  refactor(hooks): extract useResetSession from useProgramPlay
📝 docs: update AGENTS.md
```

Do **not** bypass hooks with `--no-verify` unless documented.

### Branch naming

Branches follow `<git-commit-type>/<issue-id>-<kebab-case-brief-description>` (e.g. `fix/199-graphql-auth-status`). When a PR bundles multiple issues, use the primary issue's id. Omit the issue id for changes with no associated issue (e.g. `docs/agents-mise-activation`).

---

## AI Review on PRs

- **Greptile** — reviews each PR automatically, once, as the **first round** (config: `greptile.json`).
- **CodeRabbit** — the free tier only auto-reviews repos with 10+ stars. Until this repo
  qualifies, trigger CodeRabbit manually as a **second round, after Greptile feedback has been
  addressed and pushed**: `gh pr comment <n> --body "@coderabbitai full review"` (or click
  **Trigger review** in CodeRabbit's summary comment). Do not trigger it on PR open — Greptile
  reviews first, CodeRabbit reviews the amended diff. Config: `.coderabbit.yaml`.

---

## Testing

There are **three** tiers of tests:

1. **Unit / component tests** — co-located as `*.spec.ts` / `*.spec.tsx`, run by Vitest (`vite.config.ts`) with `happy-dom`. Shared helpers live in `src/react-app/test-utils/`; worker-side unit tests use plain Vitest with hand-built mock DB/Hono context objects (no real D1) via `src/worker/test-utils/mockEnv.ts` (`createMockEnv()`, `createMockHonoContext()`, `createMockGraphQLContext()`).
2. **Backend integration tests** — co-located as `*.integration.spec.ts` under `src/worker/graphql/gameplay/`, run via a separate config (`vitest.config.integration.ts`) using `@cloudflare/vitest-pool-workers`. These exercise the real Hono stack and a real (in-memory) D1 instance, applying actual migrations + seed SQL compiled directly from `scripts/seedE2eData.ts` (imported into the Node-side config, no file round-trip) per test file (`src/worker/test-utils/setupDb.ts`). Requests go through `src/worker/test-utils/gqlRequest.ts`, which calls the real worker `fetch()` entry point.
3. **E2E tests** — Playwright specs in `e2e/` (`smoke`, `gameplay`, `wrong-answer`, `clue`, `reset-flow`, `authoring`), driven by page objects in `e2e/pages/`. Locally these seed the dev D1 with `scripts/generated/seed-e2e.sql` (compiled from `scripts/seedE2eData.ts` via `bun run seed:e2e:local`) and run against `mise dev`; in CI they run against the live preview deployment URL for a PR (see Environments & Deployment below).

```bash
bun run test --run        # unit/component tests, single run
bun run test:integration  # backend integration tests (real D1)
bun run test:e2e          # E2E tests against local dev server
bun run coverage          # unit test coverage report (integration/E2E are excluded — see note below)
bun run test:ui           # browser-based Vitest UI
```

**Stack:** Vitest, `@cloudflare/vitest-pool-workers` (integration), Playwright (E2E), React Testing Library + happy-dom, MSW (HTTP mocking, e.g. GraphQL queries), `@testing-library/jest-dom`.

**Patterns:**
- Mock external modules at the top of the file with `vi.mock()`
- Use `createQueryWrapper` (`test-utils/queryTestUtils.tsx`) for hooks consuming TanStack Query
- Use `createTestRouter` / `renderWithRouter` (`test-utils/reactRouterUtils.tsx`) for route-level integration tests
- Mocks restore automatically (`clearMocks: true`, `restoreMocks: true` in `vite.config.ts` and `vitest.config.integration.ts`)
- Suppress expected `console.error` from React error boundaries with `vi.spyOn(console, "error").mockImplementation(() => {})` in `beforeEach`
- Integration specs share canonical query/mutation strings from `src/shared/gqlQueries.ts`

Route files prefixed with `-` (e.g. `-root.spec.tsx`, `-select.spec.tsx`, `-$programId.spec.tsx`) are test files, not real routes — TanStack Router's file-based routing ignores the `-` prefix.

V8 coverage (`vitest.config.ts`) is unit-test only, since `@cloudflare/vitest-pool-workers` runs in workerd and is incompatible with V8 coverage collection; integration coverage is not tracked separately. Coverage excludes `main.tsx`, `vite-env.d.ts`, `shared/schema.ts`, `shared/types.ts`, `shared/gqlQueries.ts`, `routeTree.gen.ts`, `worker/index.ts`, `worker/middleware/**`, `worker/routes/graphql.ts`, `react-app/routes/__root.tsx`, `react-app/api/queryClient.ts`, and `**/test-utils/**` (see `vite.config.ts` for the authoritative list).

---

## Database & Migrations

Schema lives in `src/shared/schema.ts` (Drizzle + single source of truth for DB and TS types). Seven tables:

- `programs` — top-level quiz sets
- `gates` — riddles within a program, ordered by `sequence_order` (unique per program)
- `session_progress` — per-session progression (`current_gate_id`, `attempt_count`, `status`), unique on `(session_id, program_id)`
- `session_completed_gates` — join table recording which gates a session has completed (`session_progress_id` + `gate_id`), unique on `(session_progress_id, gate_id)`. Replaced the earlier `completed_gate_ids` JSON column on `session_progress` (migration `0010_funny_santa_claus`)
- `gate_clues` — AI-generated clues, scoped to a `session_progress_id` + `gate_id`, unique per `(session_progress_id, gate_id, attempt_count_at_request)`
- `clue_rate_limits` — rolling per-session request window; one reservation row per (session, gate, attempt) so concurrent same-attempt requests cannot all reach AI
- `ai_usage` — global daily AI spend counter, keyed by UTC day (`usage_date` TEXT PK, `request_count`); backs the `AI_DAILY_CLUE_BUDGET` guardrail

There is **no** `game_state` table — it was dropped in migration `0009_whole_quasar` along with several now-unused columns on `gates`/`programs` (the game moved from a single shared "solved" state to fully session-scoped progression).

```bash
bun run migrate:generate   # after editing schema.ts
bun run migrate:local / migrate:preview / migrate:prod
```

Two D1 databases: `terminal-quest` (production, applied on push to `main`) and `terminal-quest-preview` (preview, applied on PR).

Local development (`mise dev`, `migrate:local`, `seed:local`) runs against a local sqlite file that miniflare keys off `preview_database_id ?? database_id`, so the top-level binding's `preview_database_id` names the local database — not `database_id`. It is load-bearing despite the explicit `env.preview` block; removing it orphans the existing local sqlite (see the comment in `wrangler.jsonc`).

---

## Environments & Deployment

| Environment | Trigger | Wrangler env | D1 database |
|---|---|---|---|
| Production | Push to `main` | _(default)_ | `terminal-quest` |
| Preview | Pull request | `preview` | `terminal-quest-preview` |

Fully automated via `.github/workflows/deploy.yml`; preview builds run with `CLOUDFLARE_ENV=preview` so the Vite plugin flattens the `env.preview` section into the built `dist/quiz_app/wrangler.json`, then `wrangler deploy --env preview` deploys it. The `deploy` job builds, migrates, and deploys, then marks the GitHub Deployment success/error by the deploy result alone. For non-fork PRs, a separate `e2e` job runs after deploy in the `mcr.microsoft.com/playwright` container (image tag auto-synced to the installed Playwright version), seeds the preview D1 with `scripts/generated/seed-e2e.sql` (compiled via `seed:e2e:preview`), and runs the Playwright E2E suite (`mise run test:e2e:ci`) against the live preview URL. The `e2e` job is a branch-protection-required status check: a failing run blocks the merge, but does not mark the GitHub Deployment as failed. `.github/workflows/preview-cleanup.yml` deletes the preview Worker on PR close.

Secrets required in GitHub Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `AUTH_TEST_BYPASS_SECRET`, `ADMIN_PAT`, `CODECOV_TOKEN`.

Releases use `semantic-release` + `semantic-release-gitmoji` with standard semver bumps derived from gitmoji (`:boom:` → major, `:sparkles:` → minor, `:bug:`/`:ambulance:`/`:lock:`/`:lipstick:`/`:zap:`/`:recycle:` → patch), tagged `v{version}`.

---

## Auth & Authoring

- **Authentication**: Better Auth, OAuth-only (Google + GitHub), self-hosted on the same Worker. Mounted at `/api/auth/*`. No passwords in MVP. Auth tables (`user`, `account`, `session`, `verification`) live in `src/shared/authSchema.ts` — separate Drizzle instance, never exposed via GraphQL.
- **Auth middleware** (`src/worker/middleware/auth.ts`): resolves Better Auth session cookie, sets `user` in Hono context. Parallel to `sessionMiddleware` (anonymous gameplay identity) — two identity systems, decoupled.
- **Route guard** (`src/react-app/routes/programs/-requireUser.ts`): `requireUser(queryClient, returnTo)` — fetches `me` query, throws TanStack Router `redirect` to `/login?return_to=...` if unauthenticated. Used by `/programs/manage` and `/programs/manage/$programId` routes.
- **Server-side authorization** (`src/worker/graphql/gameplay/authorizeProgram.ts`): `authorizeProgramMutation(db, programId, userId)` — fetches program, verifies `authorId === userId`, throws on null/mismatch. Used by 6 of 7 management mutations — all except `createProgram`, which has no existing program to authorize and instead uses `requireUser` + `assertVisibility`.
- **Management mutations** (in `src/worker/graphql/gameplay/programMutations.ts`,
  `gateMutations.ts`, `reorderGatesMutation.ts`, shared auth/validation helpers in
  `managementHelpers.ts`): `createProgram`, `updateProgram`, `deleteProgram`,
  `createGate`, `updateGate`, `deleteGate`, `reorderGates`. All auth-guarded,
  input-validated.
- **Program visibility**: `public` (listed for everyone) or `unlisted` (not listed, playable by direct link). Managed via `visibility` column on `programs` table. Copy-link affordance in management UI.
- **`program(id)` query**: returns a program by ID without auth check — unlisted programs are playable via direct link (security-through-obscurity, same model as unlisted YouTube videos). No ACL; add one via backlogged join table if needed later.
- **Login redirect safety** (`src/react-app/routes/login.tsx`): `validateReturnTo()` parses URL, rejects cross-origin, protocol-relative, and backslash-based variants. `isAllowedPath()` checks against allowlist. Falls back to `/programs/select` on invalid input.
- **Auth test bypass**: `AUTH_TEST_BYPASS_ENABLED` flag + `AUTH_TEST_BYPASS_SECRET` for CI/preview E2E. Fail-closed — not enabled based on `ENVIRONMENT !== "production"`. Uses build-time conditional where possible.

---

## Key Domain Concepts

- **Program** — a named collection of gates a player works through in sequence
- **Gate** — a riddle with `question`, `correctAnswer`, `successMessage`, optional AI guidance (`guidanceEnabled`, `guidanceThreshold`)
- **`sequenceOrder`** — ordering within a program, enforced by a unique index on `(programId, sequenceOrder)`
- **Guess acceptance** — Levenshtein similarity ≥ a per-gate `acceptanceThreshold` (default 0.875) via `leven`, checked server-side in `src/worker/utils/isGuessCloseEnough.ts`
- **Session ID** — minted server-side into the HttpOnly `anon_gameplay_session` cookie (`Path=/api`, `Secure` outside development) by `sessionMiddleware`; never client-generated or sent as a header. Mutations additionally require the constant `x-session-id` same-origin tripwire header (enforced by `requireSessionHeader`)
- **`submitGuess`** — the authoritative gameplay mutation. It re-validates that the session's `session_progress.currentGateId` matches the submitted `gateId` before checking the guess, rejecting mismatches as a "desync" error. This is what prevents a session from submitting guesses for gates it hasn't reached (IDOR protection) — do not weaken this check
- **Clue system** — `requestClue` generates an AI hint via Cloudflare Workers AI once `attemptCount` meets a gate's `guidanceThreshold`; eligibility rules (attempt threshold, per-gate cap of `MAX_CLUES_PER_GATE = 3`, no duplicate clue per attempt count) live in `src/worker/graphql/gameplay/clueEligibility.ts` and must stay in sync with any clue-flow changes. A global daily budget guardrail (`AI_DAILY_CLUE_BUDGET`, default 150, tracked in `ai_usage` via `src/worker/graphql/gameplay/aiBudget.ts`) rejects new generations with `isAiBudgetExhausted: true` once the UTC day's successful-generation count reaches the cap — checked before the rate-limit claim, incremented only after a clue is stored
- **`resetSession`** — clears a session's progress (and its `session_completed_gates` / `gate_clues` rows) on a program, used by both "Play again" and "Select new program" (after a `TerminalConfirmModal` confirmation) at the end of a program

---

## What to Avoid

- Do not use `npm`, `yarn`, or `pnpm` — this project uses `bun` exclusively
- Do not add ESLint or Prettier — Biome handles both
- Do not write tests without proper mock cleanup; rely on the global `clearMocks`/`restoreMocks` config in `vite.config.ts` / `vitest.config.integration.ts`
- Do not skip `bun run migrate:generate` after schema changes; never hand-edit migration SQL files
- Do not hardcode environment-specific values; use Wrangler bindings and environment variables
- Do not bypass commit hooks without a documented reason
- Do not weaken the `currentGateId` check in `submitGuess` — it's what makes session-scoped guess submission safe against a session guessing gates out of order
- Do not introduce a REST or client-only gameplay path — GraphQL is the single source of truth for progression
- Do not reintroduce a shared/global `game_state`-style table — progression is session-scoped only
- Do not expose Better Auth tables through the auto-GraphQL schema — keep `authSchema.ts` on its own Drizzle instance, never passed to `buildSchema()`
- Do not weaken `authorizeProgramMutation()` — every management mutation operating on an existing program/gate must re-verify `authorId` server-side (all except `createProgram`), never trust client-supplied program/gate IDs without ownership check
- Do not introduce REST endpoints for authoring — management mutations are GraphQL only, same as gameplay
- Do not allow open redirects in `/login` — `validateReturnTo()` must reject cross-origin, protocol-relative, and backslash-based return_to values
- Do not define GraphQL query/mutation strings inline in frontend files — they belong in `src/shared/gqlQueries.ts` and are imported by hooks/api files and integration tests.
- Do not use inline `style={}` props on React elements — all styling must go in a co-located `ComponentName.module.css` file with CSS Module class names. Applies to all new components and any changes to existing component markup.
- Do not reintroduce inline `<script>`/`<style>` blocks in `index.html` — a strict CSP is served from `public/_headers` (applied to all static assets), which blocks inline scripts/styles. The boot fallback script and CSS live in `public/boot.js` / `public/boot.css`; any new third-party script requires a deliberate CSP directive change.
