# Study Engine v4

A YAML-powered quiz engine with spaced repetition mastery tracking. Load any question bank, pick a study mode, and let the engine prioritize what you keep missing.

**Try it:** [pio687.github.io/StudyEngine](https://pio687.github.io/StudyEngine/)

## Modes

**Mastery Mode** — Three-session spaced repetition with confidence tracking. The bank splits into two halves (Sessions 1 & 2), then Session 3 reviews everything you missed, prioritizing high-confidence wrong answers first. Best for exam prep.

**Study Mode** — Quick rounds of 10 questions. One correct answer clears the question from the pool. Repeat until all questions are mastered.

## Question types

- Multiple Choice
- True / False
- Fill in the Blank
- Definition
- Ordering
- Matching
- Calculation (with tolerance)

## Question banks

The app loads questions from a YAML file. Drop any v4-schema bank into `public/questions.yaml` to use it. The included demo bank covers dinosaur paleontology (30 questions across all 7 types).

Example question:

```yaml
questions:
  - id: "mc1"
    type: "mc"
    topic: "Anatomy"
    difficulty: 2
    question: "Which dinosaur had the largest skull of any land animal?"
    options:
      - "Triceratops"
      - "Torosaurus"
      - "Pentaceratops"
      - "Styracosaurus"
    answer: 1
    explanation: "Torosaurus had a skull measuring up to 2.77 meters long, making it the largest skull of any known land animal."
```

See `src/engine/validator.js` for the full schema spec.

## Features

- Dark and light themes
- Progress saved automatically — resume where you left off after refresh
- No backend required — runs entirely in the browser
- Mobile-optimized touch targets
- Delayed feedback (results shown at end of each round, not per-question)
- High-confidence wrong (HCW) prioritization in review sessions