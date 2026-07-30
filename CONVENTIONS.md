# terminal-quiz — Coding Conventions

## Environment

- TypeScript strict mode. No `any` — use `unknown` and narrow explicitly.
- Runtime: Cloudflare Workers (not Node.js). Do not use Node-only APIs (`fs`, `path`, `process.env` directly, etc.).
- Package manager: Bun. Never suggest npm, yarn, or pnpm commands.
- Linter/formatter: Biome via `bun run check:code`. Do not guess style; let the linter enforce it.

## Architecture

- Full-stack SPA: React frontend + Hono backend, both running on Cloudflare Workers.
- Database: Cloudflare D1 via Drizzle ORM. All schema changes go through Drizzle migrations.
- Session state tracked in `session_progress` table — do not use KV for session data.
- API surface is GraphQL only (`drizzle-graphql` auto-schema + custom gameplay resolvers in `src/worker/graphql/gameplay/`). There is no REST gameplay API — do not add one.
- Every gameplay session is identified by an `x-session-id` header, validated server-side against `session_progress`. Never trust a client-supplied `gateId`/`programId` without checking it against that session's row.
- Routing is client-side (via TanStack Router). Route structure: `/`, `/programs/select`, `/programs/$programId`.
- Do not introduce gate-level URLs or client-side route guards that duplicate server logic.

## Frontend

- React functional components only. No class components.
- TanStack Router for all routing. Use `createFileRoute`; do not use manual route objects.
- Named exports preferred. Default exports only where TanStack Router file-based routing requires.
- Do not use `useEffect` for data fetching — use TanStack Query (`useQuery`, `useMutation`).
- Adjust `staleTime` intentionally per query based on how fresh that data needs to be (e.g. long `staleTime` for rarely-changing program lists, `staleTime: 0` where session state must always be current); do not leave it at the default if it causes unnecessary refetches in tests or stale reads in the UI.

## Backend

- Hono for all API routes. Keep route handlers thin — business logic belongs in service/resolver functions.
- GraphQL is the only gameplay API. Do not add REST endpoints for gameplay.
- Validate all inputs at the Hono/resolver layer before touching D1.
- Any resolver that mutates session-scoped state must re-check that the request's session owns the row it's mutating (see `submitGuess`'s `currentGateId` check) before applying the change.

## Auth & Authoring

- Two identity systems coexist: `x-session-id` for anonymous gameplay, Better Auth session cookie for authorship. Auth is additive to gameplay, never a dependency.
- **Route guards**: Use `requireUser(queryClient, returnTo)` from `-requireUser.ts` for any route that needs authentication. Throws TanStack Router `redirect` to `/login?return_to=...` if unauthenticated.
- **Server-side auth**: Every management mutation must call `authorizeProgramMutation(db, programId, userId)` to verify program ownership before mutating. Never trust client-supplied IDs without this check.
- **Program visibility**: `public` programs appear in the global list. `unlisted` programs are accessible only via direct link (`program(id)` resolver). No ACL table — visibility is a simple column check, not a permissions system.
- **Login redirect safety**: `validateReturnTo()` must reject cross-origin, protocol-relative (`//evil.com`), and backslash-based return_to values. Only same-origin relative paths matching `ALLOWED_REDIRECT_PATHS` or `ALLOWED_REDIRECT_PREFIXES` are accepted.
- **Management routes**: `/programs/manage` (list + create) and `/programs/manage/$programId` (edit gates) are guarded by `requireUser`. Do not add REST endpoints for authoring — management is GraphQL only, same as gameplay.
- **Auth schema isolation**: Better Auth tables (`user`, `account`, `session`, `verification`) live in `src/shared/authSchema.ts` on a separate Drizzle instance. Never pass this instance to `drizzle-graphql`'s `buildSchema()` — it must never be introspectable via GraphQL.
- **Test auth bypass**: Use `AUTH_TEST_BYPASS_ENABLED` + `AUTH_TEST_BYPASS_SECRET` for E2E tests. Fail-closed — never enable based on `ENVIRONMENT !== "production"` alone.

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
- Co-locate tests with source: `foo.spec.ts` next to `foo.ts`.
- Do not use real D1/Workers bindings in unit tests — mock at the service/resolver boundary (see `src/worker/test-utils/mockEnv.ts`).
- Ensure all network requests are fully mocked in tests (e.g., using MSW) to prevent connection errors.

## Git

- Conventional commits with gitmoji prefix. Format: `<emoji> <type>(<scope>): <description>`
- Never commit directly to `main`. Feature branches only.
- Regarding scope: Always lowercase and kebab-case (e.g. ai-service, not aiService)
- Regarding scope: Never include file extensions (e.g. ai-service, not ai-service.ts)
- Regarding scope: Use the logical module name, not the filename
- Do not push unreviewed changes to `main` — prefer branch-and-reset if a bad push occurs.

## Build Verification

After all edits are complete, run `bun run check` to verify the build (in dry-run mode) passes.
If the build fails, the AI should offer to fix the issues automatically before proceeding to the next edit.

## What NOT to do

- Do not install new dependencies without asking first.
- Do not change the Drizzle schema without explicit instruction.
- Do not add a REST gameplay API — GraphQL is the single source of truth for progression.
- Do not add barrel files speculatively.
