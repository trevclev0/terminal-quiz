# Mutation Testing

**Status:** Implemented (#326). Two Stryker configs run on a schedule in
`.github/workflows/mutation.yml`. The slow-tier decision is recorded at the
end.

This is the decision record: what is mutated, what is left out and why, the
measured numbers, and how survivors are triaged. The step-by-step build plan
lives in #326 and in git history.

## What each config mutates

| Config | Command | Mutates | Break |
|---|---|---|---|
| `stryker.config.json` | `bun run mutate` | `src/worker/utils/**`, `shared/validation.ts`, `shared/gameCommands.ts`, `clueEligibility.ts`, `bootSequence.ts`, and 15 React hooks in `src/react-app/hooks/` | 90 |
| `stryker.resolvers.config.json` | `bun run mutate:resolvers` | `submitGuessMutation`, `activeSession`, `authorizeProgram`, `managementHelpers`, `requestClueMutation`, `aiBudget`, `clueRateLimit` | 82 |

Both run the unit tier only (Vitest, `coverageAnalysis: "perTest"`,
`ignoreStatic: true`) and exclude `*.spec.ts(x)` and `test-utils/`. Each has
its own `incrementalFile`, HTML report path and `tempDirName`, so one run never
invalidates or overwrites the other.

The resolver break is set from the measured score: floor(84.86) = 84, minus 2.
It is never lowered to make a run pass.

## What is excluded and why

- **Components, routes, API hooks, `main.tsx`.** Their behavior is rendering
  and wiring, covered by component and E2E specs. Mutants there are mostly
  markup and CSS-class noise.
- **Resolvers not in the list** (reset session, programs, gates, reorder, queries). Not yet
  triaged; the seven above are the security-critical path.
- **Raw SQL and drizzle builder arguments** are not excluded but cannot be
  killed by unit specs, which mock the database. See the integration-covered
  tables below.
- **No hook was excluded.** `useProgramSettings` stays at 87.50 by ruling: its
  only survivors are confirmed equivalents in a 17-mutant file, and excluding
  it would drop 14 killed mutants of protection.

## Numbers

| Run | Before | After |
|---|---|---|
| `mutate` on `main` (cold) | 183 mutants, 83.61, exit 1 | 153 mutants, 100%, about 44s (route fix only) |
| `mutate`, hooks added (cold) | | 98.43, about 2m09s |
| `mutate:resolvers` (cold) | 64.79 (first pass 53.52) | 84.86, about 41s |

The `main` baseline failed because `bootSequence.ts` in `mutate` pulled route
specs into the run, and TanStack `autoCodeSplitting` lazy-loaded `validation.ts`
inside one route test, so Stryker credited its 30 module-level mutants to that
test and they survived. `vite.config.ts` now sets
`autoCodeSplitting: !process.env.VITEST`. Production builds still split.

Those 30 `validation.ts` module-level mutants are now Ignored as static (as they
were before #274), not killed, so a 100% score does not mean the `validation.ts`
statics are guarded.

The resolver run has one Timeout: `requestClueMutation.ts:242`, a BlockStatement
on the `while (current instanceof Error)` loop. Emptying the body is a genuine
infinite loop, and Stryker counts a timeout as detected.

## Triage categories

Every survivor or NoCoverage mutant gets exactly one label.

- **Test gap.** A behavior no test asserted. Write a test that observes it.
  Tests assert outcomes only: results, rendered output, payloads sent to an
  external binding (`ANALYTICS.writeDataPoint`, `AI.run`). Never assert on
  mocked query-builder arguments or call order to kill a mutant.
- **Equivalent.** No observable behavior differs. Leave it visible, or add a
  `// Stryker disable next-line <Mutator>: <reason>` only when every
  replacement of that mutator on the line is equivalent. A disable covers all
  replacements of the mutator on the line, so it must never hide a mutant you
  could have killed.
- **Bug.** The mutant exposes real misbehavior. Fix it in its own `fix` commit
  with a test and call it out in the PR. None found in #326.
- **Integration-covered.** Pure SQL or query-builder shape that the mocked unit
  tier cannot see. Proof rule: hand-apply the mutation to the source, run
  `bun run test:integration` (Miniflare, in-memory D1), and name at least one
  integration test that fails. Revert the source. These stay visible survivors
  and are listed below; they are not disabled, so a stretch tier can still
  kill them.
- **Planner-dependent.** The SQL contract needs the code, but no test can
  observe it while the current indexes exist. Stays visible, with the
  integration test that would catch it if the schema changes.

### Constant-deps-array equivalents

`useCallback`/`useEffect` with `[]` deps mutate to `["Stryker was here"]`. The
constant never changes, so the callback stays stable and nothing observes the
difference. These are disabled with a short `ArrayDeclaration` comment on the
hook, and the pattern is documented only here. Keep the disable range tight
(`disable`/`restore` around the one call) so it covers no other array. If a
callback's deps are not constant, the mutant is not equivalent.

## Remaining survivors

### Hooks (`mutate`): equivalents

| Location | Why equivalent |
|---|---|
| `useProgramPlay` `clueCooldownUntil === null` to `false` | null arithmetic goes negative and clamps to 0 |
| `useProgramPlay` `retryAfterMs != null` to `true` | `null > 0` and `undefined > 0` are false |
| `useProgramSettings` `name === undefined` / `visibility === undefined` to `false` | both fields are undefined together, so the other operand decides alike |
| `useCopyToClipboard` `timerRef.current !== null` to `true` | cleanup only runs after the effect set the ref; the `false` sibling is killed, so no disable |
| `useCrtPreferences` `if (raw)` to `true` | `JSON.parse(null)` is null and the surrounding try/catch returns null as before |
| `useTypewriter` `text === "" ? text : ""` terms | both branches yield `""` |
| `useTypewriter` `if (true)` before `clearTimeout`/`clearInterval` | clearing a null handle is a no-op |
| `useTypewriter` `startDelay > 0` to `true`/`>= 0` | a 0ms timeout is indistinguishable from starting at once |

### Resolvers: integration-covered

Hand-mutated, then `bun run test:integration` (in-memory Miniflare). Specs live
in `src/worker/graphql/gameplay/`.

| Mutant | Mutator | Guarding integration test |
|---|---|---|
| `activeSession` 15:61, 30:53 | ObjectLiteral `findFirst({})` | submitGuess: "no session progress rejects guess", "completed program rejects further guesses" |
| `authorizeProgram` 12:53 | ObjectLiteral `findFirst({})` | programs: "programGates returns gates for an owned program" |
| `submitGuess` 65:28, 68:28, 145:28 | StringLiteral `sql\`\`` (attempt and total guess counters) | submitGuess: "wrong guess increments attempt count", "increments total_guesses on wrong and correct guesses" |
| `submitGuess` 73:72 | ObjectLiteral refetch `findFirst({})` | submitGuess: "wrong guess at attempt threshold enables clue" |
| `submitGuess` 116:39 | ObjectLiteral `findFirst({})` (next gate) | submitGuess: "correct guess advances to next gate", "advances to the next gate by sequence order, not insertion order" |
| `submitGuess` 117:18, 118:26 | ObjectLiteral `columns: {}`, BooleanLiteral `correctAnswer: true` | submitGuess: "correct guess advances to next gate" |
| `submitGuess` 134:17 | ObjectLiteral `.values({})` | submitGuess: "correct guess advances to next gate" |
| `submitGuess` 146:15 (x3), 146:29, 146:43 | completedAt stamping | submitGuess: "stamps completed_at only when the final gate is solved" |
| `clueRateLimit` 74:20, 79:15, 81:19, 82:20, 83:35, 86:24, 87:39, 90:29, 92:20, 94:16, 108:18 | claim select, WHERE guard, cutoff | clueRateLimit: "claims a slot when under the cap", "claims up to the cap across distinct attempts within the window, then rejects" |
| `clueRateLimit` 122:13 | `select({})` attempt lookup | clueRateLimit: "rejects a second claim for the same attempt within the window" |
| `clueRateLimit` 146:13 | `select({})` oldest lookup | clueRateLimit: "blocks a claim just inside window (precise retryAfterMs)" |
| `aiBudget` 31:13, 32:25, 34:12, 34:31, 36:16 | reserve upsert | requestClue: "returns clue text when eligible", "AI returning null is handled gracefully" |
| `aiBudget` 52:10, 52:29 | release update, `MAX(0, x-1)` | requestClue: "rate limit: in-window cap rejects with retryAfterMs", "ai budget exhausted: rejects before any AI call, slot, or increment" |

`117:18` and `118:26` are caught because the broken projection breaks other
fields of the next gate, not by a leak check. `nextGate` is `ActiveGateType`
(id, label, question), so GraphQL strips `correctAnswer` regardless.

The 13 NoCoverage mutants in `clueRateLimit` sit inside the
`.select((qb) => ...)` callback, which the mocked unit tests never invoke.
Eight are integration-covered (rows above); five are the `.as()` aliases below.

### Resolvers: equivalent

| Mutant | Why equivalent |
|---|---|
| `clueRateLimit` 82:48, 84:15, 86:39, 88:15, 90:43 (`.as("<alias>")` to `""`) | column aliases do not affect positional mapping in `INSERT ... SELECT`; all integration tests still pass. No disable, because the same mutator on 82/86/90 also covers non-equivalent `sql` mutants |
| `aiBudget` 12:18 ConditionalExpression `false` | `parseInt(undefined, 10)` is NaN, same as the original for an unset value |

Across the three clue files that is 26 survivor/NoCoverage mutants: 20
integration-covered plus 6 equivalent.

### Resolvers: planner-dependent

| Mutant | Guard |
|---|---|
| `submitGuess` 124:18 ArrayDeclaration `orderBy: []` | integration "advances to the next gate by sequence order, not insertion order" (gates inserted 1, 3, 2). It passes with the mutation because `unique_program_sequence (program_id, sequence_order)` serves the range scan in index order. If that index changes, this test is the one that fails |

## Zero-quota rule

No mutation config may use remote bindings, run E2E, or touch preview or
production D1. Workers AI is mocked. "Integration" means Miniflare in-memory
only. The scheduled workflow spends no Cloudflare quota.

## Triage workflow

1. Run the config cold (delete its incremental file first) and read the
   clear-text survivors.
2. Label each survivor with one category above.
3. Test gaps get a behavior test; confirm the mutant reports Killed on a
   targeted rerun (`stryker run --mutate "<globs>" --incrementalFile <scratch>`).
4. Integration-covered survivors get the hand-applied proof, then a row here.
5. A file may sit below 90 only when every survivor is a confirmed equivalent.
   Exclude a file only if it has actionable survivors that cannot be killed
   without pinning internals.

## Slow tier

Evaluated and rejected: a `command`-runner config over
`bun run test:integration` would kill the integration-covered survivors
automatically, but it does not fit the 30 minute budget.

Measured on `activeSession.ts` (23 mutants, `coverageAnalysis: "off"`,
`concurrency: 2`, in-memory Miniflare, no remote bindings):

| Machine | Wall time | Per mutant | Score |
|---|---|---|---|
| Dev box, ~6.5 cores busy | 2m57s | 7.7s | 86.96% (20 killed, 3 survived) |
| Pinned to 4 cores (`taskset -c 0-3`, like ubuntu-latest) | 5m23s | 14.0s | 86.96% |

It kills both `activeSession` `findFirst({})` mutants (15:61, 30:53) that the
unit tier cannot see. The 3 survivors are the gate-not-found branch at
34:7/34:20/35:21, which the schema's foreign keys make unreachable.

Extrapolation: the five files holding integration-covered survivors
(`activeSession`, `authorizeProgram`, `submitGuessMutation`, `aiBudget`,
`clueRateLimit`) have 182 non-ignored mutants in the resolver run. Each
integration run is multi-threaded workerd (about 43 CPU-seconds), so wall time
scales with core count, not with `concurrency`: 182 x 14.0s is about 42
minutes on a 4 vCPU runner, over the 30 minute limit. Nothing shipped.

Two other findings, if this is revisited:

- The command runner passes the active mutant as the Node env var
  `__STRYKER_ACTIVE_MUTANT__`, which workerd never sees, so every mutant
  "survived" (0%) until the variable was forwarded as a Miniflare binding in
  `vitest.config.integration.ts`.
- `ignoreStatic` is rejected with `coverageAnalysis: "off"`, and
  `tsconfigFile` must point at a nonexistent file (as in the other configs).

To rerun the measurement, copy `stryker.resolvers.config.json`, set
`testRunner: "command"`, `commandRunner.command: "bun run test:integration"`,
`coverageAnalysis: "off"`, drop `ignoreStatic`, `vitest` and `plugins`, give it
its own `incrementalFile`, report path and `tempDirName`, forward the env var
(below), and run it under `taskset -c 0-3`. The forwarding, under
`miniflare.bindings` in `vitest.config.integration.ts`:

```ts
bindings: {
  // ...existing bindings
  __STRYKER_ACTIVE_MUTANT__: process.env.__STRYKER_ACTIVE_MUTANT__ ?? "",
},
```

Until then the hand-applied
proofs in the tables above are the integration tier's coverage.
