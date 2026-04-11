# CLAUDE.md — Study Engine v3

Everything a future Claude needs to understand, modify, and debug this codebase.

---

## What This Is

A React/Vite single-page quiz app for studying a specific topic. The question bank lives in `src/questions.yaml`. Swapping that file is the intended way to create a new quiz — the engine code should not need changing.

The engine is research-backed (Make it Stick) and implements spaced repetition, two study modes, and a 3-session structure designed around sleep consolidation.

---

## File Structure

```
src/
  questions.yaml          — All question data + quiz config (the only file users edit)
  engineLogic.js          — Pure logic: data structures, save/load, round building, scoring
  App.jsx                 — Root component: router only (~120 lines, heavily refactored)
  App.css                 — CSS custom properties (theme variables)
  main.jsx                — React entry point
  utils/
    answerDisplay.js      — Pure functions: getAnswerDisplay, getWrongAnswerDisplay
  components/
    Shared.module.css     — Base styles: .app, .wrap, .logo, .logoTop, .logoTitle
    ConfirmModal.jsx      — Modal for destructive actions (reset progress)
    ConfirmModal.module.css
    DevTool.jsx           — Dev utilities (master questions, advance session, fill confidence)
    MasteryBars.jsx       — Progress visualization across question types
    MenuScreen.jsx        — Mode selection and resume prompt
    QuizScreen.jsx        — Main quiz UI, question dispatch
    QuizScreen.module.css
    ResultsScreen.jsx     — Results after round submission
    ResultsScreen.module.css
    SessionEndScreen.jsx  — Session complete, weak spot review, topic summary
    SessionEndScreen.module.css
    WinScreen.jsx         — Final completion screen
    WinScreen.module.css
    BankScreen.jsx        — Question bank browser
    BankScreen.module.css
    hooks/
      useQuizEngine.js    — All quiz state: single source of truth, mode-specific reset
    questions/
      StandardQuestion.jsx   — T/F, MC, def
      StandardQuestion.module.css
      InputQuestion.jsx      — calc, fitb
      InputQuestion.module.css
      OrderingQuestion.jsx
      OrderingQuestion.module.css
      MatchingQuestion.jsx
```

**Key separation:** `engineLogic.js` is pure functions with no React. `useQuizEngine.js` owns all React state and wires logic to UI. All styling is CSS modules per component + `var(--xxx)` for theme variables. Components are presentational.

---

## Question Types

Defined in `questions.yaml` under `questions:`. Every question needs `id`, `topic`, `type`, `question`, `explanation`.

| type | answer format | notes |
|------|--------------|-------|
| `tf` | `true`/`false` | |
| `mc` | zero-based index into `options` | options shuffled each round |
| `def` | exact string matching one of `options` | MC variant, shuffled |
| `calc` | number or string | supports `tolerance` field for float comparison |
| `fitb` | `accepted: [...]` list | case-insensitive, whitespace-normalized |
| `ordering` | `correctOrder: [...]` list | presented shuffled, user builds order |
| `match` | `pairs: [{term, desc}]` list | pairs shuffled each round |

`def` and `mc` share the same rendering and shuffle logic (`shuffleMCOptions`). "All of the above" options are detected and kept last during shuffle.

---

## The Deck Data Structure

The in-memory deck (held in `useQuizEngine` state) looks like:

```js
{
  // Active question pools — questions that haven't been mastered yet
  tf:      [{ id, streak }, ...],
  mc:      [...],
  calc:    [...],
  def:     [...],
  special: [...],  // ordering + match combined
  fitb:    [...],

  masteredIds:    [],   // study mode: retired after 2 consecutive correct
  correctOnceIds: [],   // both modes: answered correctly at least once
  missedCounts:   {},   // { questionId: n } — total times answered wrong ever
  hcwIds:         [],   // "high confidence wrong" — marked "Know it" but got wrong
  roundIndex:     0,    // increments each submitted round
  sessionIndex:   0,    // 0=session1, 1=session2, 2=session3
  sessionPools:   { "1": [...ids], "2": [...ids], "3": [...ids] },
  sessionTopicResults: { "0": { "Topic Name": { correct, total } } },
  mode: "study",
}
```

**`streak`** — consecutive correct answers in study mode. Reaches 2 → question mastered. Resets to 0 on wrong answer. In practice mode, any correct answer = done (threshold of 1, effectively).

---

## Two Modes

