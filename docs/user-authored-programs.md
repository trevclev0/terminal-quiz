# Program Management & Authentication — Implementation Plan

**Status:** Draft for review
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

```
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

Generate these with the Better Auth CLI (`npx @better-auth/cli generate`) so column naming matches your conventions, then run `bun run migrate:generate` as usual — same workflow you already use, no hand-written migrations.

- `user` — `id`, `email`, `name`, `image` (avatar URL), `is_admin` (bool, default false, unused in MVP), `created_at`.
- `account` — links a `user` to an OAuth provider (`provider`, `provider_account_id`, `user_id`). Configure Better Auth to **not** persist provider access/refresh tokens unless you later need to call Google/GitHub APIs on the user's behalf — you don't, so don't store them.
- `session` — Better Auth's own session table. Skip KV secondary storage for now (there's an open upstream bug where `cookieCache` + `secondaryStorage` can force-logout users after ~5 min); plain D1-backed sessions are simpler and sufficient at this scale.
- `verification` — generated by default, effectively unused with OAuth-only + no email flows. Harmless to leave in place.

### 4.2 Changes to existing tables

```ts
// src/shared/schema.ts — additions to `programs`
authorId: text("author_id").references(() => user.id, { onDelete: "set null" }),
visibility: text("visibility").notNull().default("public"),
// + check("program_visibility_check", sql`${t.visibility} IN ('public', 'unlisted')`)
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

**Mutation** (all require auth; all re-verify `program.authorId === context.user.id` before mutating — same pattern your `submitGuess` resolver already uses for session ownership, just applied to authorship instead):
- `createProgram(name, visibility)`
- `updateProgram(id, name?, visibility?)`
- `deleteProgram(id)`
- `createGate(programId, label, question, correctAnswer, successMessage, sequenceOrder, acceptanceThreshold?, guidanceEnabled?, guidanceThreshold?)`
- `updateGate(id, ...same fields, all optional)`
- `deleteGate(id)`
- `reorderGates(programId, orderedGateIds: string[])` — rewrites `sequence_order` in one batch, respecting the existing `unique_program_sequence` index.

### 5.3 Context plumbing
Extend `AppVariables`/`sessionMiddleware` pattern with a parallel `authMiddleware` that resolves the Better Auth session from cookies and sets `c.set("user", ...)`. GraphQL context gains `context.get("user")` alongside the existing `context.get("sessionId")`.

---

## 6. Frontend Changes

### 6.1 New routes
- `/login` — "Continue with Google" / "Continue with GitHub" buttons, terminal aesthetic. Supports a `return_to` param so post-login redirect lands wherever the user was headed.
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
- **Where does login send you?** Wherever you were headed (`return_to`), defaulting to `/programs/select` if none.
- **What shows in Program Selector?** Public Programs, plus your own unlisted ones if logged in. Not "everything."
- **How do you get to authoring?** New "My Programs" nav link, visible only when authenticated.
- **Who can author?** Any authenticated user, their own content only.

---

## 8. Security & Testing Notes

- **Ownership checks are the whole ballgame.** Every mutation in §5.2 must re-check `authorId` server-side — never trust a client-supplied program/gate ID without verifying ownership, exactly as `submitGuess` already does for `currentGateId`. Worth a dedicated `authorizeProgramMutation()` helper (mirrors `clueEligibility.ts`'s style of small, independently-unit-tested pure logic) so this can't be forgotten per-resolver.
- **Rate limiting AI clue costs is a separate, unblocked task.** Not part of this project, but worth doing regardless — Cloudflare's native Rate Limiting binding can throttle `requestClue` independent of any identity system.
- **OAuth redirect URIs and preview deployments don't mix well.** Your PR preview Workers get dynamic URLs (`quiz-app-preview-pr-{number}...`), but OAuth providers require exact registered redirect URIs. Recommendation: OAuth only works end-to-end in production + local dev (register `https://quiz.clevertrevor.dev/api/auth/callback/*` and `http://localhost:5173/api/auth/callback/*`). For preview/E2E, add a test-only auth bypass (e.g., a Worker route gated behind `ENVIRONMENT !== "production"` that mints a session for a fixed test user) so Playwright can exercise the authoring flow without real OAuth.
- **Test coverage should mirror existing patterns:** unit tests for the ownership-check helper (mocked db, like `mutations.spec.ts`), integration tests via the existing `cloudflare:test` pool-workers setup (extend `setupTestDb`/seed with a test user + owned program), and one new Playwright spec for login → create program → add gate → play it.
- **Secrets:** `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`/`SECRET`, `GITHUB_CLIENT_ID`/`SECRET` via `wrangler secret put` for prod, added to `.dev.vars`/`.dev.vars.example` for local dev.

---

## 9. Phased Roadmap

### Phase 0 — Prerequisites
- [ ] Register OAuth apps in Google Cloud Console and GitHub Developer Settings; capture redirect URIs for prod + local dev.
- [ ] Generate `BETTER_AUTH_SECRET`; add all secrets via `wrangler secret put` + update `.dev.vars.example`.
- [ ] `bun add better-auth` (+ Cloudflare adapter if using one).

### Phase 1 — Core auth infrastructure
- [ ] Generate Better Auth schema (own file, own Drizzle instance — see §3).
- [ ] Migration for `user`/`account`/`session`/`verification`.
- [ ] Mount `/api/auth/*`; add `authMiddleware`.
- [ ] `/login` route + nav chrome in `__root.tsx`.
- [ ] `me` query.
- [ ] Test-only auth bypass for CI/preview (§8).
- **Done when:** you can log in with Google or GitHub locally and in prod, and `me` reflects it. No Program changes yet.

### Phase 2 — Program ownership & visibility
- [ ] `author_id` + `visibility` columns on `programs`, migration.
- [ ] Update `programs` query filter.
- [ ] `myPrograms` query.
- **Done when:** existing seeded Programs still work unchanged; logged-in users see their own unlisted content in the right places.

### Phase 3 — Authoring UI/API
- [ ] Program + Gate CRUD mutations with ownership checks.
- [ ] `/programs/manage` and `/programs/manage/$programId` routes.
- [ ] Playwright spec: login → create → play.
- **Done when:** a real user can create a Program with Gates from scratch and play it, without touching the DB by hand.

### Phase 4 — Polish
- [ ] Copy-link affordance for unlisted Programs.
- [ ] Empty states, validation errors, loading states on the management page.
- [ ] Update `AGENTS.md`/`CONVENTIONS.md`/`README.md` with the new auth/authoring sections.

### Backlog (deliberately deferred — additive, no rework required)
- Facebook login.
- Optional email/password (only if OAuth-only proves insufficient for some future user).
- Per-user/email sharing ACL (new join table, doesn't touch `public`/`unlisted`).
- Draft/publish state for Programs.
- Account deletion UI.
- Stats, reporting, leaderboards — explicitly out of scope per your original list.
