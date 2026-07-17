# Terminal Quiz — Agent Context

## Project Overview

Terminal Quiz is a full-stack SPA: React + TanStack Router on the frontend, Hono on the backend, deployed as a single Cloudflare Worker. It's a terminal-aesthetic riddle/puzzle game where players advance through a "program" (an ordered set of "gates") by answering correctly.

Live deployment: `https://quiz.clevertrevor.dev`

There is a **single, server-authoritative gameplay flow**: a session ID is generated client-side (`utils/session.ts`), persisted in `localStorage`, and sent as an `x-session-id` header on every GraphQL request. The server tracks per-session progression (current gate, completed gates, attempt count) in the `session_progress` table. All gameplay mutations — `submitGuess`, `requestClue`, `resetSession` — are resolved server-side and validated against that session's row. There is no client-only or REST-based flow.

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
| Testing | Vitest, React Testing Library, MSW, happy-dom |
| Commits | cz-git + commitlint (gitmoji + conventional commits), Husky |
| Releases | semantic-release + semantic-release-gitmoji (standard semver, tagged `v{version}`) |
| CI/CD | GitHub Actions (`.github/workflows/`) |
| Tool/task management | mise (`mise.toml` — wraps every `bun run` script as a `mise run` task) |

---

## Local Development Setup

```bash
mise install    # provisions bun pinned in mise.toml; if `bun` doesn't
                 # resolve after this, mise's shims aren't on PATH —
                 # run `mise activate` for your shell, or prefix
                 # commands with `mise exec --`

bun install

cp .env.example .env
# Set DRIZZLE_DATABASE_URL to the local .wrangler SQLite file path

cp .dev.vars.example .dev.vars
# Set CLOUDFLARE_API_TOKEN (needed for local Workers AI calls) and ENVIRONMENT

bun run dev

bun run migrate:local
bun run seed:local
```

Dev server: `http://localhost:5173`.

---

## Common Commands

```bash
bun run test --run      # run tests once
bun run coverage        # single run with V8 coverage

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

bun run seed:local / seed:preview / seed:prod   # wrangler d1 execute --file=scripts/seed.sql

bun run commit           # git-cz, interactive commit prompt (preferred over `git commit`)
bun run cf-typegen       # wrangler types, regenerates worker-configuration.d.ts
```

> Every command above also has a matching `mise run <task>` alias defined in `mise.toml` (e.g. `mise run test:run`, `mise run check:code`).

---

## Project Structure

```sh
.
├── migrations/                  # Drizzle SQL migrations + meta/ snapshots
├── public/                      # Static assets
├── scripts/                     # One-off scripts (e.g. seed.sql, git-ignored)
├── src/
│   ├── react-app/
│   │   ├── api/
│   │   │   ├── graphQlClient.ts             # generic GraphQL fetch helper (adds x-session-id)
│   │   │   ├── queryClient.ts               # TanStack QueryClient setup
│   │   │   ├── queryKeys.ts
│   │   │   ├── queries/                     # useProgramsQuery, useProgramProgressionQuery,
│   │   │   │                                # useInProgressProgramQuery
│   │   │   └── mutations/                   # useSubmitGuessMutation, useRequestClueMutation
│   │   ├── components/       # ActiveGate, CompletedGate, ErrorBoundary, ProgramPlay,
│   │   │                     # ProgramSelector, TerminalConfirmModal
│   │   ├── hooks/             # useProgramPlay, usePrograms, useProgressionScroll,
│   │   │                     # useResetSession, useShake
│   │   ├── routes/            # TanStack file-based routes: __root, index ("/"),
│   │   │                     # programs/select, programs/$programId
│   │   ├── test-utils/        # setupTests, queryTestUtils, reactRouterUtils, cssModuleMock
│   │   └── main.tsx           # bootstrap: ErrorBoundary + QueryClientProvider + RouterProvider
│   ├── shared/
│   │   ├── schema.ts          # Drizzle schema — single source of truth for DB + types
│   │   └── types.ts           # Program, Gate, and related types (inferred from schema)
│   └── worker/
│       ├── index.ts                # Hono entry, mounts /api/graphql
│       ├── middleware/             # db (Drizzle setup), logger, session (reads x-session-id)
│       ├── routes/                 # graphql.ts — builds and serves the GraphQL schema
│       ├── graphql/gameplay/       # queries.ts, mutations.ts, clueEligibility.ts, types.ts
│       └── services/                # aiService.ts — Workers AI clue generation
├── biome.json
├── commitlint.config.ts
├── drizzle.config.ts
├── release.config.mjs
├── vite.config.ts
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
📚 docs: update AGENTS.md
```

Do **not** bypass hooks with `--no-verify` unless documented.

---

## Testing

Tests are co-located with source as `*.spec.ts` / `*.spec.tsx`. Shared helpers live in `src/react-app/test-utils/`; worker tests use plain Vitest with hand-built mock DB/Hono context objects (no real D1 in unit tests) via `src/worker/test-utils/mockEnv.ts` (`createMockEnv()`, `createMockHonoContext()`).

