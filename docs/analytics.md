# Analytics & Observability

## Goal

Instrument gameplay, client errors, and AI usage with privacy-respecting,
first-party analytics. No third-party SDKs, no cookies, no fingerprinting.
Pseudonymous by default — events are keyed on a client-generated `sessionId`,
never the Better Auth user.

## Sink: Cloudflare Analytics Engine

Chosen over a D1 events table: purpose-built for events, write-optimized,
queryable via SQL API, and does not pay a write against the gameplay DB.
Matches the all-in-on-Cloudflare stack.

- Binding: `ANALYTICS`, dataset `program_events` — configured in both the
  top-level and `env.preview` sections of `wrangler.jsonc` (wired by the ops
  PR of this change stack).
- The dataset is account-level; one dataset serves prod + preview,
  distinguished by the `env` blob.
- Retention: 90 days.
- Analytics Engine may sample at write or query time — the reference queries
  below are sampling-aware (`_sample_interval`).
- Write is fire-and-forget (`writeDataPoint`, no await). 250 data points max
  per Worker invocation — our resolvers emit ≤2 per request.

## Column contract (positional — do NOT reorder)

Analytics Engine has no schema enforcement; blobs/doubles/indexes are
positional. Adding a field appends at the end; never insert in the middle, or
existing queries break silently.

| Position | Name          | Type   | Notes                                        |
|----------|---------------|--------|----------------------------------------------|
| index1   | session_id    | string | 36-char UUID, ≤96B limit. High-cardinality filter. |
| blob1    | event         | string | `program_started`, `gate_attempt`, ...        |
| blob2    | program_id    | string | `""` when n/a                                 |
| blob3    | gate_id       | string | `""` when n/a                                 |
| blob4    | outcome       | string | per-event vocabulary (below)                  |
| blob5    | env           | string | `production` / `preview` / `test`             |
| blob6    | detail        | string | free-form, truncated to 1KB by `trackEvent`   |
| double1  | attempt_count | number | `0` when n/a                                  |
| double2  | is_correct    | 0/1    |                                               |
| double3  | ai_latency_ms | number | `0` when n/a                                  |

`session_id` is the sole index: it is the highest-cardinality field and the
join key for per-session funnels. Every other blob is low-cardinality and safe
to group via `GROUP BY`. `detail` is the exception — free-form, potentially
high-cardinality; use it as a drill-down field, not a grouping dimension.

## Events

| Event              | Fired from                         | `outcome` vocabulary                                        |
|--------------------|------------------------------------|-------------------------------------------------------------|
| `program_started`  | `getProgramProgression`, only when a new `session_progress` row is created | `fresh` |
| `gate_attempt`     | `submitGuess`, incorrect path      | `incorrect`                                                 |
| `gate_completed`   | `submitGuess`, correct path        | `correct`                                                   |
| `program_completed`| `submitGuess`, correct path with status `completed` | `complete`                                      |
| `clue_requested`   | `requestClue`                      | `not_eligible` \| `budget_exhausted` \| `rate_limited` \| `success` \| `duplicate` \| `ai_failed:{no_binding\|empty\|answer_leak\|error}` |
| `session_reset`    | `resetSession`, only when a session row actually exists | `reset` |
| `client_error`     | `POST /api/error` beacon           | `boundary` \| `route` \| `boot`                             |

Event invariants:
- `gate_completed` / `gate_attempt` carry `attempt_count`. On a correct guess,
  `attempt_count` is the pre-reset value (guesses *before* the successful one)
  — i.e. attempts-before-success.
- `clue_requested` carries `ai_latency_ms` on `success` and `ai_failed:*`
  outcomes; it is 0 for pure gatekeeping outcomes (`not_eligible`,
  `budget_exhausted`, `rate_limited`, `duplicate`).

## API boundary

Playback and authoring remain GraphQL-only. The single `POST /api/error`
endpoint is telemetry, not a gameplay or authoring path — it exists because
client error capture must work exactly when the GraphQL client is broken
(pre-bootstrap chunk load, boundary failure). `navigator.sendBeacon` cannot
set headers, so a dedicated route is required and the `sessionId` travels in
the request body (it cannot go in the `x-session-id` header). The client sends
a `Blob` typed `application/json`; the route parses it as JSON.

