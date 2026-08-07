---
project: terminal-quiz
status: draft
repo: terminal-quiz
repo-path: docs/fix-deploy-workflow.md
pr:
---

# CI Deploy Workflow Optimization

**Origin:** Review of `.github/workflows/deploy.yml` (2026-08-06)
**Owner:** TBD
## Context
`.github/workflows/deploy.yml` builds, migrates, and deploys the app to

Cloudflare, then runs Playwright E2E against the deployed preview on PRs.

The workflow is now noticeably slower than it used to be. Recent commit

history shows the E2E/Playwright pipeline landed incrementally across

`d32856a` → `ccc5296` (5 commits) — that is the new recurring cost, not a

regression elsewhere.

  

**Current structure:** one serial `deploy` job on `ubuntu-latest` (2-core

runner):

  

```text

checkout → setup-env → build → D1 migrations → deploy

→ Get Playwright version → Cache browsers → install-deps → install

→ E2E → upload report → Update Deployment (success/failure)

```

  

Every PR pays the full chain serially. On `main` pushes the Playwright steps

are skipped via `if:`, so main runs are already lean — the slowness is the

PR path.

  

## Recurring per-PR costs (rough)

  

| Step                                                  | Cost    | Notes                                                                       |
| ----------------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `bunx playwright install-deps` (apt)                  | ~40-60s | Runs every PR; system libs needed on fresh runner even with cached browsers |
| `bunx playwright install chromium firefox`            | ~1-2min | Skipped only on browser-cache hit — see Item 1                              |
| E2E suite                                             | ~2-4min | chromium + firefox, 2 workers, 1 retry                                      |
| `bun install --frozen-lockfile`                       | ~20-40s | Re-runs fully each time; pkg cache warm but relink cost remains             |
| build + migrations + deploy (wrangler-action, Docker) | ~1-2min | Mostly irreducible; wrangler-action pulls a container                       |
## Execution order (do in this sequence)

  

### Item 1 — Verify the Playwright cache actually writes (diagnostic, do first)

  

The `Cache Playwright browsers` step is named **restore-only**. If that is

literal (save disabled), the cache never populates and both browsers install

on **every** PR — a likely source of the perceived regression.

  

**Check:** in a recent PR run's logs —

1. The `Cache Playwright browsers` step should print `Cache hit: true` on a

repeat run with the same Playwright version.

2. There should be a `Post Cache playwright` step after the E2E step

reporting saved bytes.

  

**If it never hits:** the step is not saving. Decide the intended behavior:

- If save is intended, ensure the action saves (add `save: 'true'`, or

correct the step so the post-phase writes the cache).

- Note the install step gates on `steps.playwright-cache.outputs.cache-hit != 'true'`,

so an always-miss means browsers install every run.

  

**Outcome gates this plan:** if the cache is genuinely broken and fixable,

the fix alone recovers ~1-2min/PR on repeat runs. If the cache is fine, the

recurring cost is install-deps + the suite, which Item 3 addresses.

  

### Item 2 — Split E2E into its own job

  

Refactor `deploy.yml` from one `deploy` job into two jobs:

  

```yaml

jobs:

deploy:

runs-on: ubuntu-24.04

permissions:

contents: read

deployments: write

steps:

- checkout

- Create GitHub Deployment

- Setup Environment

- Run build

- Apply D1 Migrations

- Deploy to Cloudflare

- Update Deployment (success/failure) # gated on deploy, not e2e

  

e2e:

runs-on: ubuntu-24.04

needs: deploy

if: github.event_name == 'pull_request' && !github.event.pull_request.head.repo.fork && needs.deploy.result == 'success'

timeout-minutes: 20

steps:

- Get Playwright version

- Cache Playwright browsers

- Install Playwright system dependencies

- Install Playwright browsers

- Run E2E Tests

- Upload Playwright Report

```

  

**Rationale:**

- Playwright setup isolates to the E2E job; the deploy job no longer carries it.

- Independent `timeout-minutes` so a hung E2E doesn't consume the deploy job's budget.

- Deploy job completes and reports its own status; E2E failures don't re-mark

a successful deploy as error (deployment-status steps get split accordingly).

- Unlocks Item 3 (container job).

- Same PR wall-clock — E2E still must wait for the deployed URL.

  

**Concurrency note:** keep both jobs in the same `concurrency` group

(workflow-level) so pushes to a branch still cancel in-progress runs as a whole.

  

### Item 3 — Run E2E in a Playwright container job

  

Biggest recurring win. Replace the browser setup steps with a

