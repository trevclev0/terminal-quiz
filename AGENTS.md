# Terminal Quiz — Agent Context

## Project Overview

Terminal Quiz is a full-stack SPA built with React + Vite on the frontend and Hono on the backend, deployed as a Cloudflare Worker. It is a terminal-aesthetic quiz/puzzle game where players answer riddles ("gates") in sequence to advance through a "program". State is persisted in Cloudflare D1 (SQLite) on the server and cached in `localStorage` (via MessagePack encoding) on the client.

Live deployment: `https://quiz.clevertrevor.dev`

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Backend | Hono 4, Cloudflare Workers |
| Database | Cloudflare D1 (SQLite), Drizzle ORM |
| Package manager | pnpm |
| Linter / Formatter | Biome |
| Testing | Vitest, React Testing Library, MSW (mock service worker) |
| Commits | cz-git + commitlint (gitmoji + conventional commits) |
| Releases | semantic-release (CalVer: `YYYY.MM.DD`) |
| CI/CD | GitHub Actions (`.github/workflows/`) |

---

## Local Development Setup

```bash
# Install dependencies (requires pnpm — see .tool-versions for Node/pnpm versions)
pnpm install

# Start the dev server (Vite + Cloudflare Worker via @cloudflare/vite-plugin)
pnpm dev

# Copy and fill in the local D1 database URL
cp .env.example .env
# Then set DRIZZLE_DATABASE_URL to the local .wrangler SQLite file path

# Apply migrations locally
pnpm migrate:local

# Seed local database
pnpm seed:local
```

The dev server opens automatically at `http://localhost:5173`.

---

## Common Commands

```bash
# Run all tests (with happy-dom environment)
pnpm test

# Run tests with coverage report
pnpm coverage

# Run tests in UI mode
pnpm test:ui

# Lint, format, and check the whole project
pnpm check

# Lint only
pnpm lint

# Format only
pnpm format

# Type-check and build (frontend + worker bundle)
pnpm build

# Preview the production build locally
pnpm preview

# Deploy to production
pnpm deploy

# Upload a preview version (Cloudflare versioning)
pnpm deploy:preview

# Generate a new Drizzle migration after schema changes
pnpm migrate:generate

# Apply migrations to preview D1
pnpm migrate:preview

# Apply migrations to production D1
pnpm migrate:prod
```

---

## Project Structure

```sh
.
├── migrations/          # Drizzle SQL migration files + metadata snapshots
├── public/              # Static assets (SVG favicon, etc.)
├── scripts/             # One-off scripts (e.g. seed SQL generation)
├── src/
│   ├── components/      # React components (ErrorBoundary, Program, ProgramSelector, Riddle)
│   ├── contexts/        # React contexts (ProgramDataContext)
│   ├── db/              # Drizzle schema + inferred TypeScript types
│   ├── hooks/           # Custom hooks (useProgramStorage, useRiddleGuess, useShake, etc.)
│   ├── middleware/       # Hono middleware (DB setup)
│   ├── routes/          # Hono route handlers (programs, gates)
│   ├── services/        # Business logic (gateService: guess processing)
│   ├── utils/           # Pure utility functions (dataManager, isGuessCloseEnough, etc.)
│   ├── App.tsx          # Root React component
│   ├── entry.ts         # Hono app entry point (Worker)
│   └── index.tsx        # React DOM bootstrap
├── tests/               # Shared test helpers and setup
│   ├── createProgramDataWrapper.tsx
│   ├── setupTests.ts
│   └── testTypes.ts
├── biome.json           # Biome linter/formatter config
├── drizzle.config.ts    # Drizzle Kit config (reads DRIZZLE_DATABASE_URL from .env)
├── vite.config.ts       # Vite + Vitest config
└── wrangler.jsonc       # Cloudflare Worker + D1 binding config
```

---

## Code Style

This project uses **Biome** (not ESLint or Prettier). Before committing, Biome is run automatically via `lint-staged`. The `pnpm check` command runs linting, formatting, and import organization together.

Key style rules enforced by Biome and the project:
- Double quotes for JS/TS strings (`"quoteStyle": "double"`)
- Spaces for indentation (2 spaces)
- LF line endings, UTF-8, final newline (see `.editorconfig`)
- Max line length: 80 characters

TypeScript is configured with strict mode (`"strict": true`) and additional strictness flags (`noUnusedLocals`, `noUnusedParameters`, etc.). Do not disable these.