### Study Mode
- 3-session structure. Session pools are built once at the start: questions split ~50/50 between sessions 1 and 2 by type (so each session has a proportional mix).
- Session 3 is built at the end of session 2 from weak spots: questions with any `missedCounts > 0` or in `hcwIds`, sorted by severity.
- Mastery: 2 consecutive correct answers → question added to `masteredIds` and removed from its pool.
- Session complete when all `sessionPools[sessionIndex+1]` IDs are in `masteredIds`.
- `resumeRef` — a one-shot flag set true on initial load if saved session exists. **Consumed** (set to false) the first time the user selects study mode. `selectMode` now checks `hasProgress` as a fallback so returning to menu mid-session doesn't lose the deck.

### Practice Mode
- No sessions, no mastery threshold, no streaks.
- Any correct answer → question added to `correctOnceIds` and removed from pool.
- Complete when `correctOnceIds.length >= ALL_Q.length`.
- Practice mode does NOT use `masteredIds`. This matters for the self-healing invariant check — see Bugs section.

---

## Round Building (`buildRound`)

Always produces at most 10 questions from the active session pool:

1. Pick up to 4 T/F: 2 true-answer + 2 false-answer (balanced)
2. Pick up to 3 MC: rotating through topics for coverage (one per topic per pass)
3. Fill remaining slots from calc, fitb, def, special, integrative MC — randomly

All pools are shuffled before selection. The `pos` ordering in the pool arrays does not affect which questions are picked.

**Integrative** — MC questions with `topic: "Integrative"` are treated as a separate pool and fill into the "remaining" bucket rather than the rotating MC slots.

---

## Save / Load System

### localStorage keys
- `${STORAGE_KEY}_study` — study mode deck state
- `${STORAGE_KEY}_practice` — practice mode deck state  
- `${STORAGE_KEY}_inflight` — in-progress round (cleared on submit)
- `quiz_mode` — last selected mode ("study" or "practice")
- `quiz_lightmode` — theme preference

`STORAGE_KEY` comes from `config.STORAGE_KEY` in `questions.yaml`. Each quiz should have a unique key.

### Minimal save format (new)
`saveProgress` does NOT save the full pool arrays (`tf`, `mc`, etc.) — these are reconstructable from `ALL_Q`. It saves only:
```js
{ version, mode, masteredIds, correctOnceIds, missedCounts, hcwIds,
  streaks: { id: n },  // sparse — only non-zero values
  roundIndex, sessionIndex, sessionPools, sessionTopicResults }
```
~3-5KB vs the old ~15-20KB. Pool arrays are rebuilt by `reconstructDeck` on load.

### In-flight save format
Saved on every answer/navigation during a round:
```js
{ mode, questions: [...full question objects with shuffled options], answers, current, confidence }
```
Validated on load: question IDs checked against `ALL_Q`. Stale in-flight (questions removed from bank) silently discarded.

### Load flow
1. `loadProgress()` → `initDeck()` → rebuilds full in-memory deck
2. `loadInFlight()` → if valid, jump straight to QUIZ with saved round state
3. Otherwise → MENU

### Backward compat
Old format saves (with pool arrays) still load. `initDeck` detects old format by presence of `saved.tf` and uses the merge path. New format detected by absence of `saved.tf`.

---

## Known Bugs Fixed (April 2026)

### Root cause of session reset (the main bug)
**Symptom:** User mid-session on mobile got kicked back to mode select with progress reset.

