# Study Engine v3

This project is a flexible, customizable quiz engine built with React. It's designed to help users study a given topic through various question formats and a spaced-repetition-based learning algorithm. Uses research-backed learning principles from "Make it Stick" to help enhance long-term memory encoding.

Live Demo: studyengine-dinodemo.netlify.app

## Features

- **Multiple Question Types**: Supports True/False, Multiple Choice, Fill-in-the-Blank, Calculation, Ordering, and Matching questions.
- **Two Study Modes**:
    - **Practice Mode**: A casual mode where users can answer questions. Mastery is achieved by answering each question correctly once.
    - **Study Mode**: A more structured, session-based mode using spaced repetition principles to help with long-term retention.
- **Spaced Repetition**: Incorrectly answered questions are prioritized and will appear more frequently. Questions are "mastered" and retired from the active pool after being answered correctly in a streak.
- **Theming**: Includes both light and dark modes.
- **Developer Tools**: A built-in dev tool allows for quickly mastering questions, advancing sessions, and inspecting the state of the question deck.

## How to Create a New Question Bank

The entire quiz, including its title, description, and all questions, is defined in a single file: `src/questions.yaml`. To create a new quiz, you can either edit this file or replace it with a new one that follows the same format.

### Instructions for AI-Assisted Generation

You can use an AI assistant to generate a new `questions.yaml` file. Provide the AI with the following instructions.

---

**AI Prompt Template:**

"You are an expert curriculum designer and a specialist in creating educational content. Your task is to generate a question bank for a study quiz in the YAML format specified below.

**Topic:** [Your Topic Here, e.g., "American History: The Civil War"]

**Instructions:**
1.  Generate a comprehensive set of questions covering the topic.
2.  Ensure a good mix of question types: `tf` (True/False), `mc` (Multiple Choice), `fitb` (Fill-in-the-Blank), and `def` (Definition).
3.  All question `id` fields must be unique. Use a convention like `tf1`, `tf2`, `mc1`, `mc2`, etc.
4.  Every question must have a `topic`, `type`, `question`, and `explanation` field.
5.  Follow the specific format for each question type precisely.
6.  Write clear, concise, and unambiguous questions and explanations.

**YAML Format Specification:**

```yaml
# Top-level configuration for the quiz.
config:
  STORAGE_KEY: "unique_quiz_key_v1" # Must be unique for each quiz.
  DECK_VERSION: 1
  QUIZ_EMOJI: "🧠"
  QUIZ_TITLE: "Quiz Title"
  QUIZ_SUBJECT: "Quiz Subject"
  DESCRIPTION: |
    A brief, one-paragraph description of what this quiz covers.

# The list of all questions for the quiz.
questions:
  # --- TRUE / FALSE ---
  - id: "tf1"
    topic: "Topic Name"
    type: "tf"
    question: "This is a true or false statement."
    answer: true # or false
    explanation: "A brief explanation of why the answer is correct."

  # --- MULTIPLE CHOICE ---
  - id: "mc1"
    topic: "Topic Name"
    type: "mc"
    question: "This is a multiple choice question."
    options:
      - "Wrong Answer A"
      - "Correct Answer"
      - "Wrong Answer B"
      - "Wrong Answer C"
    answer: 1 # The zero-based index of the correct option.
    explanation: "A brief explanation of why the answer is correct."

  # --- FILL IN THE BLANK ---
  - id: "fitb1"
    topic: "Topic Name"
    type: "fitb"
    question: "The capital of France is ___."
    accepted: ["Paris"] # A list of all acceptable string answers. Case-insensitive.
    explanation: "Paris has been the capital of France for centuries."
```

---
Now, please generate a question bank for the topic: **[Your Topic Here]**"