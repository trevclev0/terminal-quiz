# Terminal Quiz — Agent Context

## Project Overview

Terminal Quiz is a full-stack SPA: React + TanStack Router on the frontend, Hono on the backend, deployed as a single Cloudflare Worker. It's a terminal-aesthetic riddle/puzzle game where players advance through a "program" (an ordered set of "gates") by answering correctly.

Live deployment: `https://quiz.clevertrevor.dev`

The app currently has **two parallel gameplay flows**:

1. **`/` (legacy, fully working)** — `App.tsx` fetches all programs+gates once via REST (`GET /api/programs`), then manages all progression client-side through a TanStack Query cache (selecting/solving/resetting a program just mutates the query cache — no further server writes). State persists across reloads in IndexedDB (via `idb-keyval`, MessagePack-encoded) through `PersistQueryClientProvider`.
2. **`/select` (newer, backend-driven, under construction)** — loads a lightweight program list via GraphQL, intended to track per-session progression server-side (current gate, completed gates, attempt counts) via the `session_progress` table and an `x-session-id` header. Not finished — see "Known Gaps" below.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, TanStack Router |
| Backend | Hono 4, Cloudflare Workers |
| API | REST (Hono RPC) + GraphQL (`drizzle-graphql` auto-schema + custom gameplay resolvers) |
| Database | Cloudflare D1 (SQLite), Drizzle ORM |
| Client cache/state | TanStack Query v5, persisted to IndexedDB (`idb-keyval` + MessagePack) |
| Package manager | pnpm |
| Linter / Formatter | Biome |
| Testing | Vitest, React Testing Library, MSW, happy-dom |
| Commits | cz-git + commitlint (gitmoji + conventional commits), Husky |
| Releases | semantic-release (CalVer: `YYYY.MM.DD`) |
| CI/CD | GitHub Actions (`.github/workflows/`) |

---

## Local Development Setup

```bash
pnpm install

pnpm dev

cp .env.example .env
# Set DRIZZLE_DATABASE_URL to the local .wrangler SQLite file path

pnpm migrate:local
pnpm seed:local
```

Dev server: `http://localhost:5173`.

---

## Common Commands

```bash
pnpm test               # watch mode
pnpm coverage           # single run with V8 coverage
pnpm test:ui            # Vitest browser UI

pnpm lint               # biome lint .
pnpm format             # biome format --write .
pnpm check:code         # biome check --write . (lint + format + import sort)
pnpm check              # build + wrangler deploy --dry-run (pre-deploy sanity check)

pnpm build              # tsc -b && vite build
pnpm preview            # build, then vite preview

pnpm deploy             # wrangler deploy (production)
pnpm deploy:preview     # wrangler versions upload --remote

pnpm migrate:generate   # drizzle-kit generate, after editing schema.ts
pnpm migrate:local      # apply migrations to local D1 file
pnpm migrate:preview    # apply to preview D1
pnpm migrate:prod       # apply to production D1

pnpm seed:local / seed:preview / seed:prod   # wrangler d1 execute --file=scripts/seed.sql

pnpm commit             # git-cz, interactive commit prompt (preferred over `git commit`)
pnpm cf-typegen         # wrangler types, regenerates worker-configuration.d.ts
```

---

## Project Structure

