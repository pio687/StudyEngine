# Study Engine v3

A research-backed quiz engine designed to turn question banks into effective study tools. Built on principles from *Make it Stick* and cognitive science research, this engine uses spaced repetition, confidence assessment, and strategic scheduling to maximize long-term retention and identify weak spots.

**[→ Try the Live Demo](https://pio687.github.io/StudyEngine/)**

---

## Philosophy

**Learning is not about exposure—it's about retrieval practice and spaced intervals.**

This engine is built on three core principles:

1. **Retrieval Practice** — Students learn by attempting to retrieve information from memory, not by passive review. Every question is a retrieval attempt, and mistakes are valuable signals.

2. **Spaced Repetition** — Information is retained longer when practice is distributed over time with strategic intervals. Questions are revisited at increasing intervals as mastery grows.

3. **Sleep Consolidation** — Study is organized into 3 sessions designed around sleep cycles. Session 3 focuses specifically on "weak spots" — topics the student struggled with in sessions 1 and 2 — revisited after sleep for optimal memory consolidation.

The app tracks student confidence and flags "high-confidence wrong" answers as priority review items. This identifies the most dangerous knowledge gaps: things students *think* they know but don't.

---

## Features

- **7 Question Types**: True/False, Multiple Choice, Definition (MC variant), Fill-in-the-Blank, Calculation, Ordering, and Matching.
  
- **Two Study Modes**:
  - **Practice Mode**: Casual, infinite. Answer each question correctly once and it's done. Perfect for quick review.
  - **Study Mode**: Structured, 3-session design. 2 consecutive correct answers to master a question. Session 3 targets weak spots only.

- **Spaced Repetition Engine**: 
  - Questions are shuffled each round (no ordering effects)
  - Wrong answers are prioritized for reappearance
  - Mastered questions are retired from the pool
  - Weak spots (questions answered wrong or marked "Know it" but got wrong) are collected for Session 3

- **Confidence Tracking** (Study Mode only):
  - Mark each answer as "Unsure" or "Know it"
  - Flags high-confidence wrong answers (HCW) for priority review
  - Essential for identifying knowledge gaps

- **Detailed Results**:
  - Per-question feedback with explanations
  - Performance summaries with topic-level breakdowns (Session 3 only)
  - Weak spot review before sleep (strategic timing for consolidation)

- **Light/Dark Mode**: Theme toggle for preference.
  
- **Developer Tools**: Hidden dev panel for testing (master N questions, advance sessions, inspect deck state).

---

## How the Study Workflow Works

When a student enters **Study Mode**, here's what happens:

1. **Session 1 & 2**: Questions are split into two pools (~50/50 by question type for balanced coverage). The student answers rounds of up to 10 questions per round until all questions in the session pool are mastered (2 consecutive correct answers each).

2. **Sleep Break**: After Session 1 and 2 complete, the student is encouraged to sleep. The weak spot review shown at session end is designed to be reviewed before sleep for optimal consolidation.

3. **Session 3**: Built from weak spots identified in Sessions 1 & 2:
   - Questions that were answered wrong at any point
   - Questions marked "Know it" but got wrong (high-confidence wrong, HCW)
   
   These are sorted by severity (wrong count, recency) and presented first. Session 3 is about fixing gaps, not grinding through all questions again.

4. **Victory**: When all questions are mastered (or when Session 3 has no weak spots), the student wins.

**Practice Mode** skips sessions and mastery thresholds. It's infinite revision: answer each question correctly once and move on.

---

## Building New Question Banks

The entire quiz—title, description, and all questions—is defined in a single `src/questions.yaml` file. To create a new quiz, edit or replace this file with your own question bank following the format below.

### Question Design Principles

Good questions for this engine have these properties:

- **Retrievable**: Can be answered from memory alone (no open-ended reasoning required).
- **Specific**: Test a single concept, not broad knowledge. "What was the Treaty of Versailles?" is better than "Describe WWI."
- **Unambiguous**: Only one correct answer; no trick questions or subjective interpretations.
- **Explanatory**: Explanations should teach, not just confirm. Good explanations include *why* the answer is correct and clarify common misconceptions.
- **Balanced Coverage**: Mix easy and harder questions. Avoid question types that are too easy or too hard for your learner base.
- **Strategic Distribution**: Questions should reflect topic importance. Critical concepts should appear as multiple question types.

### YAML Format & Configuration

Every question bank requires a `config:` section and a `questions:` list. The config defines the quiz metadata; questions define the content.

**Config Keys:**
```yaml
config:
  STORAGE_KEY: "unique_key_v1"        # Unique identifier per quiz (used for localStorage)
  DECK_VERSION: 1                      # Bump when questions change significantly
  QUIZ_EMOJI: "🧠"                    # Favicon emoji
  QUIZ_TITLE: "Your Quiz Title"        # Shown in browser tab and header
  QUIZ_SUBJECT: "Subtitle/Subject"     # Shown below title
  DESCRIPTION: |                       # Brief description (shown in question bank)
    One paragraph describing the scope and purpose of this quiz.
  WIN_EMOJI: "🎓"                     # Emoji shown on victory screen
  WIN_PERFECT_TITLE: "Perfect Score!"  # Title for zero-miss victory
  WIN_PERFECT_SUBTITLE: "All correct on the first try." # Subtitle
  WIN_TITLE: "You Did It!"             # Title for normal victory
  WIN_SUBTITLE: "Keep reviewing to strengthen retention." # Subtitle
  SESSION_1_END: |                     # Message after Session 1 (recommend sleep)
    Sleep is crucial for memory consolidation. Rest well before Session 2.
  SESSION_2_END_WEAK: |                # Message after Session 2 if weak spots exist (use {n} for count)
    You have {n} weak spots to review before sleep. Study these carefully.
  SESSION_2_END_PERFECT: |             # Message if no weak spots after Session 2
    Perfect! No weak spots detected. You're ready for Session 3.
  SESSION_3_END: |                     # Message after Session 3 (final session)
    All weak spots mastered. You've completed comprehensive study.
```

**Question Fields (all required):**
- `id`: Unique identifier (e.g., `tf1`, `mc2`). Use pattern: `{type}{number}`
- `topic`: Topic/chapter this belongs to (e.g., "WWI Causes", "Photosynthesis")
- `type`: Question type (`tf`, `mc`, `def`, `fitb`, `calc`, `ordering`, `match`)
- `question`: The question text (plain text or markdown)
- `explanation`: Explanation of the correct answer (plain text or markdown)
- Type-specific fields (see examples below)

### Question Type Reference

#### True/False
```yaml
- id: "tf1"
  topic: "Topic Name"
  type: "tf"
  question: "A statement that is either true or false."
  answer: true  # or false
  explanation: "Why this statement is true (or false). Address common misconceptions."
```

#### Multiple Choice
```yaml
- id: "mc1"
  topic: "Topic Name"
  type: "mc"
  question: "Which of the following is correct?"
  options:
    - "Incorrect option A"
    - "Correct answer"
    - "Incorrect option B"
    - "Incorrect option C"
  answer: 1  # Zero-based index of correct option (0, 1, 2, etc.)
  explanation: "Why the answer is correct. Why other options are wrong."
```
**Note:** Options are shuffled each round. "All of the above" and "None of the above" are automatically kept last if present.

#### Definition (Multiple Choice variant)
```yaml
- id: "def1"
  topic: "Topic Name"
  type: "def"
  question: "The process of consolidating information into long-term memory."
  answer: "Memory Consolidation"  # Must exactly match one option
  options:
    - "Memory Consolidation"
    - "Cognitive Dissonance"
    - "Semantic Priming"
    - "Interference Theory"
  explanation: "Memory consolidation is the process by which short-term memories become long-term memories, typically through sleep and repetition."
```
**Note:** Renders identically to MC but semantically better for definition-style questions.

#### Fill in the Blank
```yaml
- id: "fitb1"
  topic: "Topic Name"
  type: "fitb"
  question: "The capital of France is ___."
  accepted: ["Paris", "paris", "PARIS"]  # Case-insensitive; all acceptable variations
  explanation: "Paris has been France's capital since the 12th century."
```
**Note:** Whitespace is normalized. "Paris" and " Paris " are treated identically.

#### Calculation
```yaml
- id: "calc1"
  topic: "Topic Name"
  type: "calc"
  question: "What is 15% of 200?"
  answer: 30
  tolerance: 0  # Optional: margin of error for float comparison (e.g., tolerance: 0.1)
  explanation: "200 × 0.15 = 30. Always convert percentages to decimals before multiplying."
```
**Note:** Accepts numeric or string answers. Use `tolerance` for float approximation.

#### Ordering
```yaml
- id: "order1"
  topic: "Topic Name"
  type: "ordering"
  question: "Arrange these historical events from earliest to latest."
  correctOrder:
    - "Event A (1492)"     # Earliest
    - "Event B (1776)"
    - "Event C (1865)"
    - "Event D (1945)"     # Latest
  explanation: "Brief explanation of the sequence and why this order matters."
```
**Note:** Items are shuffled each round. All items must be included.

#### Matching
```yaml
- id: "match1"
  topic: "Topic Name"
  type: "match"
  question: "Match each term to its correct definition."
  pairs:
    - term: "Photosynthesis"
      desc: "Process by which plants convert light into chemical energy"
    - term: "Respiration"
      desc: "Process by which organisms break down glucose for energy"
    - term: "Transpiration"
      desc: "Process by which water vapor escapes from plants"
  explanation: "All three are biological processes. Photosynthesis is the inverse of respiration. Transpiration is specific to plants."
```
**Note:** Pairs are shuffled each round. Terms are matched to descriptions visually.

---

## Using AI to Generate Question Banks

You can use an AI assistant to generate a complete `questions.yaml` file. Copy this prompt and fill in your topic:

---

```
You are an expert educational content designer. Generate a YAML question bank for 
study and practice on the following topic:

**Topic:** [INSERT YOUR TOPIC HERE]

**Requirements:**
1. Generate 20-40 high-quality questions covering the topic comprehensively.
2. Distribute question types: 4-6 True/False, 5-8 Multiple Choice, 2-4 Definition, 
   2-4 Fill-in-the-Blank, 1-2 Calculation, 1-2 Ordering, 1-2 Matching.
3. Questions should test retrieval, not reasoning. Avoid open-ended prompts.
4. Use question IDs like: tf1, tf2, mc1, mc2, fitb1, def1, order1, match1, calc1
5. All field names and types must be lowercase (tf, mc, def, fitb, calc, ordering, match).
6. Explanations should teach—explain why the correct answer is right and why 
   common distractors are wrong.
7. Vary difficulty: start easier, progress to harder, but keep all questions 
   in the "retrievable" tier (not open-ended).
8. Topic field should be concise (e.g., "Photosynthesis", "WWI Causes") for organization.

**Output Format:**
Generate valid YAML following this structure. Use proper YAML indentation (2 spaces).
Ensure the answer field exactly matches the correct option for MC and Definition questions.

config:
  STORAGE_KEY: "topic_key_v1"
  DECK_VERSION: 1
  QUIZ_EMOJI: "📚"
  QUIZ_TITLE: "[Topic] Study Guide"
  QUIZ_SUBJECT: "[Topic]"
  DESCRIPTION: "Comprehensive study guide for [Topic]."
  WIN_EMOJI: "🎓"
  WIN_PERFECT_TITLE: "Perfect Score!"
  WIN_PERFECT_SUBTITLE: "Mastered all concepts."
  WIN_TITLE: "Complete!"
  WIN_SUBTITLE: "Keep reviewing for retention."
  SESSION_1_END: "Excellent work in Session 1. Sleep well before Session 2."
  SESSION_2_END_WEAK: "You have {n} weak spots. Review these carefully before sleep."
  SESSION_2_END_PERFECT: "No weak spots! Ready for final session."
  SESSION_3_END: "All weak spots mastered. Study complete!"

questions:
  # True/False examples
  - id: "tf1"
    topic: "Core Concept"
    type: "tf"
    question: "A clear, unambiguous statement."
    answer: true
    explanation: "Explanation of why this is true."

  # Multiple Choice examples
  - id: "mc1"
    topic: "Core Concept"
    type: "mc"
    question: "Which of the following is correct?"
    options:
      - "Incorrect option"
      - "Correct answer"
      - "Incorrect option"
      - "Incorrect option"
    answer: 1
    explanation: "Why this answer is correct and why others are wrong."

  # Definition examples
  - id: "def1"
    topic: "Definitions"
    type: "def"
    question: "The term for [definition]"
    answer: "Correct Term"
    options:
      - "Correct Term"
      - "Similar but wrong term"
      - "Another wrong term"
      - "Distractor term"
    explanation: "Definition and context for why this term is correct."

  # Fill-in-the-Blank examples
  - id: "fitb1"
    topic: "Definitions"
    type: "fitb"
    question: "The capital of France is ___."
    accepted: ["Paris", "paris"]
    explanation: "Paris is France's capital and cultural center."

  # Calculation example
  - id: "calc1"
    topic: "Math/Numbers"
    type: "calc"
    question: "Calculate: 15% of 200"
    answer: 30
    tolerance: 0
    explanation: "Convert 15% to 0.15 and multiply: 200 × 0.15 = 30"

  # Ordering example
  - id: "order1"
    topic: "Historical Sequence"
    type: "ordering"
    question: "Arrange these events from earliest to latest."
    correctOrder:
      - "Event 1 (1492)"
      - "Event 2 (1776)"
      - "Event 3 (1865)"
      - "Event 4 (1945)"
    explanation: "These events occurred in chronological order because..."

  # Matching example
  - id: "match1"
    topic: "Concepts"
    type: "match"
    question: "Match each term to its definition."
    pairs:
      - term: "Term A"
        desc: "Definition of Term A"
      - term: "Term B"
        desc: "Definition of Term B"
      - term: "Term C"
        desc: "Definition of Term C"
    explanation: "These terms are related concepts in the field of..."

[Generate 20-40 questions following this structure, covering the topic comprehensively]
```

---

**Tips for better questions:**
- **Specificity**: Test one concept per question. Avoid compound questions.
- **Clarity**: Avoid ambiguous wording. One clear correct answer.
- **Explanations**: Teach in your explanation. Address misconceptions.
- **Distribution**: Ensure each topic is covered by multiple question types.
- **Balance**: Mix easier questions (foundational) with harder ones (synthesis).
