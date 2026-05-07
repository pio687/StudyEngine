import { createTracker, recordAnswer, getPriorityMisses } from './masteryTracker.js'
import { shuffleArray, splitPools, buildRound, getUnmastered } from './questionSelector.js'

export function initPractice(questions) {
  const pool = shuffleArray(questions)
  const round = buildRound(pool)

  return {
    mode: 'practice',
    phase: 'active',
    session: null,
    pools: { a: [], b: [] },
    currentPool: pool,
    currentRound: round,
    currentQuestionIndex: 0,
    tracker: createTracker(),
    sessionTrackers: { 1: null, 2: null, 3: null },
    roundResults: [],
  }
}

export function initStudy(questions) {
  const { poolA, poolB } = splitPools(questions)
  const round = buildRound(poolA)

  return {
    mode: 'study',
    phase: 'active',
    session: 1,
    pools: { a: poolA, b: poolB },
    currentPool: poolA,
    currentRound: round,
    currentQuestionIndex: 0,
    tracker: createTracker(),
    sessionTrackers: { 1: null, 2: null, 3: null },
    roundResults: [],
  }
}

export function answerQuestion(state, isCorrect, confidence = null, roundResult = null) {
  const question = state.currentRound[state.currentQuestionIndex]
  const tracker = recordAnswer(state.tracker, question.id, isCorrect, confidence)
  const nextIndex = state.currentQuestionIndex + 1
  const isEndOfRound = nextIndex >= state.currentRound.length
  const roundResults = roundResult !== null
    ? [...state.roundResults, roundResult]
    : state.roundResults

  return {
    ...state,
    tracker,
    currentQuestionIndex: nextIndex,
    phase: isEndOfRound ? 'round_review' : 'active',
    roundResults,
  }
}

export function nextRound(state) {
  const unmastered = getUnmastered(state.currentPool, state.tracker)

  if (unmastered.length === 0) {
    return { ...state, phase: state.mode === 'practice' ? 'complete' : 'session_review' }
  }

  const round = buildRound(unmastered)
  return {
    ...state,
    currentRound: round,
    currentQuestionIndex: 0,
    phase: 'active',
    roundResults: [],
  }
}

export function nextSession(state) {
  if (state.session === 1) {
    // Save session 1 tracker, move to pool B
    const round = buildRound(state.pools.b)
    return {
      ...state,
      session: 2,
      phase: 'active',
      currentPool: state.pools.b,
      currentRound: round,
      currentQuestionIndex: 0,
      tracker: createTracker(),
      sessionTrackers: { ...state.sessionTrackers, 1: state.tracker },
    }
  }

  if (state.session === 2) {
    const savedTrackers = { ...state.sessionTrackers, 2: state.tracker }

    // Combine all questions from both pools to look up missed ones
    const allQuestions = [...state.pools.a, ...state.pools.b]
    const s1Missed = savedTrackers[1] ? savedTrackers[1].missed : []
    const s2Missed = state.tracker.missed

    // Build combined miss pool (unique IDs)
    const missedIds = new Set([...s1Missed, ...s2Missed])
    const missedQuestions = allQuestions.filter(q => missedIds.has(q.id))

    // Use combined tracker results for priority sorting
    const combinedResults = {
      ...(savedTrackers[1]?.results || {}),
      ...state.tracker.results,
    }
    const combinedTracker = { results: combinedResults, mastered: [], missed: [...missedIds] }
    const prioritized = getPriorityMisses(combinedTracker, missedQuestions)

    if (prioritized.length === 0) {
      return { ...state, phase: 'complete', sessionTrackers: savedTrackers }
    }

    const round = buildRound(prioritized)
    return {
      ...state,
      session: 3,
      phase: 'active',
      currentPool: prioritized,
      currentRound: round,
      currentQuestionIndex: 0,
      tracker: createTracker(),
      sessionTrackers: savedTrackers,
    }
  }

  if (state.session === 3) {
    return {
      ...state,
      phase: 'complete',
      sessionTrackers: { ...state.sessionTrackers, 3: state.tracker },
    }
  }

  return state
}

export function getCurrentQuestion(state) {
  if (state.phase !== 'active') return null
  return state.currentRound[state.currentQuestionIndex] ?? null
}

export function getProgress(state) {
  const mastered = state.tracker.mastered.length
  const total = state.currentPool.length
  const roundSize = state.currentRound.length
  const answeredInRound = state.currentQuestionIndex
  const unmastered = getUnmastered(state.currentPool, state.tracker).length
  const totalRounds = Math.ceil(unmastered / 10) + (state.phase === 'active' ? 1 : 0)

  return {
    answered: mastered,
    total,
    answeredInRound,
    roundSize,
    totalRounds,
  }
}
