# terminal-quiz — Coding Conventions

## Environment

- TypeScript strict mode. No `any` — use `unknown` and narrow explicitly.
- Runtime: Cloudflare Workers (not Node.js). Do not use Node-only APIs (`fs`, `path`, `process.env` directly, etc.).
- Package manager: pnpm. Never suggest npm or yarn commands.
- Linter/formatter: Biome via `pnpm check:code`. Do not guess style; let the linter enforce it.

## Architecture

- Full-stack SPA: React frontend + Hono backend, both running on Cloudflare Workers.
- Database: Cloudflare D1 via Drizzle ORM. All schema changes go through Drizzle migrations.
- Session state tracked in `session_progress` table — do not use KV for session data.
- Routing is client-side (via TanStack Router) with backend fallback support. Route structure: /, /programs/select, /programs/:programId.
- Do not introduce gate-level URLs or client-side route guards that duplicate server logic.

## Frontend

- React functional components only. No class components.
- TanStack Router for all routing. Use `createFileRoute`; do not use manual route objects.
- Named exports preferred. Default exports only where TanStack Router file-based routing requires.
- Do not use `useEffect` for data fetching — use TanStack Query (`useQuery`, `useMutation`).
- Adjust `staleTime` intentionally; do not leave it at 0 if it causes unnecessary refetches in tests.

## Backend

- Hono for all API routes. Keep route handlers thin — business logic belongs in service functions.
- GraphQL is used for the play flow. REST endpoints for the legacy flow remain untouched.
- Do not modify the legacy REST flow unless the task explicitly requires it.
- Validate all inputs at the Hono layer before touching D1.

## Code style

- Prefer early returns over nested conditionals.
- No `console.log` in production code. Use structured logging if needed.
- Imports: Biome handles organization. Do not manually sort.
- No barrel files (`index.ts` re-exports) unless already established in that directory.
- Double quotes for JS/TS strings
- 2-space indentation, LF line endings, UTF-8, final newline (`.editorconfig`)
- Max line length: 80 characters
- TypeScript strict mode plus `noUnusedLocals`, `noUnusedParameters`, etc. — do not disable these

## Testing

- Vitest only. No Jest APIs.
- Co-locate tests with source: `foo.test.ts` next to `foo.ts`.
- Do not use real D1/Workers bindings in unit tests — mock at the service boundary.
- Ensure all network requests are fully mocked in tests (e.g., using MSW) to prevent connection errors.

## Git

- Conventional commits with gitmoji prefix. Format: `<emoji> <type>(<scope>): <description>`
- Never commit directly to `main`. Feature branches only.
- Regarding scope: Always lowercase and kebab-case (e.g. ai-service, not aiService)
- Regarding scope: Never include file extensions (e.g. ai-service, not ai-service.ts)
- Regarding scope: Use the logical module name, not the filename
- Do not push unreviewed changes to `main` — prefer branch-and-reset if a bad push occurs.

## What NOT to do

- Do not install new dependencies without asking first.
- Do not change the Drizzle schema without explicit instruction.
- Do not refactor the legacy REST flow.
- Do not add barrel files speculatively.