The route validates the JSON body (size + schema), caps `sessionId` and field
lengths server-side, and writes a `client_error` data point via `trackEvent`,
returning `{ ok: true }`. Client-side throttling is not an abuse control — a
direct caller is not throttled; there is no server-side volume limiter yet. No
queueing, no retries.

## Client capture (`reportError` util)

- `ErrorBoundary.componentDidCatch` → `client_error:boundary`
- `RouteErrorFallback` → `client_error:route`
- `index.html` boot error listener → `client_error:boot` (inline, pre-bundle)
- Transport: `navigator.sendBeacon("/api/error", blob)` where `blob` is a JSON
  `Blob`; guarded for `navigator.sendBeacon` availability and skipped in dev
  (`import.meta.env.DEV`).
- Throttled client-side to ~1/sec; stack truncated to 1KB; `console.error`
  retained for local/dev. Error text is sanitized (`sanitizeErrorText`) before
  it leaves the client, and again server-side before it is stored.

## AI observability

`aiService.generateClue` returns a structured result
(`{ clueText, reason, latencyMs }`) instead of collapsing every failure mode
to bare `null`. `requestClue` maps the reason onto the `clue_requested`
`outcome` and records AI latency. This pairs with the existing `ai_usage`
daily budget guardrail — budget counts launched generations, while
`clue_requested` tracks quality outcomes.

## Structured logging (Workers Logs)

`observability.enabled` is already on; the logs were the problem. Now:

- `requestIdMiddleware` sets `x-request-id` (echoed on the response) and
  `requestId` in the Hono context.
- `conditionalLogger` emits a single JSON line per request:
  `{ ts, level, method, path, status, durationMs, requestId, sessionId }`.
- `logError` emits JSON: `{ ts, level, method, path, requestId, message,
  cause }` — `message` and `cause` are sanitized (`sanitizeErrorText`) before
  writing; the raw error object is never logged whole.

Output stays on stdout → Workers Logs, but is now filterable/queryable.
Retention there is plan-dependent (3 days Free / 7 days Paid), distinct from
Analytics Engine's 90 days. Logs carry `sessionId`.

## Privacy posture

- Pseudonymous: keyed on a client-generated random UUID (`sessionId`), never
  the Better Auth user. A persistent pseudonymous identifier can still be
  personal data (GDPR Art 4(5), CCPA "unique identifiers") — reusing
  `sessionId` for leaderboards (see `docs/feature-ideas.md` §4.1) or exposing
  these events externally requires a separate privacy review.
- First-party: no third-party requests, no cookies, no fingerprinting.
- Data stays inside the Cloudflare account. Retention: Analytics Engine 90
  days; Workers Logs 3–7 days (plan-dependent).

## Reference queries

```sql
-- Daily attempt + completion funnel per program (last 7 days)
SELECT blob2 AS program_id,
       sumIf(_sample_interval, blob1 = 'gate_attempt') AS attempts,
       sumIf(_sample_interval, blob1 = 'gate_completed') AS completions
FROM program_events
WHERE timestamp >= NOW() - INTERVAL '7' DAY
GROUP BY blob2;

-- Average attempts-before-success per gate (weighted for sampling)
SELECT blob3 AS gate_id,
       SUM(_sample_interval * double1) / SUM(_sample_interval)
         AS avg_attempts_before_success
FROM program_events
WHERE blob1 = 'gate_completed'
  AND timestamp >= NOW() - INTERVAL '30' DAY
GROUP BY blob3;

-- Clue outcome mix (last 7 days)
SELECT blob4 AS outcome, SUM(_sample_interval) AS n
FROM program_events
WHERE blob1 = 'clue_requested'
  AND timestamp >= NOW() - INTERVAL '7' DAY
GROUP BY blob4;

-- p95 AI latency for generated clues (double3 = 0 are gatekeeping outcomes,
-- not generations, and would skew latency)
SELECT quantileExactWeighted(0.95)(double3, _sample_interval) AS p95_ai_latency_ms
FROM program_events
WHERE blob1 = 'clue_requested'
  AND double3 > 0
  AND timestamp >= NOW() - INTERVAL '7' DAY;

-- Per-session funnel for one visitor (weighted)
SELECT blob1 AS event, SUM(_sample_interval) AS n
FROM program_events
WHERE index1 = 'SESSION_UUID' AND timestamp >= NOW() - INTERVAL '90' DAY
GROUP BY blob1;
```