```sh
.
├── migrations/              # Drizzle SQL migrations + meta/ snapshots
├── public/                  # Static assets
├── scripts/                 # One-off scripts (e.g. seed.sql, git-ignored)
├── src/
│   ├── react-app/
│   │   ├── api/
│   │   │   ├── client.ts                # Hono RPC client
│   │   │   ├── graphQlClient.ts         # generic GraphQL fetch helper (adds x-session-id)
│   │   │   ├── queryClient.ts           # TanStack QueryClient + IndexedDB persister
│   │   │   ├── queryKeys.ts
│   │   │   └── queries/
│   │   │       ├── useProgramsQuery.ts          # GraphQL, lightweight — used by /select
│   │   │       └── useProgramsWithGatesQuery.ts # REST, full gates — used by /
│   │   ├── components/      # ErrorBoundary, Gate, ProgramSelector, ProgramWithGates(Selector)
│   │   ├── hooks/           # useGateGuess, usePrograms, useProgramsWithGates, useProgressionScroll, useShake
│   │   ├── routes/          # TanStack file-based routes: __root, index ("/"), select ("/select")
│   │   ├── test-utils/      # setupTests, queryTestUtils, reactRouterUtils, testTypes
│   │   ├── utils/           # getGatesToRender, isGuessCloseEnough, session (client sessionId)
│   │   ├── App.tsx          # "/" root component
│   │   └── main.tsx         # bootstrap: ErrorBoundary + PersistQueryClientProvider + RouterProvider
│   ├── shared/
│   │   ├── schema.ts        # Drizzle schema — single source of truth for DB + types
│   │   └── types.ts         # Program, Gate, ProgramWithGates (inferred from schema)
│   └── worker/
│       ├── index.ts              # Hono entry, mounts /api/{graphql,programs,gates}
│       ├── middleware/           # db (Drizzle setup), logger, session (reads x-session-id)
│       ├── routes/               # gates.ts, graphql.ts, programs.ts
│       ├── graphql/gameplay/     # getProgramProgression query, submitGuess mutation, types
│       ├── services/             # gateService.ts (REST guess-processing, race-safe)
│       └── utils/                # errorHandler, isGuessCloseEnough
├── biome.json
├── commitlint.config.ts
├── drizzle.config.ts
├── release.config.mjs
├── vite.config.ts
└── wrangler.jsonc
```

> There is no `contexts/` directory — state is handled via TanStack Query, not React Context.

---

## Code Style

This project uses **Biome** (not ESLint or Prettier), run automatically via `lint-staged`. `pnpm check:code` runs linting, formatting, and import organization together.

- Double quotes for JS/TS strings
- 2-space indentation, LF line endings, UTF-8, final newline (`.editorconfig`)
- Max line length: 80 characters
- TypeScript strict mode plus `noUnusedLocals`, `noUnusedParameters`, etc. — do not disable these

---

## Commit Conventions

All commits **must** follow the gitmoji + conventional commits format, enforced by `commitlint` and `cz-git`:

```bash
pnpm commit
# or: git cz
```

Husky hooks enforce this on every `git commit`. Headers are capped at 100 characters.

```sh
✨ feat(gates): add AI guidance for repeated failed attempts
🐛 fix(dataManager): handle corrupt localStorage gracefully
♻️  refactor(hooks): extract clearActiveProgram from useProgramStorage
📚 docs: update AGENTS.md
```

Do **not** bypass hooks with `--no-verify` unless documented.

---

## Testing

Tests are co-located with source as `*.spec.ts` / `*.spec.tsx`. Shared helpers live in `src/react-app/test-utils/`; worker tests use plain Vitest with hand-built mock DB objects (no real D1 in unit tests).

```bash
pnpm test          # watch mode
pnpm coverage      # single run with V8 coverage
```

**Stack:** Vitest, React Testing Library + happy-dom, MSW (HTTP mocking, e.g. GraphQL queries in `-select.spec.tsx`), `@testing-library/jest-dom`.

**Patterns:**
- Mock external modules at the top of the file with `vi.mock()`
- Use `createQueryWrapper` (`test-utils/queryTestUtils.tsx`) for hooks consuming TanStack Query
- Use `createTestRouter` / `renderWithRouter` (`test-utils/reactRouterUtils.tsx`) for route-level integration tests
- Use `defaultNullishGateProps` / `defaultNullishProgramProps` (`test-utils/testTypes.ts`) when building `Gate` / `Program` fixtures
- Mocks restore automatically (`restoreMocks: true` in `vite.config.ts`)
- Suppress expected `console.error` from React error boundaries with `vi.spyOn(console, "error").mockImplementation(() => {})` in `beforeEach`

Route files prefixed with `-` (e.g. `-root.spec.tsx`, `-select.spec.tsx`) are test files, not real routes — TanStack Router's file-based routing ignores the `-` prefix.