`mcr.microsoft.com/playwright` container, which pre-bakes the browsers and

their system libraries.

  

```yaml

e2e:

runs-on: ubuntu-24.04

container:

image: mcr.microsoft.com/playwright:v1.5X.X-noble # pin to package.json playwright version

needs: deploy

if: github.event_name == 'pull_request' && !github.event.pull_request.head.repo.fork && needs.deploy.result == 'success'

timeout-minutes: 20

steps:

- checkout

- Setup Environment # bun install only; no browser install

- Run E2E Tests

- Upload Playwright Report

```

  

**Effect:**

- `install-deps` (~40-60s) and `install chromium firefox` (~1-2min) both

disappear — browsers + libs come from the image.

- The `Get Playwright version` + cache steps can be dropped entirely for the

E2E job (or kept only if a custom browser set is needed).

- `playwright.config.ts` needs no change: `BASE_URL` is passed, `webServer`

is already disabled when `BASE_URL` is set.

  

**Caveats:**

- Image tag must match the `playwright` devDependency version in

`package.json`. Keep them in sync — consider a comment in the workflow or

a Renovate/Dependabot rule. If they drift, Playwright may error on

browser version mismatch.

- The `Setup Environment` composite action uses `mise` — confirm it works

inside a container job (it installs mise + bun into the container; should

be fine, verify once).

  

### Item 4 — Cache `node_modules` in setup-env (optional, measure first)

  

`.github/actions/setup-env/action.yml` already caches `~/.bun/install/cache`

(keyed on `bun.lock`) but still runs `bun install --frozen-lockfile` fully.

Add a `node_modules` cache keyed on the same `bun.lock` hash:

  

```yaml

- name: Cache node_modules

uses: actions/cache@v6

with:

path: node_modules

key: ${{ runner.os }}-node_modules-${{ hashFiles('**/bun.lock') }}

restore-keys: |

${{ runner.os }}-node_modules-

```

  

**Measure before/after** — if `bun install` with a warm pkg cache is already

fast (~5-15s), skip this item; the cache churn may not be worth it.

  

### Item 5 — Pin `ubuntu-latest` → `ubuntu-24.04`

  

`ubuntu-latest` drifts (future 26.04 images change apt/toolchain behavior and

speed). Pinning makes runs deterministic. Applies to the `deploy` job and any

non-container E2E job. Low risk, do alongside Item 2.

  

## Low-value cleanup (do only if touching the file anyway)

  

- **Extract repeated condition** `github.event_name == 'pull_request' && !github.event.pull_request.head.repo.fork`

(currently 8 copies) into a computed job output or a named workflow

condition. Reduces drift risk when editing.

- **Merge the two `Update Deployment` steps** (success/failure) into one

`if: always()` step that computes state from `steps.deploy.outcome` /

`steps.e2e.outcome`. Fewer duplicated conditions.

- **Add `timeout-minutes`** to both jobs (e.g. deploy 15, e2e 20) so a hung

step fails fast instead of burning the default 6h budget.

- **Fold `Get Playwright version` into the cache key** via the lockfile hash

of the `playwright` package, skipping a redundant `bunx playwright --version`

invocation — only relevant if the E2E job stays runner-based (Item 3 drops

the step entirely).

  

## Non-goals

- Removing E2E from PRs, or trimming the browser matrix to chromium-only —
that is a coverage decision, not a perf fix; revisit only if E2E runtime becomes prohibitive.
- Restructuring build/deploy (D1 migrations must precede deploy; both are already minimal serial work).
- Anything that changes deploy semantics — this plan is time/ops hygiene only.

  

## Verification

After each item, push a PR and compare:

```bash

# trigger a PR run, then check in Actions:
# - Item 1: cache step prints cache-hit: true on a repeat run
# - Item 2: run shows two jobs (deploy, e2e), deploy succeeds independently
# - Item 3: e2e job logs "container ready" and skips install-deps/install;
# E2E still green against the preview URL
# - Item 4: node_modules cache restores; bun install duration drops

```

  

Acceptance: PR wall-clock meaningfully down (target: <5min total), deploy status reporting correct on both success and failure paths, E2E still green.

## Open questions

1. Does `actions/cache@v6` in this repo actually save by default (Item 1), or is the "restore-only" name accurate? — resolve by reading the log.
2. Does the `setup-env` composite action run correctly inside a container job (Item 3)? — verify on first container run.
3. Keep the browser cache at all after Item 3? If the E2E job is fully containerized, the cache is redundant and can be removed.