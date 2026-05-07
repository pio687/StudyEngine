# Study Engine v4

A YAML-powered quiz engine with spaced repetition mastery tracking. Load any question bank, practice or study, and let the engine prioritize what you keep missing.

**Live demo:** https://pio687.github.io/StudyEngine/

## Modes

- **Mastery Mode** — Three-session spaced repetition with confidence tracking. Best for exam prep.
- **Study Mode** — Quick rounds of 10. One correct answer clears a question. Repeat until satisfied.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 120 vitest tests
npm run build      # production build
```

## Question bank format

Replace `public/questions.yaml` with any v4-schema bank. See `src/engine/validator.js` for the full schema spec.

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml`.