Coverage excludes `App.tsx`, `main.tsx`, `vite-env.d.ts`, `shared/schema.ts`, `shared/types.ts`, `routeTree.gen.ts`.

---

## Database & Migrations

Schema lives in `src/shared/schema.ts` (Drizzle + single source of truth for DB and TS types). Four tables:

- `programs` — top-level quiz sets
- `gates` — riddles within a program, ordered by `sequence_order` (unique per program)
- `game_state` — single-row table tracking last global update
- `session_progress` — per-session progression (`current_gate_id`, `completed_gate_ids` as a JSON string, `status`), unique on `(session_id, program_id)`

```bash
pnpm migrate:generate   # after editing schema.ts
pnpm migrate:local / migrate:preview / migrate:prod
```

Two D1 databases: `terminal-quest` (production, applied on push to `main`) and `terminal-quest-preview` (preview, applied on PR).

---

## Environments & Deployment

| Environment | Trigger | Wrangler env | D1 database |
|---|---|---|---|
| Production | Push to `main` | _(default)_ | `terminal-quest` |
| Preview | Pull request | `preview` | `terminal-quest-preview` |

Fully automated via `.github/workflows/deploy.yml`; preview deploys patch `wrangler.json` to route to the preview D1 before deploying.

Secrets required in GitHub Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `ADMIN_PAT`, `CODECOV_TOKEN`.

---

## Key Domain Concepts

- **Program** — a named collection of gates a player works through in sequence
- **Gate** — a riddle with `question`, `correctAnswer`, `successMessage`, optional AI guidance (`guidanceEnabled`, `guidancePrompt`, `guidanceThreshold`)
- **`isSolved`** — once true, locks the gate open (used by the `/` flow only)
- **`sequenceOrder`** — ordering within a program, enforced by a unique index on `(programId, sequenceOrder)`
- **`activeProgram`** — the `Program` with `isSelected: true`, derived client-side (`/` flow)
- **Guess acceptance** — Levenshtein similarity ≥ 0.875 via `leven`, implemented twice: `src/react-app/utils/isGuessCloseEnough.ts` (client-only `/` flow) and `src/worker/utils/isGuessCloseEnough.ts` (server-side checks)
- **Two unreconciled gameplay backends:**
  - `gateService.ts` (REST, `POST /api/gates/:id/guess`) mutates `gates.isSolved` directly — global per gate, not session-scoped
  - GraphQL `submitGuess` mutation tracks progression per session via `session_progress.completed_gate_ids`
  These are two different designs for the same problem; reconcile before treating `/select` as production-ready.
- **Client-side caching (`/` flow)** — programs+gates persisted via TanStack Query's `PersistQueryClientProvider`, using a custom `idb-keyval`-backed, MessagePack-encoded persister (`indexedDBMessagePackPersister`) — **IndexedDB, not localStorage**
- **Session ID** — generated client-side in `utils/session.ts`, stored in `localStorage` under `terminal_quiz_session_id` (falls back to an in-memory UUID if storage is unavailable), sent as `x-session-id` on GraphQL requests

---

## Known Gaps (as of this writing)

- `/select` + the GraphQL gameplay resolvers (`getProgramProgression`, `submitGuess`) are not feature-complete and not wired into a finished UI for actually playing through gates session-by-session
- The REST `gateService.ts` guess flow and the GraphQL `session_progress`-based flow overlap in purpose but track state differently — GraphQL is the preferred path moving forward, specifically once the `/select` flow is complete

---

## What to Avoid

- Do not use `npm` or `yarn` — this project uses `pnpm` exclusively
- Do not add ESLint or Prettier — Biome handles both
- Do not write tests without proper mock cleanup; rely on the global `restoreMocks: true` config
- Do not skip `pnpm migrate:generate` after schema changes; never hand-edit migration SQL files
- Do not hardcode environment-specific values; use Wrangler bindings and environment variables
- Do not bypass commit hooks without a documented reason
- Do not assume the `/select` GraphQL/session-progress flow is finished or production-ready — it's actively in progress