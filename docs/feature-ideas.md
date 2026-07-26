# Feature Ideas

Curated feature candidates for Terminal Quiz, organized by impact level.

---

## Contents

1. [High Impact — Low Effort, Big UX Win](#1-high-impact--low-effort-big-ux-win)
2. [Medium Impact — New Game Mechanics](#2-medium-impact--new-game-mechanics)
3. [High Impact — Backend / Infra](#3-high-impact--backend--infra)
4. [Lower Priority but Fun](#4-lower-priority-but-fun)

---

## 1. High Impact — Low Effort, Big UX Win

### 1.1 Answer History for Current Gate

**Problem:** Wrong guesses vanish after submission. Player can't spot patterns in what they've tried.

**Solution:** Show last N wrong guesses below the input, scoped to the current gate session. A simple list under the response message.

**Changes:**
- Frontend: `useProgramPlay` accumulates wrong guesses in local state per gate; displayed in `ActiveGate`.
- Backend: optional — could return last N guesses from `submitGuess` response, or store in a new `guess_log` table for persistence across page reloads.

**Effort:** Small. Pure frontend if transient, ~2 files if persisted.

---

### 1.2 Terminal-Style Loading Spinners

**Problem:** Current loading states show plain text (`"Loading..."`, `"Loading Program..."`). Breaks terminal immersion.

**Solution:** Replace with ASCII spinner animation (`| / - \`) in a `<pre>` or pseudo-element. Use CSS animation + content swapping.

**Changes:**
- New `Spinner` component or CSS-only spinner class.
- Replace text fallbacks in `ProgramPlay`, `ProgramSelector`, `ActiveGate`.

**Effort:** Very small. One new file.

---

### 1.3 Keyboard Shortcut Overlay

**Problem:** No discoverable keyboard shortcuts. Players reach for mouse on every action.

**Solution:** Press `?` to open a terminal-styled help dialog showing:

| Key | Action |
|-----|--------|
| `Enter` | Submit guess |
| `?` | Toggle this help |
| `C` | Request clue |
| `R` | Reset program |
| `N` | Select new program |

**Changes:**
- Global keydown listener in `__root.tsx` or a `useKeyboardShortcuts` hook.
- `TerminalHelpModal` component.

**Effort:** Small. 1–2 new files.

---

### 1.4 Cumulative Program Stats on Completion

**Problem:** "The End" screen shows nothing about how the player performed.

**Solution:** Display total attempts across all gates, clues used, time elapsed. Requires storing cumulative attempt count.

**Changes:**
- Schema: add `total_attempts` column to `session_progress` (increment on each wrong guess, not reset on gate advance).
- GraphQL: return stats in `submitGuess`'s final response or a new stats query.
- Frontend: stats panel in the "The End" view.

**Effort:** Medium. Schema migration + backend logic + UI.

---

### 1.5 Gate Progress Bar

**Problem:** No sense of how far through a program the player is.

**Solution:** ASCII progress bar at top of `ProgramPlay`:

```text
PROGRESS: [██████░░░░] 6/14
```

**Changes:**
- Frontend-only: compute from `completedGates.length` / total gates in program. Total gate count could come from a new field on `ProgressionPayload` or be fetched separately.

**Effort:** Small. One component.

---

## 2. Medium Impact — New Game Mechanics

### 2.1 Wrong Guess History (Persisted)

**Problem:** Answer history (1.1) is ephemeral. Players can't review what they tried after completing a gate.

**Solution:** Store wrong guesses in a `guess_log` table keyed to `(session_progress_id, gate_id)`. Display in `CompletedGate` as expandable "Failed attempts" section.

**Changes:**
- Schema: new `guess_log` table.
- Backend: insert on each failed `submitGuess`.
- Frontend: return guesses in `CompletedGate` type, display in component.

**Effort:** Medium. 3–4 files.

---

### 2.2 "Skip" Gate with Penalty

**Problem:** Some riddles are frustrating. No release valve.

**Solution:** After N failed attempts (e.g. 10), show "Reveal answer" button. Skipping marks the gate as completed but adds a strike visible in final stats.

**Changes:**
- Backend: `submitGuess` returns `canSkip` flag when attempt threshold met.
- Frontend: "Reveal answer" button calls a new `skipGate` mutation that completes the gate with a penalty flag.
- Schema: optional `was_skipped` column on `session_completed_gates`.

**Effort:** Medium.

---

### 2.3 Program Search / Filter

**Problem:** Current `<select>` works for 3 programs. Won't scale to 30+.

**Solution:** Search input that filters program list as you type. Terminal-style: `> find program: _` with live filtering.

**Changes:**
- Frontend: search input + filtered list replacing `<select>`.

**Effort:** Small–Medium.

---

### 2.4 Multiple Terminal Themes

**Problem:** Green phosphor is good. Options are better.

**Solution:** CSS custom properties for all colors. Theme selector persisted in `localStorage`. Offer:

| Theme | Primary | Background |
|-------|---------|------------|
| Green (current) | `#4caf50` | `#0a0f0a` |
| Amber | `#ffb000` | `#0f0b00` |
| White | `#c0c0c0` | `#0a0a0a` |
| Blue | `#4a9eff` | `#0a0a14` |

**Changes:**
- Refactor all `.module.css` files to use `var(--color-primary)`, `var(--color-bg)`, etc.
- Theme provider component + localStorage persistence.
- Toggle in a settings modal or footer.

**Effort:** Medium-high (touches all CSS files).

---

### 2.5 Typewriter Text Effect

**Problem:** Questions appear instantly. Terminal games traditionally "type out" text.

**Solution:** Character-by-character reveal on gate mount. Configurable speed. Toggleable.

**Changes:**
- `useTypewriter` hook: takes text, returns progressively revealed string with blinking cursor.
- Apply to `ActiveGate` question text.
- Toggle in settings or keyboard shortcut.

**Effort:** Small. One hook + CSS.

---

## 3. High Impact — Backend / Infra

### 3.1 Rate Limiting on `requestClue`

**Problem:** `requestClue` hits Workers AI on every call. No per-minute throttle. Malicious or buggy client could burn through AI quota.

**Solution:** Per-session rate limit using D1 transaction. Max 1 clue per 10 seconds, per gate. Atomic claim ensures concurrent Worker invocations cannot both pass the gate.

**Changes:**
- Backend: D1 transaction — `INSERT INTO gate_clues ...` with a `SELECT CASE WHEN EXISTS ...` guard that rejects if a clue was created within the last 10s for this session+gate. Transaction rollback on rejection avoids orphan rows.
- The `gate_clues` unique index on `(session_progress_id, gate_id, attempt_count_at_request)` provides an additional integrity layer.

**Effort:** Small. One transaction in `requestClue` resolver.

---

### 3.2 Session Cleanup Cron

**Problem:** `session_progress` rows accumulate forever. No TTL.

**Solution:** Durable Object alarm or cron trigger (Workers Cron Triggers) to delete rows where `updated_at < now - 30 days`.

**Changes:**
- New scheduled Worker or DO with alarm.
- Delete cascaded rows.

**Effort:** Small.

---

### 3.3 Full GraphQL Schema Integration Test

**Problem:** Schema builds from Drizzle + custom resolvers. No test validates the combined schema is valid and all resolvers resolve.

**Solution:** Integration test that builds the schema, introspects it, and runs a smoke query.

**Changes:**
- New test file `src/worker/routes/graphql.integration.spec.ts`.
- Uses `createMockEnv()` for bindings.

**Effort:** Small.

---

## 4. Lower Priority but Fun

### 4.1 Daily Program

**Problem:** Once a program is solved, replaying is trivial.

**Solution:** Server picks a daily program seeded by date. All players get the same riddle. Completion time leaderboard (session ID hash as pseudonym).

**Changes:**
- Backend: daily seed query or rotation schedule.
- Frontend: "Today's Challenge" entry point.
- Leaderboard: D1 table storing `(date, session_id_hash, completion_time_ms)`.

**Effort:** Medium-high.

---

### 4.2 CRT Scanline CSS Overlay

**Problem:** Terminal theme is flat. Real CRTs had scanlines and glow.

**Solution:** Subtle CSS overlay using `repeating-linear-gradient` for scanlines + `box-shadow` inset for glow. Toggleable.

**Changes:**
- CSS-only. One overlay element in `__root.tsx`.
- Toggle via keyboard shortcut or settings.

**Effort:** Very small.

---

### 4.3 Correct Guess Animation

**Problem:** Correct answer instantly flips to `CompletedGate`. No moment of triumph.

**Solution:** Brief `[ACCESS GRANTED]` green flash + terminal bell sound before transitioning.

**Changes:**
- `useProgramPlay` sets a `showGranted` state for ~1s before gate changes.
- CSS animation on a green flash overlay.
- Web Audio API beep.

**Effort:** Small.

---

### 4.4 Sound Effects (Web Audio API)

**Problem:** Silent terminal. Real terminals beep.

**Solution:** Web Audio API oscillator tones:

| Event | Sound |
|-------|-------|
| Wrong guess | Short low buzz (200Hz, 150ms) |
| Correct guess | Rising two-tone (440Hz → 880Hz) |
| Clue received | Soft click |
| Keypress | Subtle click (optional) |

Opt-in on first interaction (browser autoplay policy).

**Changes:**
- `useSound` hook wrapping `AudioContext`.
- Sounds triggered in `useProgramPlay` and `ActiveGate`.

**Effort:** Small–Medium.

---

### 4.5 Session History

**Problem:** No record of past completions.

**Solution:** Track completed programs with metadata. Show history page listing all programs a session has finished.

**Changes:**
- Backend: already have data — query `session_completed_gates` grouped by program.
- Frontend: new route `/history` or section on `/programs/select`.

**Effort:** Medium.

---

### 4.6 Export Progress as Log

**Problem:** No way to share a completed run.

**Solution:** "Export Log" button on completion screen. Generates a terminal-styled text file:

```text
TERMINAL QUIZ LOG — 2026-07-26
PROGRAM: "Tech History"
STATUS: COMPLETED
ATTEMPTS: 23
CLUES: 4
TIME: 12m 34s

Gate 01 [OK] Who wrote the first compiler?
Gate 02 [OK] What does ENIAC stand for?
...
```

**Changes:**
- Frontend function to build log text from progression data.
- Uses `download` attribute / Blob URL.

**Effort:** Small.

---

### 4.7 AI-Generated Gates

**Problem:** All riddles are hand-written. Limited pool.

**Solution:** Admin or seed-time AI generation of riddles. A workflow that calls an AI model to produce a question + answer + success message given a topic.

**Changes:**
- Backend: script using Workers AI + schema validation.
- Not exposed to end users initially — run via `bun run seed:generate`.

**Effort:** Medium.

---

### 4.8 Hint Variety

**Problem:** Clues are always AI-generated free text. No mechanical hints.

**Solution:** Offer hint types based on gate config:

- **Vowel reveal**: `_e__a__e` for "levenshtein"
- **First letter**: `l________`
- **Word length**: `(11 letters)`
- **Category hint**: "This is a computer science term"

**Changes:**
- Backend: new `hint_type` column on `gates` or per-gate config.
- Frontend: render hints differently based on type.

**Effort:** Medium.

---

## Implementation Priority Matrix

| # | Idea | Effort | User Delight | Risk | Priority |
|---|------|--------|-------------|------|----------|
| 1.5 | Progress bar | Very small | High | None | **1** |
| 1.2 | Loading spinner | Very small | Medium | None | **2** |
| 1.3 | Keyboard shortcuts | Small | Medium | None | **3** |
| 4.3 | Correct guess anim | Small | High | None | **4** |
| 1.4 | End-game stats | Medium | High | Low | **5** |
| 1.1 | Answer history | Small | Medium | None | **6** |
| 2.5 | Typewriter text | Small | Medium | None | **7** |
| 3.3 | Schema test | Small | Dev-only | None | **8** |
| 3.1 | Rate limit clues | Small | None | Low | **9** |
| 3.2 | Session cleanup | Small | None | Low | **10** |

---

*Generated 2026-07-26. Items are suggestions — validate scope and priority with the team before implementation.*