**Cause:** Footer of `QuizScreen` has small linked text: "reset progress | question bank | ← menu". On mobile, accidental tap on "← menu" sets `mode = null` and navigates to MENU. User then taps "Study Mode" which calls `selectMode("study")`. The `resumeRef` flag was already consumed on first mode selection (it's a one-shot), so `selectMode` created a FRESH deck with `initDeck(null)` and overwrote localStorage. All progress lost.

**Fix:** `selectMode` now checks `hasProgress` (any mastered/answered questions or completed rounds) before creating a fresh deck. Also checks for an in-flight round and resumes it if found. "reset progress" now requires `window.confirm`.

### Practice mode self-healing reset
**Symptom:** Practice mode progress wiped on page reload.

**Cause:** Self-healing check in `initDeck` validated `totalActive + totalMastered === ALL_Q.length`. Practice mode removes questions from pools into `correctOnceIds`, not `masteredIds`. Invariant broke on first correct answer. On any reload, `initDeck` detected mismatch and reset.

**Fix:** Check now uses `Math.max(totalMastered, totalCorrectOnce)` to handle both modes.

### `resetAll` wrong localStorage key and both modes reset
**Symptom:** Clicking "reset progress" deleted both study and practice mode progress, not just current mode.

**Cause:** Called `localStorage.removeItem(STORAGE_KEY)` (bare key e.g. `"aom1461c-test3-v1"`) but saves go to `${STORAGE_KEY}_study` and `${STORAGE_KEY}_practice`. Also called `localStorage.removeItem` on both keys regardless of active mode.

**Fix:** Now removes only `${STORAGE_KEY}_${mode}` so resetting in study mode only deletes study progress (practice mode progress unaffected). Also replaced `window.confirm()` with `ConfirmModal` component for app-styled confirmation dialog. Added `confirmReset` state to manage modal visibility.

---

## Theming & Styling

**CSS Custom Properties** — All colors, spacing, and theme values are defined in `App.css` as CSS variables:
- `--bg`, `--card`, `--border` — structural colors
- `--text`, `--muted` — text colors
- `--accent`, `--wrong`, `--yellow`, `--neutral` — semantic colors
- `--btn-bg`, `--btn-text` — button colors (theme-aware)

**Theme Toggle** — Set via `[data-theme="light"]` or `[data-theme="dark"]` on `document.body`. Light mode disables the attribute (default is dark). Both themes defined as CSS variable overrides in `App.css`.

**CSS Modules** — Each component has a `.module.css` file with component-scoped classes:
- Static styles (borders, padding, transitions) as class names
- Dynamic values (width, color, opacity) as inline styles using `var(--xxx)` references
- No style props passed between components; 100% CSS modules

Example:
```jsx
// Before: inline style object
<button style={s.btn(isPrimary, isDisabled)} />

// After: CSS modules + var()
<button className={`${styles.btn} ${isPrimary ? styles.btnPrimary : ''}`} />
```

---

## DevTool

Hidden behind a small "dev" link at the bottom of screens. Click to expand. Lets you:
- **Master random N questions** — removes them from pools, updates mastered/correctOnce state, rebuilds round
- **Advance session** (study mode only) — skips to SESSION_END
- **Fill confidence** — marks all current-round questions as "Know it"

Displays live counts: active/mastered/total per type, current session pool stats.

---

## Config Keys (questions.yaml)

All in the `config:` block:

| key | purpose |
|-----|---------|
| `STORAGE_KEY` | localStorage namespace — must be unique per quiz |
| `DECK_VERSION` | bump to invalidate old saves when questions change significantly |
| `QUIZ_TITLE` | page title + header |
| `QUIZ_SUBJECT` | subtitle |
| `QUIZ_EMOJI` | favicon |
| `DESCRIPTION` | shown on BankScreen |
| `WIN_EMOJI` | shown on win screen |
| `WIN_PERFECT_TITLE` / `WIN_PERFECT_SUBTITLE` | zero-miss win message |
| `WIN_TITLE` / `WIN_SUBTITLE` | normal win message |
| `SESSION_1_END` | message shown after session 1 completes |
| `SESSION_2_END_WEAK` | message when session 3 has weak spots (use `{n}` for count) |
| `SESSION_2_END_PERFECT` | message when session 3 would be empty |
| `SESSION_3_END` | message after final session |

---

## Things to Be Careful About

- **`App.jsx` is now a pure router** — stripped down to ~120 lines. Keep it that way. All logic belongs in `useQuizEngine.js`, all styling in CSS modules.
- **`questions.yaml` change = version bump** — if questions are removed or IDs change, bump `DECK_VERSION`. Old saves with mismatched IDs are silently rebuilt. Without a version bump, stale `masteredIds` for deleted questions accumulate harmlessly but waste bytes.
- **`sessionPools["3"]`** is built lazily at session 2 end (`advanceSession`), not at initialization. Don't assume it exists before then.
- **Practice mode has no sessions** — `sessionPools` exists on the deck (initialized in `initDeck`) but is unused in practice mode. `buildRound` checks `mode === "study"` before applying pool filtering.
- **In-flight questions are full objects** (with shuffled options baked in) — don't reconstruct them from `getQById` on resume or you'll lose the shuffle state and the user will see different options than they were answering.
- **Mode-specific reset** — `resetAll` now only deletes `${STORAGE_KEY}_${mode}`, so study and practice modes have independent progress. Confirmation is shown via `ConfirmModal` (app-styled, not browser native).
- **CSS modules are component-scoped** — class names in one component don't affect others. Use `shared` import for base styles from `Shared.module.css`. All theme colors use `var(--xxx)` references, never hardcoded hex values.

---

## Refactor Completion Status (April 2026)

**The major refactor is complete.** The codebase has been cleaned up and restructured for maintainability.

### Completed Work

✅ **Phase 1: App.jsx decomposition**
- Extracted `DevTool` → `src/components/DevTool.jsx`
- Extracted `getAnswerDisplay`, `getWrongAnswerDisplay` → `src/utils/answerDisplay.js`
- Extracted `renderMasteryBars` → `src/components/MasteryBars.jsx`
- Reduced `App.jsx` from 400 lines to ~120 lines (pure router)

✅ **Phase 2.A: CSS Module migration**
- All components now use CSS modules instead of inline style objects
- Created `Shared.module.css` for base styles used across components
- Created `.module.css` files for all screens and question types
- Replaced all `s`, `T`, `C`, `CV`, `lm` style props with CSS modules + `var(--xxx)`
- Achieved 100% removal of style prop drilling between components

✅ **Phase 2.B: Bug fixes**
- Removed vestigial `pos` field from deck structure (no longer calculated or saved)
- Fixed practice mode save key bug: `selectMode` now sets `deckForRound.mode = m` before saving
- Fixed practice mode self-healing reset: using `Math.max(totalMastered, totalCorrectOnce)` in invariant check
- Fixed `resetAll` to only delete current mode's progress (study vs practice independent)
- Replaced `window.confirm()` with `ConfirmModal` component for app-styled confirmation

### Code Quality Standards

**Don't rewrite the engine.** The core logic in `engineLogic.js` and `useQuizEngine.js` is solid and the algorithm (session pools, balanced round building, mastery thresholds) took real thought to get right. A rewrite risks subtle regressions.

**Keep following these principles:**
- All styling via CSS modules + CSS custom properties (no inline style objects)
- All state in `useQuizEngine.js` (single source of truth)
- `engineLogic.js` pure functions, no React dependencies
- Components are presentational; business logic belongs in the engine

### What to leave alone

- `engineLogic.js` core algorithm (session pools, round building, mastery logic)
- `useQuizEngine.js` hook structure
- All question type components (`StandardQuestion`, `InputQuestion`, etc.) — rendering only
- The YAML schema and content model
- Session pool / mastery / round building algorithm — proven to work; don't optimize prematurely

---

## Adding New Features

When adding features, follow this workflow:

### New Screen
1. Create `src/components/NewScreen.jsx` — import `shared` and create `NewScreen.module.css`
2. Add route to `App.jsx` (one conditional, follow existing pattern)
3. Pass required engine state/functions from `App.jsx` spread
4. All colors use `var(--xxx)`, no hardcoded values
5. Test in both light and dark modes

### New Question Type
1. Create `src/components/questions/NewType.jsx` — import `shared` and create `.module.css`
2. Add to `QuizScreen.jsx` question dispatch (around line 73-90)
3. Add type to `questions.yaml` schema documentation
4. Test round building with 1+ questions of this type
5. Verify mastery tracking: check that `checkCorrect` evaluates answers properly

### New State or Mode Feature
1. Add to `useQuizEngine.js` state (const [feature, setFeature])
2. Add to engine return object
3. Implement in `engineLogic.js` if it involves save/load or scoring
4. Spread to component via `App.jsx` (add to engine spread or explicit prop)
5. Write to memory system if behavior is non-obvious

### Styling Convention
**Colors:** Always use `var(--xxx)`. Available variables:
```css
--bg                    /* main background */
--card                  /* card/container background */
--text                  /* primary text */
--muted                 /* secondary text, disabled state */
--border                /* borders, dividers */
--accent                /* highlights, success */
--wrong                  /* errors, incorrect */
--yellow                /* warnings, explanations */
--neutral               /* neutral accent */
--btn-bg, --btn-text    /* button theme-aware colors */
```

**Responsive:** Mobile breakpoint is 480px. Use media queries in `.module.css`:
```css
@media (max-width: 480px) {
  /* mobile overrides here */
}
```

**State variants:** Use className combinations, not inline ternaries:
```jsx
// Good
<button className={`${styles.btn} ${isPrimary ? styles.btnPrimary : ''}`} />

// Bad
<button style={{ background: isPrimary ? var(--accent) : 'transparent' }} />
```
