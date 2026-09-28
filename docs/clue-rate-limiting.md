# AI Clue Rate Limiting

**Status:** Implemented. Backend + frontend cooldown UX shipped in #219
(releases 2.75.0 / 2.76.0); the per-attempt reservation followed in #221
(migration 0016). Deferred "Phase C" options are tracked in #316.

This is the decision record for the per-session limiter and the global daily
AI budget layered on top of it. The step-by-step build plan lives in the
issues above and in git history.

## Goal

Prevent a single session from spamming `requestClue` and burning Workers AI
quota by enforcing a session-wide temporal rate limit: **rolling 3 AI clue
requests per 60 seconds**, enforced atomically *before* the AI call, with the
rate-limited state surfaced to the client so the UI can show a cooldown.

## Why the claim runs before `generateClue`

The original idea was an insert-time guard on `gate_clues`: a D1
transaction with a `SELECT CASE WHEN EXISTS ...` check that rejects if a
clue was created in the last 10s.

That does not work. In the current resolver
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

The claim serializes **per window AND per attempt** (#221, landed as a
follow-up to the initial backend): the guard's `NOT EXISTS` arm reserves a slot per
(session, gate, attempt), so within one window only one request at a given
(gate, attempt) wins a slot. Three concurrent requests at the same
`(gate, attemptCount)` therefore run `generateClue` at most once — the rest
are rejected before any AI spend, instead of each calling `generateClue` and
only one surviving the `unique_clue_per_attempt` insert.

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
the rate limit. IP/account-level limiting and env-var tuning are deferred
(#316).

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
  // Per-attempt reservation (#221) — one slot per (session, gate, attempt)
  // in-window. Nullable: legacy rows predate the columns and expire out of
  // the window.
  gateId: text("gate_id"),
  attemptCountAtRequest: integer("attempt_count_at_request"),
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
        gateId: sql`${gateId}`.as("gate_id"),
        attemptCountAtRequest: sql`${attemptCountAtRequest}`.as("attempt_count_at_request"),
        requestedAt: sql`${nowMs}`.as("requested_at"),
      })
      .from(sql`(select 1)`)
      .where(sql`(
        SELECT COUNT(*) FROM clue_rate_limits
        WHERE session_progress_id = ${sessionProgressId}
          AND requested_at > ${cutoffMs}
      ) < ${CLUE_RATE_LIMIT_MAX_REQUESTS}
      AND NOT EXISTS (
        SELECT 1 FROM clue_rate_limits
        WHERE session_progress_id = ${sessionProgressId}
          AND gate_id = ${gateId}
          AND attempt_count_at_request = ${attemptCountAtRequest}
          AND requested_at > ${cutoffMs}
      )`),
    )
    .returning({ id: clueRateLimits.id }),
  db.delete(clueRateLimits).where(lt(clueRateLimits.requestedAt, cutoff)),
]);
```

- Row returned → slot won, proceed to `generateClue`.
- No row → either the session is at the window cap (3 in-window rows) or the
  attempt is already reserved in-window → **rejected**, before any AI spend.

The `.select()` builder requires the select to produce **all table columns
positionally, including `id`** (drizzle builds the INSERT column list from
every column in definition order and pushes the SELECT verbatim) — hence the
explicit `id` with `crypto.randomUUID()`.

Concurrency: two simultaneous requests at the same (gate, attempt) serialize
— the first inserts the reservation row, the second's `NOT EXISTS` arm sees
it and returns 0 rows. Exactly one AI call per (gate, attempt) per window;
the count guard still caps distinct attempts at 3 per window session-wide.

`retryAfterMs` is advisory, read only on the rejection path (the happy path
pays no extra query). When the per-attempt reservation is what blocked the
claim it is computed from **that attempt's own row** (its expiry, not the
oldest row's, is the honest cooldown for a retry at the same attempt);
otherwise from the **oldest in-window row**; otherwise the full window (a
prune raced the claim). The count-guarded insert stays the sole enforcement
point.

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

## Related layer: global daily AI budget

The limiter bounds a *single session*. It cannot bound *sessions ×
players*, which is the dimension that actually exhausts the shared Workers
AI allocation. The free tier's daily Neuron pool works out to roughly 200
clue generations per day; past it, clues fail app-wide until 00:00 UTC. So a
second, global guardrail sits in front of this one (#227;
`src/worker/graphql/gameplay/aiBudget.ts`, `ai_usage` table,
`AI_DAILY_CLUE_BUDGET`):

| Decision | Choice | Why |
|---|---|---|
| Scope | One app-wide daily counter, not per author or program | The failure mode is a shared daily pool. Per-author accounting adds tables for marginal value at this scale. |
| Default | ~150/day, env-configurable | Comfortably under the free-tier equivalent; tune from observed usage. |
| Accounting | Atomically **reserve** one unit (upsert + `RETURNING`) **before** the rate-limit claim; release it only when the AI was provably never called (over-budget race loser, rate-limit rejection) | D1 is single-writer, so concurrent requests get strictly increasing counts and can't all slip past the cap. An over-budget request burns no rate-limit slot and makes no AI call. A failed or unstored generation keeps its reservation because it may still have billed. The counter tracks *launched* generations, not stored clues. |
| On exhaustion | `clueText: null` + `isAiBudgetExhausted: true`; the client says "try again tomorrow", with no cooldown timer | A raw 429, or the generic "try again" message, would mislead: retrying cannot help until the UTC day rolls over. |
| Purpose | Availability protection on Free; bill protection on Paid | The free tier hard-caps spend, so today it keeps clues working for everyone rather than saving money. |

`guidanceThreshold` does **not** drive AI cost. Per-session spend is
already capped by `MAX_CLUES_PER_GATE` and this limiter; the threshold only
shifts *when* clues unlock. That is why authors keep the knob. It is bounded
to `1..MAX_CLUES_PER_GATE` (3) so it stays coherent with the
"1st/2nd/3rd Clue" UI, and it sits under an "Advanced" disclosure in the
editor (#226).

The client therefore has three distinct clue-failure paths: AI failure
(retry now), rate-limited (cooldown countdown), and budget exhausted (try
tomorrow).
