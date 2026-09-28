# User-Authored Programs & Authentication

**Status:** Shipped (Phases 0–4; epic issues #171–#175, #179–#181; PRs
#183, #187). Deferred ideas are tracked in #316.

This is the decision record for authentication and program authoring. For
the current mechanics (middleware, `requireUser`, `authorizeProgramMutation`,
mutation list, visibility, the login redirect guard), see AGENTS.md →
*Auth & Authoring*. The build plan lives in the issues above and in git
history.

## Guiding principles

- **Simplicity first**, for players (no login wall) and for operations (fits
  the existing Hono/D1/Drizzle/GraphQL stack, no new infrastructure).
- **Minimal data footprint.** Store only what's needed to know *who owns
  what*: no passwords, and no OAuth tokens kept past the handshake.
- **Don't touch what works.** Anonymous gameplay (`session_progress`,
  `submitGuess`, `requestClue`, `resetSession`) is unchanged. Auth is
  additive.
- **MVP first.** Every deferral is additive: a new table or column, never a
  rework.

## Decisions

| Question | Decision | Why |
|---|---|---|
| Auth implementation | **Better Auth**, self-hosted on the same Worker, OAuth-only | Free at any scale, native D1/Drizzle/Hono support, no proxy layer, and the single GraphQL endpoint stays intact. |
| Providers | **Google + GitHub**; Facebook deferred | Both are trivial with Better Auth. Facebook adds Meta App Review overhead that's out of proportion for a personal project, and it's a plugin away. |
| Login scope | **Guests browse and play; login only to author** | Keeps "send a friend a link" frictionless and matches the actually privileged surface. |
| Visibility | **`public`** (listed) or **`unlisted`** (link-only) | Two states, one column, no ACL table. Covers share-by-URL from day one. Unlisted is security-through-obscurity, like unlisted YouTube videos. |
| Who can author | Any authenticated user, own content only | `is_admin` is scaffolded on `user` for future moderation and unused today. |
| Authoring UI | One flat page per program (`/programs/manage/$programId`) for metadata + gates | No nested routes to maintain. |
| Draft state | None. A program is live when created | Deferred (#316). |
| Account deletion | No UI, but the schema is ready | `programs.author_id` is `ON DELETE SET NULL`, so a deleted author's programs survive as unowned instead of cascading into other players' progress rows. |
| Stats / leaderboards | Out of scope | Explicit call at the time. Any revival needs a privacy review (`docs/analytics.md`). |

## Two decoupled identity systems

```text
Hono Worker
  /api/auth/*    → Better Auth handler
  /api/graphql   → GraphQL (gameplay + management)

  sessionMiddleware → anonymous gameplay identity
                      (HttpOnly anon_gameplay_session cookie)
  authMiddleware    → Better Auth session cookie → `user` in context
```

A player never needs both. An author uses both: their login to manage
content, and an anonymous session if they also play. Keeping the two
separate means auth can never regress gameplay, and gameplay never has to
reason about accounts.

## Keep Better Auth's tables out of the GraphQL schema

`buildSchema()` in `routes/graphql.ts` registers every Drizzle entity *type*
from the schema module it's given. The auto-CRUD resolvers aren't wired
today, but if `user` / `session` / `account` shared that module, their types
would be introspectable, and one careless spread of `entities.queries` would
expose session tokens. So Better Auth gets its **own schema file**
(`src/shared/authSchema.ts`) and its **own Drizzle instance** on the same D1
binding, and it is never passed to `buildSchema()`. AGENTS.md lists this
under *What to Avoid*.

Related: the adapter's `account` serializer strips
`accessToken` / `refreshToken` / `idToken` before insert
(`src/worker/services/auth.ts`), so provider tokens are never persisted.
Better Auth sessions are plain D1-backed, with no KV secondary storage.
When this was built there was an upstream bug where `cookieCache` +
`secondaryStorage` force-logged users out after about 5 minutes.

## Ownership is the whole ballgame

Every mutation on an existing program or gate re-checks `authorId`
server-side through one helper (`authorizeProgramMutation`), the same way
`submitGuess` re-checks `currentGateId` for sessions. A client-supplied ID is
never trusted without an ownership check, and centralizing the check means a
new resolver can't forget it. `reorderGates` also requires the submitted IDs
to be an exact permutation of the program's gates (no missing, extra or
duplicate IDs) and rewrites `sequence_order` without ever violating the
`(program_id, sequence_order)` unique index mid-update.

## Navigation & access

- Nothing requires login to *play*. Public programs, and unlisted ones via
  their link, work for anyone.
- The program selector lists public programs, plus the viewer's own unlisted
  ones when logged in.
- "My Programs" appears in the nav only when authenticated.
- Login returns you where you were headed: `return_to`, validated as a
  same-origin relative path. It rejects absolute, protocol-relative and
  backslash variants, checks the path against an allowlist, and falls back to
  `/programs/select`. Two bugs fixed during polish are worth remembering:
  the backslash check has to run *before* URL parsing (parsing
  percent-encodes it past the guard), and the allowlist match has to strip
  the query string first.

## OAuth vs. preview deployments

OAuth providers need exact registered redirect URIs, and PR previews get
dynamic hostnames. So real OAuth works only in production and local dev.
Preview and CI E2E use a **test-only auth bypass** that fails closed: it is
enabled only by an explicit `AUTH_TEST_BYPASS_ENABLED` flag plus
`AUTH_TEST_BYPASS_SECRET`, never inferred from
`ENVIRONMENT !== "production"`, and it is excluded at build time wherever
possible.

## Test-suite lesson

`restoreMocks: true` in the Vitest config restores spies after *every* test,
so a `console.error` spy installed in `beforeAll` silently stops working
after the first test. Install suppression spies in `beforeEach`. AGENTS.md
→ *Testing* codifies this.
