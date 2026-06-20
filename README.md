# Terminal Quiz

A terminal-aesthetic riddle and puzzle application built on Cloudflare's edge platform. Users select a "program" (a set of riddles) and work through sequential "gates" (individual riddles/puzzles), each requiring a correct passphrase to unlock the next.

Live at **[quiz.clevertrevor.dev](https://quiz.clevertrevor.dev)**

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [Database](#database)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## Features

- **Sequential gate progression** — riddles unlock one at a time; solving a gate reveals the next
- **Fuzzy answer matching** — accepts answers within a configurable Levenshtein distance threshold (default: 87.5% similarity), tolerating minor typos
- **Guided hints** — optional per-gate guidance that surfaces a clue after a configurable number of failed attempts
- **Offline-capable** — program and gate state is cached in IndexedDB (MessagePack-encoded), surviving page refreshes and brief connectivity loss
- **Terminal aesthetic** — monospace, green-on-black UI faithful to classic terminal interfaces

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, TanStack Router |
| Backend | Hono 4, Cloudflare Workers |
| Database | Cloudflare D1 (SQLite), Drizzle ORM |
| Client cache | TanStack Query v5, persisted to IndexedDB via `idb-keyval` + MessagePack |
| Testing | Vitest, React Testing Library, MSW, happy-dom |
| Linting / Formatting | Biome |
| Commits | cz-git + commitlint, gitmoji, Husky |
| CI / CD | GitHub Actions |
| Releases | semantic-release + semantic-release-gitmoji |
| Package Manager | pnpm |

---

## Architecture

```bash
src/
├── react-app/      # Vite-built SPA (served as static assets)
│   ├── api/        # TanStack Query client/hooks, Hono RPC client
│   ├── components/ # React components
│   ├── hooks/       
│   ├── routes/      # TanStack file-based routes
│   ├── utils/       
│   └── test-utils/ 
├── shared/
│   ├── schema.ts   # Drizzle schema (single source of truth for DB + types)
│   └── types.ts    
└── worker/
    ├── middleware/  
    ├── routes/      
    └── services/    
```

**Request flow:**

1. The Cloudflare Worker serves the static React SPA via the `assets` binding.
2. On load, the SPA fetches all programs and their gates once via `GET /api/programs`.
3. From there, all gameplay — selecting a program, solving gates, resetting progress — is handled entirely client-side against a TanStack Query cache. No further writes hit the server during play.
4. That cache is persisted to IndexedDB (MessagePack-encoded) between sessions, so progress survives reloads.

> A second, backend-driven flow (server-tracked progression via GraphQL, starting at `/select`) is in active development and will eventually become the default once it's feature-complete.

---

## Getting Started

### Prerequisites

- **Node.js** `>=22.0.0` (see `.tool-versions` for the pinned version; [mise](https://mise.jdx.dev/) or [asdf](https://asdf-vm.com/) recommended)
- **pnpm** (version pinned in `package.json`)
- A [Cloudflare account](https://dash.cloudflare.com/) with Workers and D1 enabled (for deployment; local dev uses a local SQLite file)

### Installation

```bash
git clone <repo-url>
cd terminal-quiz
pnpm install
```

### Environment setup

Copy the example env file and point it at your local D1 SQLite file. Wrangler generates this file when you run the local dev server for the first time.

```bash
cp .env.example .env
# Edit .env and set DRIZZLE_DATABASE_URL to the path printed by wrangler
```

The typical path looks like:
```bash
DRIZZLE_DATABASE_URL=.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<HASH>.sqlite
```

### Local development

```bash
pnpm dev
```

This starts the Vite dev server with the Cloudflare plugin, which runs both the React SPA and the Worker locally via Miniflare. The app is available at `http://localhost:5173` by default.

### Seed the local database

After starting dev at least once (so Wrangler creates the local D1 file):

```bash
pnpm migrate:local   # Apply schema migrations
pnpm seed:local      # Populate with initial program/gate data
```

---

## Development

### Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start local dev server (Vite + Cloudflare Worker via Miniflare) |
| `pnpm build` | Type-check and build both the client and worker bundles |
| `pnpm check` | Build and run a wrangler dry-run deploy (pre-deploy sanity check) |
| `pnpm check:code` | Run Biome linting and formatting checks, auto-fixing where safe |
| `pnpm test` | Run the Vitest test suite in watch mode |
| `pnpm coverage` | Run the full test suite and generate a coverage report |
| `pnpm test:ui` | Open the Vitest browser UI |
| `pnpm commit` | Launch the interactive Commitizen prompt (preferred over `git commit`) |
| `pnpm cf-typegen` | Regenerate Wrangler/Workers type bindings |

### Code style

Biome handles both linting and formatting. Configuration lives in `biome.json`. The pre-commit hook runs Biome and any tests related to staged files via lint-staged.

### Commit conventions

Commits follow the [gitmoji](https://gitmoji.dev/) convention, enforced by commitlint. Use `pnpm commit` to get an interactive prompt rather than writing the commit message by hand. The CI pipeline validates commit messages on pull requests.

---

## Testing

The project uses Vitest with happy-dom as the test environment.

```bash
pnpm test          # Watch mode
pnpm coverage      # Single run with coverage (outputs to ./coverage)
pnpm test:ui       # Browser-based Vitest UI
```

### Testing approach

- **Unit tests** for pure utilities (`isGuessCloseEnough`, `getGatesToRender`, etc.)
- **Hook tests** using `renderHook` from React Testing Library, with TanStack Query wrappers and MSW for API mocking where needed
- **Component tests** using React Testing Library, with module-level `vi.mock` calls to isolate dependencies
- **Worker/service tests** using plain Vitest with manually constructed mock DB objects

Test utilities live in `src/react-app/test-utils/`:

| File | Purpose |
|---|---|
| `setupTests.ts` | Global setup — imports jest-dom matchers, registers `afterEach` cleanup |
| `queryTestUtils.tsx` | Factory for a fresh `QueryClient` + `QueryClientProvider` wrapper per test |
| `reactRouterUtils.tsx` | Factory for a test router + render helper for route-level integration tests |
| `testTypes.ts` | Shared default values for nullable fields on `Gate` and `Program` fixtures |

Coverage is collected for all files under `src/` except entry points, the Drizzle schema, and shared type definitions.

---

## Database

Schema is defined in `src/shared/schema.ts` using Drizzle ORM and is the single source of truth for both the database structure and the TypeScript types.

### Tables

| Table | Purpose |
|---|---|
| `programs` | Top-level quiz sets; each has a name and a selected/completed status |
| `gates` | Individual riddles belonging to a program, ordered by `sequence_order` |
| `game_state` | Single-row table tracking when the game state last changed |

### Migration workflow

```bash
# Generate a new migration after editing schema.ts
pnpm migrate:generate

# Apply migrations
pnpm migrate:local    # Local D1 file (development)
pnpm migrate:preview  # Remote preview D1 database
pnpm migrate:prod     # Remote production D1 database
```

### Seeding

```bash
pnpm seed:local    # Seed local dev database
pnpm seed:preview  # Seed remote preview database
pnpm seed:prod     # Seed remote production database
```

Seed data is read from `scripts/seed.sql` (git-ignored; generate it from your own data source).

---

## Deployment

Deployment is handled automatically by the `deploy.yml` GitHub Actions workflow.

| Trigger | Target |
|---|---|
| Push to `main` | Production (`quiz.clevertrevor.dev`) |
| Pull request | Preview deployment (Cloudflare Workers preview URL) |

The workflow:
1. Builds both the client and worker bundles.
2. Patches `wrangler.jsonc` for preview deployments (different D1 database, `workers_dev: true`).
3. Applies any pending D1 migrations to the appropriate database.
4. Deploys via `cloudflare/wrangler-action`.
5. Updates the GitHub Deployment status with the live URL.

**Required repository secrets:**

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers and D1 permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `ADMIN_PAT` | GitHub Personal Access Token (used by the release workflow to push back to `main`) |
| `CODECOV_TOKEN` | Codecov upload token for coverage reporting |

### Manual deployment

```bash
pnpm deploy           # Deploy to production
pnpm deploy:preview   # Upload a preview version
```

---

## Project Structure

```bash
.
├── .github/
│   ├── actions/setup-env/       # Composite action: install tools via mise, cache pnpm store
│   └── workflows/
│       ├── ci.yml               # Lint, test, coverage, commitlint on push/PR
│       ├── deploy.yml           # Build and deploy to Cloudflare
│       └── release.yml          # semantic-release on push to main
├── migrations/                  # Drizzle-generated SQL migration files
├── src/
│   ├── react-app/               # React SPA
│   ├── shared/                  # Schema and types shared between SPA and Worker
│   └── worker/                  # Hono Cloudflare Worker
├── biome.json                   # Biome linter/formatter config
├── commitlint.config.ts         # commitlint + gitmoji rules
├── drizzle.config.ts            # Drizzle Kit config (reads DRIZZLE_DATABASE_URL)
├── release.config.mjs           # semantic-release config
├── vite.config.ts               # Vite + Vitest config
└── wrangler.jsonc                # Cloudflare Workers / D1 binding config
```

---

> [!NOTE]
> This is a personal project. I'm not accepting contributions at this time.