```bash
bun run test --run      # run tests once
bun run coverage        # single run with V8 coverage
```

**Stack:** Vitest, React Testing Library + happy-dom, MSW (HTTP mocking, e.g. GraphQL queries), `@testing-library/jest-dom`.

**Patterns:**
- Mock external modules at the top of the file with `vi.mock()`
- Use `createQueryWrapper` (`test-utils/queryTestUtils.tsx`) for hooks consuming TanStack Query
- Use `createTestRouter` / `renderWithRouter` (`test-utils/reactRouterUtils.tsx`) for route-level integration tests
- Mocks restore automatically (`clearMocks: true`, `restoreMocks: true` in `vite.config.ts`)
- Suppress expected `console.error` from React error boundaries with `vi.spyOn(console, "error").mockImplementation(() => {})` in `beforeEach`

Route files prefixed with `-` (e.g. `-root.spec.tsx`, `-select.spec.tsx`, `-$programId.spec.tsx`) are test files, not real routes — TanStack Router's file-based routing ignores the `-` prefix.

Coverage excludes `main.tsx`, `vite-env.d.ts`, `shared/schema.ts`, `shared/types.ts`, `routeTree.gen.ts`, `worker/index.ts`, `worker/middleware/**`, `worker/test-utils/**`, and `react-app/api/queryClient.ts` (see `vite.config.ts` for the authoritative list).

---

## Database & Migrations

Schema lives in `src/shared/schema.ts` (Drizzle + single source of truth for DB and TS types). Five tables:

- `programs` — top-level quiz sets
- `gates` — riddles within a program, ordered by `sequence_order` (unique per program)
- `game_state` — single-row table tracking last global update
- `session_progress` — per-session progression (`current_gate_id`, `completed_gate_ids` as a JSON string, `attempt_count`, `status`), unique on `(session_id, program_id)`
- `gate_clues` — AI-generated clues, scoped to a `session_progress_id` + `gate_id`, unique per `(session_progress_id, gate_id, attempt_count_at_request)`

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

Fully automated via `.github/workflows/deploy.yml`; preview builds run with `CLOUDFLARE_ENV=preview` so the Vite plugin flattens the `env.preview` section into the built `dist/quiz_app/wrangler.json`, then `wrangler deploy --env preview` deploys it.

Secrets required in GitHub Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ADMIN_PAT`, `CODECOV_TOKEN`.

Releases use `semantic-release` + `semantic-release-gitmoji` with standard semver bumps derived from gitmoji (`:boom:` → major, `:sparkles:` → minor, `:bug:`/`:ambulance:`/`:lock:`/`:lipstick:`/`:zap:`/`:recycle:` → patch), tagged `v{version}`.

---

## Key Domain Concepts

- **Program** — a named collection of gates a player works through in sequence
- **Gate** — a riddle with `question`, `correctAnswer`, `successMessage`, optional AI guidance (`guidanceEnabled`, `guidancePrompt`, `guidanceThreshold`)
- **`sequenceOrder`** — ordering within a program, enforced by a unique index on `(programId, sequenceOrder)`
- **Guess acceptance** — Levenshtein similarity ≥ a per-gate `acceptanceThreshold` (default 0.875) via `leven`, checked server-side in `src/worker/utils/isGuessCloseEnough.ts`
- **Session ID** — generated client-side in `utils/session.ts`, stored in `localStorage` under `terminal_quiz_session_id` (falls back to an in-memory UUID if storage is unavailable), sent as `x-session-id` on every GraphQL request
- **`submitGuess`** — the authoritative gameplay mutation. It re-validates that the session's `session_progress.currentGateId` matches the submitted `gateId` before checking the guess, rejecting mismatches as a "desync" error. This is what prevents a session from submitting guesses for gates it hasn't reached (IDOR protection) — do not weaken this check
- **Clue system** — `requestClue` generates an AI hint via Cloudflare Workers AI once `attemptCount` meets a gate's `guidanceThreshold`; eligibility rules (attempt threshold, per-gate cap of `MAX_CLUES_PER_GATE = 3`, no duplicate clue per attempt count) live in `src/worker/graphql/gameplay/clueEligibility.ts` and must stay in sync with any clue-flow changes
- **`resetSession`** — clears a session's progress on a program, used by both "Play again" and "Select new program" (after a `TerminalConfirmModal` confirmation) at the end of a program

---

## What to Avoid

- Do not use `npm`, `yarn`, or `pnpm` — this project uses `bun` exclusively
- Do not add ESLint or Prettier — Biome handles both
- Do not write tests without proper mock cleanup; rely on the global `clearMocks`/`restoreMocks` config in `vite.config.ts`
- Do not skip `bun run migrate:generate` after schema changes; never hand-edit migration SQL files
- Do not hardcode environment-specific values; use Wrangler bindings and environment variables
- Do not bypass commit hooks without a documented reason
- Do not weaken the `currentGateId` check in `submitGuess` — it's what makes session-scoped guess submission safe against a session guessing gates out of order
- Do not introduce a REST or client-only gameplay path — GraphQL is the single source of truth for progression
