export function createTracker() {
  return {
    results: {},
    mastered: [],
    missed: [],
  }
}

export function recordAnswer(tracker, questionId, isCorrect, confidence = null) {
  const prev = tracker.results[questionId] || { correct: false, confidence: null, attempts: 0 }

  const results = {
    ...tracker.results,
    [questionId]: {
      correct: isCorrect,
      // Preserve confidence from the wrong answer — don't overwrite with null
      // on a correct retry. This is needed for session 3 priority sorting.
      confidence: isCorrect ? prev.confidence : confidence,
      attempts: prev.attempts + 1,
    },
  }

  let mastered = tracker.mastered.slice()
  let missed = tracker.missed.slice()

  if (isCorrect) {
    if (!mastered.includes(questionId)) mastered.push(questionId)
    // missed is append-only — tracks "ever wrong" for session 3 pool building.
    // A question can be in both mastered and missed (wrong then corrected).
  } else {
    if (!missed.includes(questionId)) missed.push(questionId)
    mastered = mastered.filter(id => id !== questionId)
  }

  return { ...tracker, results, mastered, missed }
}

export function getMissedQuestions(tracker) {
  return tracker.missed.slice()
}

export function getPriorityMisses(tracker, questions) {
  const missedIds = new Set(tracker.missed)
  const missed = questions.filter(q => missedIds.has(q.id))

  return missed.sort((a, b) => {
    const aConf = tracker.results[a.id]?.confidence
    const bConf = tracker.results[b.id]?.confidence
    // know_it wrongs first (most dangerous gaps)
    if (aConf === 'know_it' && bConf !== 'know_it') return -1
    if (bConf === 'know_it' && aConf !== 'know_it') return 1
    // then by difficulty descending (3 before 2 before 1)
    return b.difficulty - a.difficulty
  })
}

export function isMastered(tracker, questionId) {
  return tracker.mastered.includes(questionId)
}
