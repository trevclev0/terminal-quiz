# AI Clue Rate Limiting

**Status:** Phase A (backend) **implemented** on `feat/219-rate-limit-clues`.
Phase B (frontend cooldown UX) planned, not started. Phase C deferred.
**Origin:** `docs/feature-ideas.md` §3.1 ("Rate Limiting on `requestClue`")

## Goal

Prevent a single session from spamming `requestClue` and burning Workers AI
quota by enforcing a session-wide temporal rate limit: **rolling 3 AI clue
requests per 60 seconds**, enforced atomically *before* the AI call, with the
rate-limited state surfaced to the client so the UI can show a cooldown.

## Why the feature-ideas sketch needs correction

`feature-ideas.md` §3.1 proposes: "D1 transaction — `INSERT INTO gate_clues`
with a `SELECT CASE WHEN EXISTS ...` guard that rejects if a clue was created
within the last 10s."

That sketch does not work as written. In the current resolver
(`requestClueMutation.ts`), the AI call (`generateClue`) happens *before* the
`gate_clues` insert, and the insert needs `clueText` which only exists after
the AI call. A guard evaluated at insert time therefore runs **after** the
quota has already been spent — it saves nothing.

The rate limit must be claimed as a **separate, atomic step before
`generateClue`**. The claim also bounds the existing concurrency race: today N
concurrent `requestClue` calls at the same `attemptCount` all pass
`computeCanRequestClue` (no row exists yet), all call `generateClue` (N AI
calls), then all but one fail the `unique_clue_per_attempt` insert. The atomic
claim caps that burst at `CLUE_RATE_LIMIT_MAX_REQUESTS` AI calls per window.

