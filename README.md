# 🧠 StudyEngine

A lightweight React study engine built for personal exam prep and knowledge review. Supports multiple question types, spaced repetition, and mastery tracking. Swap in your own question bank to build a new quiz — no changes to the engine required.

**[Live Demo →](https://pio687.github.io/StudyEngine/)**

---

## Features

- **6 question types** — True/False, Multiple Choice, Calculation, Definition Match, Ordering, and Matching
- **Spaced repetition** — missed questions return sooner; 2 consecutive correct answers retires a question
- **Mastery tracking** — dual progress bars track questions answered and fully mastered
- **Dynamic round building** — 10 questions per round, balanced by type and topic, auto-derived from your question bank
- **Dark / light mode** toggle
- **Question bank viewer** — browse all questions, answers, and explanations in one screen
- **Dev tool** — bulk-master random questions for fast testing

---

## Using This Template

1. Clone or fork the repo
2. Run `npm install`
3. Replace `src/questions.js` with your own question bank
4. Update `STORAGE_KEY`, `QUIZ_TITLE`, `QUIZ_SUBJECT`, and `PATCH_NOTES` in `questions.js`
5. Run `npm run dev` to test locally
6. Run `npm run build` and deploy

The engine (`src/App.jsx`) does not need to be modified between quizzes.

---

## Question Types

| Type | Description |
|------|-------------|
| `tf` | True / False |
| `mc` | Multiple choice — tag `topic:"Integrative"` for scenario questions |
| `calc` | Numeric input with tolerance |
| `def` | Definition matching (MC-style) |
| `ordering` | Arrange items in correct sequence |
| `match` | Match terms to descriptions |

See `questions.js` for full format reference and examples for each type.


---

*Designed by [pio687](https://github.com/pio687) · Built with [Claude](https://claude.ai) Sonnet 4.6*
