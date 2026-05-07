# Study Engine v4 — Claude Instructions

## Current state

- v4 engine is complete and tested (120/120 vitest tests passing)
- React 18 + Vite, `js-yaml` for bank parsing, Vitest for tests
- Tailwind CSS v4 fully integrated — all components use Tailwind utility classes with CSS variable-backed theme tokens
- Dark/light theme toggle working via `data-theme` attribute and CSS custom properties
- Mastery Mode session intro interstitials implemented (Sessions 2 & 3 show context screens before beginning)
- Mobile touch targets optimized to meet/approach Apple HIG 44px minimum across all interactive elements
- Dinosaur demo bank in `public/questions.yaml` (30 questions, all 7 types)
- 14 additional compatible question banks in `../question-banks/` (2,241 questions total)
- Deployed to GitHub Pages via `.github/workflows/deploy.yml`

## Commands

```bash
npm run dev          # dev server on localhost:5173
npm test             # vitest (120 tests)
npm run build        # production build -> dist/
```

## Architecture rules

- `src/engine/` is pure logic with zero DOM or React dependencies. Do not import React or browser APIs here.
- Engine functions are pure: state in -> state out. Side effects (localStorage, fetch) happen only in `App.jsx`.
- Each question type has its own renderer in `src/renderers/`. Renderers call `onSubmit(answer)` — they never call `onAnswer` directly.
- `QuestionCard.jsx` dispatches to the correct renderer and handles the submit -> check -> answer flow.
- The validator (`src/engine/validator.js`) is the source of truth for the YAML question bank schema.

## Project layout

```
src/
  engine/          Pure logic + 120 vitest tests (zero dependencies)
    sessionManager.js    Session/round lifecycle, mode switching
    masteryTracker.js    Per-question mastery, confidence weighting, HCW priority
    questionSelector.js  Shuffling, pool splitting, topic-spaced round building
    validator.js         YAML bank schema validation
    storage.js           localStorage wrapper
  components/      React UI
    App.jsx              Root coordinator, bank loading, state persistence
    StartScreen.jsx      Mode selection, resume detection
    SessionScreen.jsx    Active quiz session with nav toolbar
    SessionIntro.jsx     Mastery Mode interstitial shown before Sessions 2 & 3
    QuestionCard.jsx     Question display + renderer dispatch + confidence rating
    RoundSummary.jsx     End-of-round results with score circle
    SessionSummary.jsx   End-of-session stats with per-topic breakdown
    QuestionBank.jsx     Filterable question bank viewer
    ProgressBar.jsx      Mastery + round progress bars
    ConfidenceRating.jsx Confidence selector (study mode)
  renderers/       Per-type answer input components (MC, TF, FITB, Def, Order, Match, Calc)
  config.js        APP_VERSION, ROUND_SIZE
  main.jsx
public/
  questions.yaml   Active question bank (dinosaur demo)
```

## Modes

- **Study Mode** (internal key: `practice`) — Full bank, shuffled, 10-question rounds. One correct answer clears a question. No confidence rating. No sessions. Completes when all mastered.
- **Mastery Mode** (internal key: `study`) — Full bank split into Pool A + Pool B. Session 1: Pool A. Session 2: Pool B. Session 3: combined misses from S1+S2, sorted by priority (high-confidence wrongs first, then by difficulty 3->2->1). Confidence rating required. Skips Session 3 if no misses.

Note: UI labels say "Study" and "Mastery" but the internal `mode` keys are `'practice'` and `'study'` respectively. Do not change the internal keys — they're tied to localStorage persistence.

## Question types

| Type | Key | Renderer | Answer format |
|------|-----|----------|---------------|
| True/False | `tf` | TFRenderer | boolean |
| Multiple Choice | `mc` | MCRenderer | 0-based index into `options[]` |
| Fill in the Blank | `fitb` | FITBRenderer | string (case-insensitive match against `accepted[]`) |
| Definition | `def` | DefRenderer | 0-based index into `options[]` |
| Ordering | `ordering` | OrderRenderer | array of original indices in user order |
| Matching | `match` | MatchRenderer | array where `[termIdx] = descIdx` |
| Calculation | `calc` | CalcRenderer | number (correct if within `tolerance`) |

## YAML schema (v4)

```yaml
config:
  schema_version: 4
  storage_key: "quiz-slug-v1"   # unique per bank
  deck_version: 1
  emoji: "..."
  title: "Quiz Title"
  subject: "Subject Name"
  description: "What this covers."

questions:
  - id: "mc1"                   # unique across bank
    type: "mc"                  # mc | tf | fitb | def | ordering | match | calc
    topic: "Topic Name"
    difficulty: 2               # 1=easy, 2=medium, 3=hard
    question: "Prompt text"
    explanation: "Educational, not just restating the answer."
```

Type-specific fields:

| Type | Extra fields |
|------|-------------|
| `tf` | `answer` (boolean) |
| `mc` / `def` | `options` (exactly 4 strings), `answer` (0-3) |
| `fitb` | `accepted` (string array, >=1) |
| `ordering` | `correctOrder` (string array, >=3) |
| `match` | `pairs` (array of `{term, desc}`, >=3) |
| `calc` | `answer` (number), `tolerance` (number >=0), `unit` (string) |

## Styling

Tailwind CSS v4 with `@tailwindcss/vite` plugin. CSS custom properties define the theme palette in `src/index.css`:

- `:root` (dark) and `[data-theme="light"]` overrides define all color variables
- `@theme` block in `index.css` maps CSS variables to Tailwind color tokens (e.g. `--color-bg: var(--bg)`)
- Components use Tailwind utilities like `bg-bg`, `text-accent`, `border-border` etc.
- Inline styles are only used for truly dynamic values (SVG attributes, computed widths)

**CSS variables:** `--bg`, `--card`, `--border`, `--accent`, `--accent-dim`, `--wrong`, `--neutral`, `--text`, `--muted`, `--gold`, `--gold-bg`, `--gold-border`, `--hcw`, `--btn-text`

Do not rename these variables — they are referenced by the `@theme` block and by inline styles for dynamic values.

---

## Completed work

- **Tailwind CSS v4 migration** — All components converted from inline `style={{}}` to Tailwind utility classes. `@tailwindcss/vite` plugin, `@theme` block mapping CSS vars to Tailwind tokens.
- **Mastery Mode session intros** — `SessionIntro.jsx` shows an interstitial before Sessions 2 and 3 with context about what's coming (fresh questions vs. review round). Phase `'session_intro'` is intercepted in `App.jsx` (engine still returns `'active'` — UI layer overrides). Persisted to localStorage so refresh works.
- **Mobile touch targets** — All interactive elements audited against Apple HIG 44px minimum. Key improvements: OrderRenderer arrows, MC option buttons, match cells, confidence buttons, nav buttons, utility links.

## Next steps

- Further mobile responsive refinement (spacing, narrow-viewport edge cases like MatchRenderer 2-column grid)
- Any additional UI polish or features as requested

## Related projects

- `../question-banks/` — 14 v4-schema YAML banks. Any bank can be dropped into `public/questions.yaml`.
- `../studydash/` — Dashboard project that will incorporate the study engine as one module. Separate project, not the current focus.

## What NOT to do

- Do not refactor the engine unless fixing a bug. It's tested and stable.
- Do not add features beyond what's been requested. Ask first.
- Do not rename CSS variables — they are referenced by the `@theme` block and inline dynamic styles.
- Do not modify `src/engine/` files unless explicitly asked.