Note the claim serializes **per window, not per attempt**: within one window,
three concurrent requests at the same `attemptCount` each win a slot, each
calls `generateClue`, and the `unique_clue_per_attempt` constraint still makes
only one succeed. A per-attempt reservation would close that gap entirely and
is tracked as a follow-up (#221).

## Rate decision

**Rolling 3 AI clue requests per 60 seconds per session** — constants
`CLUE_RATE_LIMIT_WINDOW_MS = 60_000` and `CLUE_RATE_LIMIT_MAX_REQUESTS = 3`
in `src/worker/graphql/gameplay/clueRateLimit.ts` (mirroring
`MAX_CLUES_PER_GATE` in `clueEligibility.ts`).

Why session-wide instead of per-gate: a per-gate window (the earlier
1-per-10s design) lets a spammer rotate gates — gate A clue, gate B clue,
gate C clue — 3 AI calls in <10s. A session-wide rolling window caps the
whole session at 3 AI calls/min regardless of gate rotation.

Legit play is never touched: `guidanceThreshold` forces a minimum number of
wrong guesses before the first clue, and each clue requires the player to
read the clue, submit a guess, and read the response before requesting the
next — naturally far apart.

## Scope decision

Session-wide only. The per-gate semantic cap (`MAX_CLUES_PER_GATE = 3`,
1-clue-per-attempt, `guidanceThreshold`) is unchanged and layered underneath
the rate limit. IP/account-level limiting and env-var tuning are deferred to
Phase C.

## Non-goals

- IP-based or account-based rate limiting. Per-session limits stop a runaway
  single session; a script rotating `x-session-id` values is **not** stopped
  by this feature. Documented as a known ceiling, not silently ignored.
- Rate limiting any endpoint other than `requestClue`.
- Changing the existing semantic clue limits (`MAX_CLUES_PER_GATE`,
  1-clue-per-attempt, `guidanceThreshold`). The rate limit is a temporal
  throttle layered on top.
- Rolling back the window claim when `generateClue` fails — a failed claim
  still consumes the window (see "Window-consumption decision" below).

---

## Architecture

### New table: `clue_rate_limits` (keyed by session, not gate)

One row per **accepted AI claim** (history, not a single counter row),
cascade-deleted with `session_progress`. Migration `0015_broken_supernaut.sql`.

```ts
export const clueRateLimits = sqliteTable("clue_rate_limits", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionProgressId: text("session_progress_id")
    .notNull()
    .references(() => sessionProgress.id, { onDelete: "cascade" }),
  requestedAt: integer("requested_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (t) => [
  index("clue_rate_limits_session_progress_id_idx").on(t.sessionProgressId),
  // Serves the global expiry prune (WHERE requested_at < cutoff)
  index("clue_rate_limits_requested_at_idx").on(t.requestedAt),
]);
```

The `session_progress_id` index serves the count check and the per-session
advisory read; the `requested_at` index serves the global expiry prune.
`requested_at` stores **raw epoch milliseconds** (drizzle sqlite
`mode: "timestamp_ms"`), so the rolling window is precise to the
millisecond — no second-flooring drift that could expire claims up to 999ms
early.

### Atomic claim (count-guarded conditional insert, before `generateClue`)

Drizzle 0.45.2 has **no standalone `.where()` on insert**. The claim uses the
`.select()` builder form, which emits
`INSERT ... SELECT ... WHERE <guard> RETURNING` — a single SQLite statement,
serialized by the D1 write path (verified working on D1 in
`clueRateLimit.integration.spec.ts`):

```ts
const [claimed] = await db.batch([
  db.insert(clueRateLimits)
    .select((qb) => qb
      .select({
        id: sql`${crypto.randomUUID()}`.as("id"),
        sessionProgressId: sql`${sessionProgressId}`.as("session_progress_id"),
        requestedAt: sql`${nowMs}`.as("requested_at"),
      })
      .from(sql`(select 1)`)
      .where(sql`(
        SELECT COUNT(*) FROM clue_rate_limits
        WHERE session_progress_id = ${sessionProgressId}
          AND requested_at > ${cutoffMs}
      ) < ${CLUE_RATE_LIMIT_MAX_REQUESTS}`),
    )
    .returning({ id: clueRateLimits.id }),
  db.delete(clueRateLimits).where(lt(clueRateLimits.requestedAt, cutoff)),
]);
```

- Row returned → slot won, proceed to `generateClue`.
- No row → session is at cap within the window → **rate limited**, reject
  before any AI spend.

The `.select()` builder requires the select to produce **all table columns
positionally, including `id`** (drizzle builds the INSERT column list from
every column in definition order and pushes the SELECT verbatim) — hence the
explicit `id` with `crypto.randomUUID()`.

Concurrency: two simultaneous requests serialize — the first increments the
in-window count, the second's guard sees `3 < 3` false, returns 0 rows.
Exactly one AI call per slot.

`retryAfterMs` is computed from the **oldest in-window row** — an advisory
SELECT read only on the rejection path (the happy path pays no extra query).
The count-guarded insert stays the sole enforcement point.

Expired rows (older than the cutoff) are pruned **globally across all
sessions** in the same `db.batch` (served by the `requested_at` index), so
abandoned sessions cannot leak rows forever and the table cannot grow
unbounded.

### Window-consumption decision

A successful claim consumes the window even if `generateClue` returns `null`
(AI outage) or the `gate_clues` insert later fails as a duplicate. Rationale:
the alternative (rollback on failure) lets a failing or gamed AI be hammered,
defeating the purpose. With a 60s window the UX cost is minor; the UI tells
the player to retry.

### Check placement in the resolver

The claim runs **after** all cheap eligibility checks (guess length,
`loadActiveSession`, `computeCanRequestClue`) and **immediately before**
`generateClue`. Requests rejected on eligibility never consume the window —
the limiter only throttles real AI attempts.

### Response contract (implemented)

`RequestClueResult` (in `types.ts`) and `REQUEST_CLUE_MUTATION` (in
`gqlQueries.ts`) carry:

| Field | Type | When set |
|---|---|---|
| `isRateLimited` | `Boolean!` | Always |
| `retryAfterMs` | `Int` | Only when `isRateLimited` is true |

Rate-limited response shape:

```json
{
  "clueText": null,
  "isClueLimitReached": false,
  "cluesRemaining": 2,
  "isRateLimited": true,
  "retryAfterMs": 34000
}
```

---

## Alternatives considered: Cloudflare-native rate limiting

Investigated before settling on the D1 plan (verified against Cloudflare docs,
2026-08). The native options are either **permissive** or **global** — none
provide exact per-session accounting, which is the requirement here.

| Option | Scope | Accuracy | Behavior | Verdict |
|---|---|---|---|---|
| **Workers AI account limits** (already active) | Per-account, per task/model | Exact ceiling | 300 req/min text gen (per-model 150–1500); frontier models 20 req/min per account; excess → error → `generateClue` returns `null` | Real hard ceiling; zero code. Keep as the account backstop — you cannot exceed it. |
| **Rate Limiting binding (`RATE_LIMITER`)** | Keyed by arbitrary string (could be session) | **Permissive, eventually consistent** (docs: "not an accurate accounting system") | Fixed window, period must be 10s or 60s; `limit()` → `{success}`; you return 429 yourself | Counters cached locally + async → excess slips through before enforcement. Wrong as sole AI-quota guard; likely paid; Wrangler 4.36+. Not worth layering. |
| **WAF rate limiting rules** | Zone-level, IP-based | Permissive (up to seconds delay) | Free: 1 rule/10s. Pro: 2 rules/1min. Block → error 1015, **not** 429 | Coarse per-IP backstop only; can't distinguish expensive AI calls from cheap eligibility rejections. |
| **AI Gateway** | Per-gateway (all traffic through one gateway) | Accurate, fixed or sliding window | 429 on exceed, request not processed; all plans | Global cap on all AI traffic + caching/observability. But gateway-wide (not per-user) and requires routing AI calls through a gateway URL + token instead of the `AI.run()` binding — a different integration. Good deferred account-level layer. |
| **Durable Objects** | Per-key single-writer | Accurate, in-memory counter | Classic Cloudflare rate-limiter reference pattern | High-throughput per-key, but adds a DO binding + state model. Overkill at this app's scale vs. the D1 atomic claim. |

**Conclusion:** the D1 atomic claim is not re-inventing the wheel — it is the
*accurate* layer Cloudflare's own tools deliberately omit. The native options
are permissive (binding, WAF rules) or global (AI Gateway, Workers AI limits),
while the requirement is an exact per-session window before an expensive
downstream call. Cloudflare's own guidance is to use D1 for accurate rate
limiting. The native complements worth keeping: Workers AI account limits
(hard ceiling, already free) and, optionally, AI Gateway as a future
account-wide cap/observability layer.

---

## Phase A — Backend (implemented)

1. **Spike:** verified the `.select()`-builder conditional-insert claim on D1
   — `clueRateLimit.integration.spec.ts` (under-cap claim, at-cap reject,
   expired rows ignored, `retryAfterMs` math, prune).
2. **Schema:** `clue_rate_limits` added to `src/shared/schema.ts`;
   migration `0015_broken_supernaut.sql` generated.
3. **Helper:** `src/worker/graphql/gameplay/clueRateLimit.ts` exporting
   `CLUE_RATE_LIMIT_WINDOW_MS`, `CLUE_RATE_LIMIT_MAX_REQUESTS`,
   `computeRetryAfterMs`, and `claimClueRateLimit(db, sessionProgressId)`
   returning `{ claimed: boolean; retryAfterMs: number | null }`. Handles the
   batch (claim + prune) and the rejection-path advisory read.
4. **Resolver:** claim wired into `requestClueMutation.ts` between
   `computeCanRequestClue` and `generateClue`. Rejected → rate-limited shape,
   no AI call. All existing return paths gain `isRateLimited: false`.
5. **Contract:** `RequestClueResultType` + `REQUEST_CLUE_MUTATION` extended.
6. **Tests:**
   - `clueRateLimit.spec.ts` (unit): constants + `computeRetryAfterMs` math.
   - `clueRateLimit.integration.spec.ts`: direct claim behavior on D1 —
     under-cap claim, at-cap reject, expired rows ignored, exact
     window-boundary release (ms precision), `retryAfterMs` math, prune.
   - `requestClue.integration.spec.ts` (extended): pre-seeded in-window cap →
     rejected with `isRateLimited: true` + correct `retryAfterMs`,
     `generateClue` **not** called; expired rows → allowed; per-gate clue cap
     distinct from rate limiting. Existing tests keep passing (additive).

**Files changed:** `src/shared/schema.ts`, `migrations/0015_broken_supernaut.sql`,
`src/worker/graphql/gameplay/clueRateLimit.ts`, `clueRateLimit.spec.ts`,
`clueRateLimit.integration.spec.ts`, `requestClueMutation.ts`, `types.ts`,
`src/shared/gqlQueries.ts`, `requestClue.integration.spec.ts`,
`docs/clue-rate-limiting.md`.

---

## Phase B — Frontend (planned, depends on Phase A contract)

1. `useRequestClueMutation.ts`: add `isRateLimited` / `retryAfterMs` to
   `RequestClueResponse`.
2. `useProgramPlay.ts`: on a rate-limited response, set a
   `clueCooldownUntil` state (`Date.now() + retryAfterMs`) and clear it on
   gate change; surface a "Clue cooldown — try again in Ns" message via the
   existing message/`role="status"` mechanism. Do not flip `canRequestClue`
   off — keep the button rendered but disabled during cooldown so the player
   sees the countdown.
3. `ActiveGate.tsx`: pass an `isClueCooldown` flag / `cooldownSeconds` prop;
   disable the clue button during cooldown and show the countdown. Follow the
   existing `isMutationPending` disable pattern. A lightweight
   `setInterval`-driven countdown — no new dependency.
4. **Tests:** `ActiveGate.spec.tsx`, `ProgramPlay.spec.tsx`,
   `ProgramPlay.integration.spec.tsx`, `useProgramPlay.spec.ts` for the
   cooldown render + button-disable states.

**Files:** `useRequestClueMutation.ts`, `useProgramPlay.ts` (+spec),
`ActiveGate.tsx` (+spec), `ActiveGate.module.css` (cooldown styling),
`ProgramPlay.spec.tsx`, `ProgramPlay.integration.spec.tsx`.

---

## Phase C — Deferred (not built now; reference only)

- **Config:** promote `CLUE_RATE_LIMIT_WINDOW_MS` and
  `CLUE_RATE_LIMIT_MAX_REQUESTS` to env vars in `wrangler.jsonc` + `Env` type
  + `mockEnv.ts`.
- **Observability:** log rate-limit rejections (session id, `retryAfterMs`) so
  the window value can be validated in production.
- **IP/account dimension:** only meaningful defense against session-farming.
  Would add a Cloudflare Rate Limiting binding (paid plan) or a D1 table keyed
  by IP hash, with false-positive risk on shared NATs. Decide only after
  production rejection metrics show session-level limits are insufficient.
- **AI Gateway:** account-wide cap + observability layer (see alternatives
  table).

---

## PR sequencing

| PR | Phase | Depends on | Scope |
|---|---|---|---|
| 1 | A | — | Backend: migration, helper, resolver, contract, tests |
| 2 | B | PR 1 | Frontend: cooldown UX, contract consumption, tests |

Phase C is explicitly deferred and not sequenced.

## Verification checklist

```bash
bun run check:code
bun run build
bun run test --run
bun run test:integration
bun run test:e2e
```

Migration steps for deployed environments when Phase A merges:
`bun run migrate:preview` then `bun run migrate:prod`.