---

## Commit Conventions

All commits **must** follow the gitmoji + conventional commits format enforced by `commitlint` and `cz-git`. Use the interactive commit helper:

```bash
pnpm commit
# or: git cz
```

The Husky hooks enforce this on every `git commit`. Headers are capped at 100 characters. Gitmoji emoji appear at the left of the subject line.

Examples:
```sh
✨ feat(gates): add AI guidance for repeated failed attempts
🐛 fix(dataManager): handle corrupt localStorage gracefully
♻️  refactor(hooks): extract clearActiveProgram from useProgramStorage
📚 docs: update AGENTS.md
```

Do **not** bypass hooks with `--no-verify` unless you have a documented reason.

---

## Testing

Tests live co-located with source files as `*.spec.ts` / `*.spec.tsx`. Shared helpers are in `tests/`.

```bash
pnpm test          # watch mode
pnpm coverage      # single run with V8 coverage
```

**Testing stack:**
- **Vitest** — test runner and assertions
- **React Testing Library + happy-dom** — component rendering
- **MSW** — HTTP mocking for `dataManager` tests (avoids hitting real network)
- **@testing-library/jest-dom** — extended DOM matchers

**Patterns to follow:**
- Mock external modules at the top of the test file using `vi.mock()`
- Use `createProgramDataWrapper` from `tests/createProgramDataWrapper.tsx` to wrap hooks that consume `ProgramDataContext`
- Use `defaultNullishGateProps` and `defaultNullishProgramProps` from `tests/testTypes.ts` when constructing `Gate` or `Program` fixtures
- Always restore mocks in `afterEach` (already handled globally by `vite.config.ts` `restoreMocks: true`)
- Suppress expected `console.error` output with `vi.spyOn(console, 'error').mockImplementation(() => {})` in `beforeEach` where React or boundaries will fire it

Coverage is reported to Codecov via CI. `src/index.tsx` and `src/App.tsx` are excluded from coverage.

---

## Database & Migrations

The database schema is in `src/db/schema.ts` (Drizzle + drizzle-zod). After editing the schema, generate a migration:

```bash
pnpm migrate:generate
```

This produces a new file in `migrations/` and a snapshot in `migrations/meta/`. Commit both. Migrations are applied automatically during CI deployment via `wrangler d1 migrations apply`.

There are two D1 databases:
- **Production**: `terminal-quest` (applied on push to `main`)
- **Preview**: `terminal-quest-preview` (applied on PR)

---

## Environments & Deployment

| Environment | Trigger | Wrangler env | D1 database |
|---|---|---|---|
| Production | Push to `main` | _(default)_ | `terminal-quest` |
| Preview | Pull request | `preview` | `terminal-quest-preview` |

Deployment is fully automated via `.github/workflows/deploy.yml`. For preview deploys, the workflow patches `wrangler.json` to route to the preview D1 before deploying.

Secrets required in GitHub Actions:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CODECOV_TOKEN`

---

## Key Domain Concepts

- **Program** — a named collection of gates (puzzles) that a player works through in sequence
- **Gate** — a single riddle/puzzle with a `question`, `correctAnswer`, `successMessage`, and optional AI guidance
- **`isSolved`** — boolean on each gate; once true, the gate is locked open for that player
- **`sequenceOrder`** — integer ordering of gates within a program; enforced by a unique index `(programId, sequenceOrder)`
- **`activeProgram`** — the single `Program` with `isSelected: true`; derived client-side from the programs list
- **Guess acceptance** — uses Levenshtein distance (`leven`) with a similarity threshold of 0.875 (`isGuessCloseEnough`)
- **Client-side caching** — programs are serialized with MessagePack and stored in `localStorage` under key `"programs"`; corrupt entries are cleared and re-fetched from `/api/programs`

---

## What to Avoid

- Do not use `npm` or `yarn` — this project uses `pnpm` exclusively
- Do not add ESLint or Prettier — Biome handles both
- Do not write tests without proper mock cleanup; always use `vi.restoreAllMocks()` or rely on the global `restoreMocks: true` config
- Do not skip the `pnpm migrate:generate` step after schema changes; never hand-edit migration SQL files
- Do not hardcode environment-specific values; use Wrangler bindings and environment variables
- Do not bypass commit hooks without a documented reason
