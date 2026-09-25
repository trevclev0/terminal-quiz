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
- GraphQL query/mutation strings live only in `src/shared/gqlQueries.ts`. Frontend hooks/api files and integration tests import from there; never define query strings inline in consumer files.
- Every gameplay session is identified by a server-issued HttpOnly cookie (`anon_gameplay_session`, minted by `sessionMiddleware`), validated server-side against `session_progress`. Mutations additionally require the constant `x-session-id` same-origin tripwire header (`requireSessionHeader`). Never trust a client-supplied `gateId`/`programId` without checking it against that session's row.
- Routing is client-side (via TanStack Router). Route structure: `/`, `/programs/select`, `/programs/$programId`.
- Do not introduce gate-level URLs or client-side route guards that duplicate server logic.

## Frontend

- React functional components only. No class components.
- TanStack Router for all routing. Use `createFileRoute`; do not use manual route objects.
- Named exports preferred. Default exports only where TanStack Router file-based routing requires.
- All styling must use CSS Modules (`ComponentName.module.css`). No inline `style={}` props or CSS-in-JS libraries. Every component gets its own `.module.css` file co-located in the same directory.
- Style primitives shared by several components live in non-co-located modules that no single component owns: `base.module.css` (form-control chrome, field wrapper, error text) and `select.module.css` (select chrome and sizing). Add to these only when a rule is genuinely shared — a one-off belongs in the component's own module.
- Prefer consuming a shared primitive with `composes: <class> from "./base.module.css"` inside the component's own module, so call sites keep referring to their own `styles.*` and the component keeps a single styling entry point. Importing the shared module directly in TSX (as the select styles do) is acceptable where the shared class must be combined with others at the call site.
- A class that `composes` a shared primitive must only add properties, never redeclare ones the primitive already sets — composed classes are separate rules, so an override would depend on stylesheet order rather than the cascade. Genuine overrides need higher specificity (e.g. `.input[aria-invalid="true"]`).
- Do not use `useEffect` for data fetching — use TanStack Query (`useQuery`, `useMutation`).
- Adjust `staleTime` intentionally per query based on how fresh that data needs to be (e.g. long `staleTime` for rarely-changing program lists, `staleTime: 0` where session state must always be current); do not leave it at the default if it causes unnecessary refetches in tests or stale reads in the UI.

## Backend

- Hono for all API routes. Keep route handlers thin — business logic belongs in service/resolver functions.
- GraphQL is the only gameplay API. Do not add REST endpoints for gameplay.
- Validate all inputs at the Hono/resolver layer before touching D1. GraphQL mutation inputs are parsed with the shared zod schemas in `src/shared/validation.ts` (`parseOrThrow`); authoring forms reuse the same schemas for client-side feedback rather than re-implementing the rule.
- Any resolver that mutates session-scoped state must re-check that the request's session owns the row it's mutating (see `submitGuess`'s `currentGateId` check) before applying the change.

## Auth & Authoring

- Two identity systems coexist: the `anon_gameplay_session` HttpOnly cookie for anonymous gameplay, Better Auth session cookie for authorship. Auth is additive to gameplay, never a dependency.
- **Route guards**: Use `requireUser(queryClient, returnTo)` from `-requireUser.ts` for any route that needs authentication. Throws TanStack Router `redirect` to `/login?return_to=...` if unauthenticated.
- **Server-side auth**: Every management mutation must call `authorizeProgramMutation(db, programId, userId)` to verify program ownership before mutating. Never trust client-supplied IDs without this check.
- **Program visibility**: `public` programs appear in the global list. `unlisted` programs are accessible only via direct link (`program(id)` resolver). No ACL table — visibility is a simple column check, not a permissions system.
- **Login redirect safety**: `validateReturnTo()` must reject cross-origin, protocol-relative (`//evil.com`), and backslash-based return_to values. Only same-origin relative paths matching `ALLOWED_REDIRECT_PATHS` or `ALLOWED_REDIRECT_PREFIXES` are accepted.
- **Management routes**: `/programs/manage` (list + create) and `/programs/manage/$programId` (edit gates) are guarded by `requireUser`. Do not add REST endpoints for authoring — management is GraphQL only, same as gameplay.
- **Auth schema isolation**: Better Auth tables (`user`, `account`, `session`, `verification`) live in `src/shared/authSchema.ts` on a separate Drizzle instance. Never pass this instance to `drizzle-graphql`'s `buildSchema()` — it must never be introspectable via GraphQL.
- **Test auth bypass**: Use `AUTH_TEST_BYPASS_ENABLED` + `AUTH_TEST_BYPASS_SECRET` for E2E tests. Fail-closed — never enable based on `ENVIRONMENT !== "production"` alone.

## Code style

- Prefer early returns over nested conditionals.
- Logging on Workers: `console.log`/`console.error` to stdout **is** the
  sanctioned transport — Workers Logs reads stdout and there is no other logger
  in the stack. Emit structured JSON lines (see `src/worker/middleware/logger.ts`
  and `src/worker/utils/errorHandler.ts`), gate noisy request logs by
  environment, and do not leave stray ad-hoc `console.log` calls in committed
  code.
- Imports: Biome handles organization. Do not manually sort.
- No barrel files (`index.ts` re-exports) unless already established in that directory.
- Double quotes for JS/TS strings
- 2-space indentation, LF line endings, UTF-8, final newline (`.editorconfig`)
- Max line length: 80 characters, enforced by the Biome formatter
  (`formatter.lineWidth` in `biome.json`) on a best-effort basis. The formatter
  breaks what it can — JSX props, call arguments, object literals — but leaves
  atomic tokens such as long string literals and import paths alone, and Biome
  has no lint rule for line width, so a clean `check:code` does not mean every
  line fits. Lines the formatter cannot break are tolerated. Prefer hoisting a
  long message into a named constant or helper over leaving an over-length
  literal inline:

  ```tsx
  const deleteProgramMessage = (name: string) =>
    `Delete "${name}" and all its gates? This cannot be undone.`;
  ```

- Comments and docstrings follow three tiers:
  1. **Always document the non-obvious "why"** — invariants, ordering
     constraints, security reasoning, workarounds, anything where the next
     reader's first instinct would be wrong. The standard to match:
     `src/worker/test-utils/testConstants.ts` (why the tripwire header value is
     a constant and not identity), `src/react-app/components/base.module.css`
     (why `.control` declares no padding or sizing), and
     `src/react-app/components/RouteErrorFallback.tsx` (why it narrows the
     thrown value instead of assuming an `Error`).
  2. **Usually document the shared API surface** — exported component props,
     shared hooks, helpers consumed across modules. `MutationError`'s per-prop
     docs are the model:

     ```tsx
     type MutationErrorProps = {
       /** Verb for the failed action — "save" renders "Failed to save: ...". */
       action: string;
       /** Renders nothing when absent, so call sites need no surrounding guard. */
       error?: string | null;
     };
     ```

  3. **Never restate the signature.** `/** Deletes a gate. */` above
     `deleteGate(gateId: string)` is noise; if the name and types already say
     it, say nothing.

  New code follows the tiers; existing code gets docs when it is already being
  touched for another reason — no retroactive docstring passes. Coverage
  percentage is not the goal: a file with no docstrings and one good "why"
  comment can be correctly documented.
- Markdown fenced code blocks must declare a language (e.g. `` ```text ``,
  `` ```bash ``, `` ```tsx ``). No bare `` ``` `` fences.
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
