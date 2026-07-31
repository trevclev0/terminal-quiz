# Program Management & Authentication — Implementation Plan

**Status:** Phase 4 complete (PR #187 + follow-up polish). All test coverage debt resolved. Full test suite passing with zero stderr noise.
**Owner:** clevertrevor
**Scope:** Add user authentication and let authenticated users author/manage their own Programs and Gates, while keeping existing anonymous gameplay untouched.

---

## 1. Goals & Guiding Principles

- **Simplicity first** — for players (frictionless play, no login wall) and for you (fits the existing Hono/D1/Drizzle/GraphQL stack, no new infrastructure to operate).
- **Minimal data footprint** — store only what's needed to know *who owns what*. No passwords, no OAuth tokens held longer than necessary.
- **Don't touch what works** — the existing session-based gameplay flow (`session_progress`, `submitGuess`, `requestClue`, `resetSession`) is well-tested and stays exactly as-is. Auth is additive, not a rewrite.
- **MVP first, extend later** — every "nice to have" below is written as a backlog item with a note on why it's safe to defer (usually: "additive schema change, no rework required").

---

## 2. Decisions Log

| Question | Decision | Why |
|---|---|---|
| Auth implementation | **Better Auth**, self-hosted, OAuth-only (no passwords in MVP) | Free at any scale, native D1/Drizzle/Hono support, no proxy layer, avoids restructuring the single GraphQL endpoint. |
| Providers | **Google + GitHub** in MVP. Facebook deferred. | Both are trivial with Better Auth. Facebook adds Meta App Review overhead disproportionate to a personal project — easy to add later via a plugin, not a rearchitecture. |
| Login scope | **Guests can browse/play. Login required only to author/manage Programs.** | Preserves the existing anonymous session flow untouched; keeps "send a friend a link" frictionless; matches the actual privileged surface (authoring), not the whole app. |
| Program visibility | **`public`** (listed for everyone) or **`unlisted`** (not listed, playable by direct link) | Two states, one column, no ACL table. Covers "share by URL" from day one. |
| Who can author | Any authenticated user, own content only | Standard model; `is_admin` flag scaffolded on `user` for future moderation, unused in MVP. |
| Stats/leaderboards | Out of scope | Confirmed. |

**Assumptions baked in below that you should sanity-check** (not blocking, just flag if wrong):
- Account deletion isn't part of MVP — no UI for it. Schema still defends against it (`ON DELETE SET NULL` on `author_id`) so a future "delete my account" doesn't orphan gameplay data for other players.
- One flat page for authoring (`/programs/manage/$programId`) that handles both Program metadata and its Gates, rather than separate nested routes — matches your "maybe just one page" instinct.
- No draft/publish state — a Program is live and playable the instant it's created. Add draft state later if you want to stage content before sharing it.

---

## 3. Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│ Hono Worker                                              │
│                                                           │
│  /api/auth/*      ──▶ Better Auth handler (new)          │
│  /api/graphql     ──▶ existing GraphQL router (extended) │
│                                                           │
│  sessionMiddleware  (existing, unchanged — anonymous      │
│                      gameplay identity via x-session-id)  │
│  authMiddleware     (new — reads Better Auth session      │
│                      cookie, sets `user` in Hono context) │
└─────────────────────────────────────────────────────────┘
```

Two identity systems coexist and stay decoupled:
- `x-session-id` → anonymous gameplay progression (unchanged).
- Better Auth session cookie → "who is logged in," used only for authoring/ownership checks.

A player never needs both. An author uses both (their own login to manage content, plus an anonymous session if *they* also want to play).

### Important implementation note: keep Better Auth's tables out of the auto-GraphQL schema

`src/worker/routes/graphql.ts` calls `buildSchema(currentDb)` against the *same* Drizzle instance built from `@shared/schema`, then registers `entities.types`/`entities.inputs` into the GraphQL schema. Today that's harmless because `entities.queries`/`entities.mutations` (the auto-CRUD resolvers) are never wired into the root `Query`/`Mutation` fields — only hand-picked custom resolvers are. But if Better Auth's `user`/`session`/`account` tables get added to the *same* schema module, their types become introspectable in non-production GraphiQL, and it's one careless future edit away from someone spreading `entities.queries`/`entities.mutations` and accidentally exposing session tokens via GraphQL.

**Recommendation:** give Better Auth its own schema file (`src/shared/authSchema.ts`) and its own Drizzle instance (same D1 binding, different schema slice) used only by the Better Auth adapter — never passed into `buildSchema()`. Cheap to do now, avoids a class of mistake later.

---

## 4. Schema Changes

### 4.1 New tables (Better Auth-managed)

Generate these with the Better Auth CLI (`bunx auth@1.6.25 generate`) so column naming matches your conventions, then run `bun run migrate:generate` as usual — same workflow you already use, no hand-written migrations.

- `user` — `id`, `email`, `name`, `image` (avatar URL), `is_admin` (bool, default false, unused in MVP), `created_at`.
- `account` — links a `user` to an OAuth provider (`provider`, `provider_account_id`, `user_id`). **Requirement:** OAuth access/refresh tokens must NOT be persisted. Configure by overriding Better Auth's D1 adapter `account.toDrizzle` serializer to strip `accessToken`/`refreshToken` before insert. Add focused integration tests proving these fields remain null in the `account` row after a full OAuth flow (or after simulating account creation via the adapter).
- `session` — Better Auth's own session table. Skip KV secondary storage for now (there's an open upstream bug where `cookieCache` + `secondaryStorage` can force-logout users after ~5 min); plain D1-backed sessions are simpler and sufficient at this scale.
- `verification` — generated by default, effectively unused with OAuth-only + no email flows. Harmless to leave in place.

### 4.2 Changes to existing tables

```ts
// src/shared/schema.ts — additions to `programs`
authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
visibility: text("visibility").notNull().default("public"),
check("program_visibility_check", sql`${t.visibility} IN ('public', 'unlisted')`),
```

- `authorId` is **nullable** — existing/seeded Programs (including the E2E seed program) become "unowned" (system content), still fully playable, just not editable by anyone until reassigned.
- `onDelete: "set null"` — if a user account is ever deleted, their Programs survive as unowned rather than cascading into other players' `session_progress`/`session_completed_gates` rows.

`scripts/seed.sql` / `scripts/seed-e2e.sql` need no changes — `author_id` defaults to `NULL`, `visibility` defaults to `'public'`.

---

## 5. Backend Changes

### 5.1 New endpoints
- `/api/auth/*` — mounted wholesale from Better Auth (handles OAuth redirect, callback, session refresh, sign-out). No hand-written routes needed.

### 5.2 New/changed GraphQL

**Query:**
- `me` — returns `{ id, email, name, image } | null`. Frontend uses this to decide nav state.
- `myPrograms` — all Programs owned by the current user, any visibility. Powers the management page. Requires auth.
- `programs` (existing) — filter changes from "all" to `visibility = 'public' OR author_id = currentUser.id`.

**Mutation** (all require auth; all re-verify `program.authorId === context.user.id` before mutating — same pattern your `submitGuess` resolver already uses for session ownership, just applied to authorship instead). Input validation: `visibility` must be `"public"` or `"unlisted"` — reject anything else with a `UserInputError` before persistence:
- `createProgram(name, visibility)`
- `updateProgram(id, name?, visibility?)`
- `deleteProgram(id)`
- `createGate(programId, label, question, correctAnswer, successMessage, sequenceOrder, acceptanceThreshold?, guidanceEnabled?, guidanceThreshold?)`
- `updateGate(id, ...same fields, all optional)`
- `deleteGate(id)`
- `reorderGates(programId, orderedGateIds: string[])` — validates `orderedGateIds` is an exact permutation of the target Program's gate IDs (rejecting missing, extra, or duplicate IDs), then rewrites `sequence_order` atomically using a transaction or collision-safe temporary offset so the `unique_program_sequence` constraint is never violated between updates.

### 5.3 Context plumbing
Extend `AppVariables`/`sessionMiddleware` pattern with a parallel `authMiddleware` that resolves the Better Auth session from cookies and sets `c.set("user", ...)`. GraphQL context gains `context.get("user")` alongside the existing `context.get("sessionId")`.

---

## 6. Frontend Changes

### 6.1 New routes
- `/login` — "Continue with Google" / "Continue with GitHub" buttons, terminal aesthetic. Supports a `return_to` param so post-login redirect lands wherever the user was headed. **Security:** `return_to` must be a validated same-origin relative path — reject absolute URLs, protocol-relative URLs (`//evil.com`), and backslash-based variants to prevent open redirects. Use the `URL` constructor against `BETTER_AUTH_URL`'s origin or a simple allowlist check; fall back to `/programs/select` on invalid input.
- `/programs/manage` — list of "my Programs" (public + unlisted) with a "create new" action.
- `/programs/manage/$programId` — one page: edit Program name/visibility, add/edit/delete/reorder its Gates. Route-guarded — redirects to `/login?return_to=...` if not authenticated.

### 6.2 Nav
`__root.tsx` currently renders only `<Outlet/>` — no persistent chrome exists yet. Add a small header strip:
- Logged out: "Log in" link.
- Logged in: display name/avatar, "My Programs" link, "Log out".

### 6.3 Program Selector
No structural change — `programs` query already filters correctly server-side once §5.2 ships. Selector just renders whatever it's given.

---

## 7. Navigation & Access Logic (resolved)

- **Must you be logged in to see anything?** No — public/unlisted-with-link Programs are playable by anyone, exactly as today.
- **Where does login send you?** Wherever you were headed (validated same-origin relative `return_to`), defaulting to `/programs/select` if the param is missing or invalid.
- **What shows in Program Selector?** Public Programs, plus your own unlisted ones if logged in. Not "everything."
- **How do you get to authoring?** New "My Programs" nav link, visible only when authenticated.
- **Who can author?** Any authenticated user, their own content only.

---

## 8. Security & Testing Notes

- **Ownership checks are the whole ballgame.** Every mutation in §5.2 must re-check `authorId` server-side — never trust a client-supplied program/gate ID without verifying ownership, exactly as `submitGuess` already does for `currentGateId`. Worth a dedicated `authorizeProgramMutation()` helper (mirrors `clueEligibility.ts`'s style of small, independently-unit-tested pure logic) so this can't be forgotten per-resolver.
- **Rate limiting AI clue costs is a separate, unblocked task.** Not part of this project, but worth doing regardless — Cloudflare's native Rate Limiting binding can throttle `requestClue` independent of any identity system.
- **OAuth redirect URIs and preview deployments don't mix well.** Your PR preview Workers get dynamic URLs (`quiz-app-preview-pr-{number}...`), but OAuth providers require exact registered redirect URIs. Recommendation: OAuth only works end-to-end in production + local dev (register `https://quiz.clevertrevor.dev/api/auth/callback/*` and `http://localhost:5173/api/auth/callback/*`). For preview/E2E, add a test-only auth bypass gated behind an explicit `AUTH_TEST_BYPASS_ENABLED` feature flag (default false) plus isolated test credentials or bindings, CI/environment allowlisting (e.g., `CF_PAGES_BRANCH` or `CI`), and fail-closed behavior — do not enable it based solely on `ENVIRONMENT !== "production"`. Omit the bypass route from non-test deployments whenever possible (build-time conditional via Vite `define` or Wrangler `vars`).
- **Test coverage should mirror existing patterns:** unit tests for the ownership-check helper (mocked db, like `mutations.spec.ts`), integration tests via the existing `cloudflare:test` pool-workers setup (extend `setupTestDb`/seed with a test user + owned program), and one new Playwright spec for login → create program → add gate → play it.
- **Secrets:** `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`/`SECRET`, `GITHUB_CLIENT_ID`/`SECRET` via `wrangler secret put` for prod, added to `.dev.vars`/`.dev.vars.example` for local dev.

---

## 9. Phased Roadmap

### Phase 0 — Prerequisites
- [x] Register OAuth apps in Google Cloud Console and GitHub Developer Settings; capture redirect URIs for prod + local dev.
- [x] Generate `BETTER_AUTH_SECRET`; add all secrets via `wrangler secret put` + update `.dev.vars.example`.
- [x] `bun add better-auth` (+ Cloudflare adapter if using one).

### Phase 1 — Core auth infrastructure
- [x] Generate Better Auth schema (own file, own Drizzle instance — see §3).
- [x] Migration for `user`/`account`/`session`/`verification`.
- [x] Mount `/api/auth/*`; add `authMiddleware`.
- [x] `/login` route + nav chrome in `__root.tsx`.
- [x] `me` query.
- [x] Test-only auth bypass for CI/preview (§8).
- **Done when:** you can log in with Google or GitHub locally and in prod, and `me` reflects it. No Program changes yet.

*Deferred to Phase 3c "Test Debt + E2E" below — all 4 items completed there.*

### Phase 2 — Program ownership & visibility
- [x] `author_id` + `visibility` columns on `programs`, migration.
- [x] Update `programs` query filter.
- [x] `myPrograms` query.
- **Done when:** existing seeded Programs still work unchanged; logged-in users see their own unlisted content in the right places.

### Phase 3a — Backend: Mutations & Authorization
- [x] `authorizeProgramMutation()` helper — fetches program, verifies `authorId === userId`, throws on null/mismatch.
- [x] `ProgramManagementType` + `GateManagementType` GraphQL types.
- [x] 7 management mutations (`createProgram`, `updateProgram`, `deleteProgram`, `createGate`, `updateGate`, `deleteGate`, `reorderGates`) — all auth-guarded via `authorizeProgramMutation()`, input-validated, in separate `managementMutations.ts`.
- [x] `reorderGates`: atomic `db.batch()` with two-pass (negative temp offsets → final values) to dodge `unique(programId, sequenceOrder)` constraint.
- [x] Wire all 7 mutations into GraphQL schema.
- [x] Mutation strings in `src/shared/gqlQueries.ts`.
- [x] Unit tests for authorization helper + all 7 mutations (31 tests).
- **Touch point:** `ProgramListItemType` kept lean. Management mutations return new `ProgramManagementType` with `createdAt`. Gate mutations return `GateManagementType` with all fields.
- **Done when:** all mutations are testable via GraphiQL/integration tests — correct paths succeed, auth failures reject, reorderGates handles edge cases.

### Phase 3b — Frontend: Routes, Components, Hooks
- [x] NavBar: add "My Programs" link when authenticated.
- [x] `login.tsx`: add `"/programs/manage"` to `ALLOWED_REDIRECT_PATHS`.
- [x] `/programs/manage` route + `<ManageProgramsList>` component — list user's programs, create/delete.
- [x] `/programs/manage/$programId` route + `<ManageProgramEditor>` component — edit program metadata, add/edit/delete/reorder gates. Each edit saves individually. Reorder arrows disabled while mutation inflight.
- [x] API hooks for all mutations (TanStack Query pattern).
- [x] Route guards: redirect to `/login?return_to=...` if unauthenticated.
- [x] Component tests for list + editor + API hooks.
- **Done when:** a logged-in user can create, edit, delete programs and gates through the browser UI.

### Phase 3c — Test Debt + E2E
- [x] Deferred Phase 1 tests (4 items moved from Phase 1):
  - [x] `authMiddleware` bypass unit test (mock Hono context).
  - [x] OAuth token stripping hook unit test (adapter-level mock).
  - [x] `NavBar` component test (login/logout states).
  - [x] `LoginPage` component test (social buttons + redirect).
- [x] Playwright spec: login → create program → add gates → play through (`e2e/authoring.spec.ts`).
  - Auth bypass headers configured via `AUTH_TEST_BYPASS_SECRET` from CI secret.
  - Preview Worker has matching secret via wrangler secret/deploy workflow.
- [x] Coverage evaluation completed across all layers (see Phase 4 for remaining gaps).
- **Dependency:** Phase 3a + 3b in review (PR #183). Tests can be authored against what's landed so far.
- **Dependencies met:** Phase 3a + 3b merged (PR #183). All deferred tests + E2E authoring spec passing.
- **Done when:** all 4 deferred tests pass; E2E validates full create-edit-play cycle in preview CI.

### Phase 4 — Polish
- [x] Copy-link affordance for unlisted Programs (ManageProgramEditor + ManageProgramsList, clipboard API with "Copied!" feedback).
- [x] Error feedback for all mutations in ManageProgramsList + ManageProgramEditor.
- [x] Input bounds validation (`acceptanceThreshold` 0–1, `guidanceThreshold` ≥ 0).
- [x] Loading states on management page (text-only `<h2 className="loading-screen">` — consistent with deferred spinner, per `feature-ideas.md` §1.2).
- [x] Empty state copy improvements (ManageProgramsList "No programs yet. Create your first program to get started." + ManageProgramEditor "No gates yet. Add your first gate below.").
- [x] Update `AGENTS.md`/`CONVENTIONS.md`/`README.md` with the new auth/authoring sections.
- [x] Bug fix: `validateReturnTo` backslash check moved before URL parsing (was getting percent-encoded, bypassed the guard).
- [x] Bug fix: `isAllowedPath` now strips query string before matching allowlist (preserved query strings in `return_to` were incorrectly rejected).
- [x] Test stderr noise elimination: added missing MSW `Program` query handler to `ProgramPlay.integration.spec.tsx`; silenced expected `console.warn`/`console.error` in manage route tests (root cause: `restoreMocks: true` in vitest config wiped `beforeAll` spies after test 1).

#### Test coverage debt (identified in Phase 3c coverage evaluation) — all resolved

- [x] **Worker auth lifecycle** — `worker/services/auth-lifecycle.spec.ts` with 8 tests covering missing binding, short secret, singleton cache, `clearAuthInstance`, and restore behavior (mocked `better-auth` + `drizzle-orm/d1`).
- [x] **Login route URL validation** — `routes/-login.spec.tsx` with 18 tests covering all `validateReturnTo`, `isAllowedPath`, `validateLoginSearch` edge cases (cross-origin, protocol-relative, backslash, query string preservation, allowlist, prefix matching).
- [x] **Auth guard redirect path** — `routes/programs/-manage.spec.tsx` with 2 redirect tests asserting `return_to` search params for both `/programs/manage` and `/programs/manage/$programId`.
- [x] **Management route states** — `routes/programs/-manage.spec.tsx` testing error state rendering ("Failed to load programs.") via MSW 500 response.
- [x] **ManageProgramEditor error states** — 5 mutation error state tests (program save, gate update, gate delete, gate create, reorder).
- [x] **ManageProgramsList edge cases** — cancel-on-confirm, mutation error display, copy-link rendering tests.

### Backlog (deliberately deferred — additive, no rework required)

- Facebook login.
- Optional email/password (only if OAuth-only proves insufficient for some future user).
- Per-user/email sharing ACL (new join table, doesn't touch `public`/`unlisted`).
- Draft/publish state for Programs.
- Account deletion UI.
- Stats, reporting, leaderboards — explicitly out of scope per your original list.
