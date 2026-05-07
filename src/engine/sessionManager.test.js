import { describe, it, expect } from 'vitest'
import {
  initPractice, initStudy, answerQuestion,
  nextRound, nextSession, getCurrentQuestion, getProgress
} from './sessionManager.js'

const makeQuestions = (n = 12) => Array.from({ length: n }, (_, i) => ({
  id: `q${i + 1}`,
  type: 'mc',
  topic: ['A', 'B', 'C'][i % 3],
  difficulty: (i % 3) + 1,
  question: `Question ${i + 1}`,
  explanation: `Explanation ${i + 1}`,
}))

function runToPhase(state, targetPhase) {
  let s = state
  let limit = 500
  while (s.phase !== targetPhase && limit-- > 0) {
    if (s.phase === 'active') s = answerQuestion(s, true)
    else if (s.phase === 'round_review') s = nextRound(s)
    else break
  }
  return s
}

describe('initPractice', () => {
  it('sets mode to practice', () => {
    expect(initPractice(makeQuestions()).mode).toBe('practice')
  })

  it('sets phase to active', () => {
    expect(initPractice(makeQuestions()).phase).toBe('active')
  })

  it('session is null', () => {
    expect(initPractice(makeQuestions()).session).toBeNull()
  })

  it('currentPool contains all questions', () => {
    expect(initPractice(makeQuestions()).currentPool).toHaveLength(12)
  })

  it('first round has up to 10 questions', () => {
    expect(initPractice(makeQuestions()).currentRound).toHaveLength(10)
  })

  it('currentQuestionIndex is 0', () => {
    expect(initPractice(makeQuestions()).currentQuestionIndex).toBe(0)
  })
})

describe('initStudy', () => {
  it('sets mode to study', () => {
    expect(initStudy(makeQuestions()).mode).toBe('study')
  })

  it('sets session to 1', () => {
    expect(initStudy(makeQuestions()).session).toBe(1)
  })

  it('pools.a and pools.b together contain all questions with no overlap', () => {
    const s = initStudy(makeQuestions())
    const allIds = makeQuestions().map(q => q.id).sort()
    const combined = [...s.pools.a, ...s.pools.b].map(q => q.id).sort()
    expect(combined).toEqual(allIds)
    const aIds = new Set(s.pools.a.map(q => q.id))
    expect(s.pools.b.every(q => !aIds.has(q.id))).toBe(true)
  })

  it('currentPool matches pools.a', () => {
    const s = initStudy(makeQuestions())
    expect(s.currentPool.map(q => q.id).sort()).toEqual(s.pools.a.map(q => q.id).sort())
  })

  it('first round is built', () => {
    expect(initStudy(makeQuestions()).currentRound.length).toBeGreaterThan(0)
  })
})

describe('answerQuestion', () => {
  it('advances currentQuestionIndex', () => {
    const s = initPractice(makeQuestions())
    expect(answerQuestion(s, true).currentQuestionIndex).toBe(1)
  })

  it('updates tracker with result', () => {
    const s = initPractice(makeQuestions())
    const q = getCurrentQuestion(s)
    const next = answerQuestion(s, true)
    expect(next.tracker.mastered).toContain(q.id)
  })

  it('at end of round: phase becomes round_review', () => {
    let s = initPractice(makeQuestions())
    for (let i = 0; i < 10; i++) s = answerQuestion(s, true)
    expect(s.phase).toBe('round_review')
  })

  it('does not mutate input state', () => {
    const s = initPractice(makeQuestions())
    answerQuestion(s, true)
    expect(s.currentQuestionIndex).toBe(0)
  })

  it('appends roundResult to state.roundResults when provided', () => {
    const s = initPractice(makeQuestions())
    const q = getCurrentQuestion(s)
    const roundResult = { question: q, userAnswer: 0, isCorrect: true, confidence: null }
    const next = answerQuestion(s, true, null, roundResult)
    expect(next.roundResults).toHaveLength(1)
    expect(next.roundResults[0]).toEqual(roundResult)
  })

  it('does not append to roundResults when roundResult is null', () => {
    const s = initPractice(makeQuestions())
    const next = answerQuestion(s, true, null, null)
    expect(next.roundResults).toHaveLength(0)
  })

  it('roundResults accumulates across questions in a round', () => {
    let s = initPractice(makeQuestions())
    for (let i = 0; i < 3; i++) {
      const q = getCurrentQuestion(s)
      const rr = { question: q, userAnswer: 0, isCorrect: true, confidence: null }
      s = answerQuestion(s, true, null, rr)
    }
    expect(s.roundResults).toHaveLength(3)
  })
})

describe('nextRound', () => {
  it('builds new round from unmastered questions', () => {
    let s = initPractice(makeQuestions())
    for (let i = 0; i < 10; i++) s = answerQuestion(s, true)
    s = nextRound(s)
    expect(s.currentRound.length).toBeGreaterThan(0)
  })

  it('resets currentQuestionIndex to 0', () => {
    let s = initPractice(makeQuestions())
    for (let i = 0; i < 10; i++) s = answerQuestion(s, true)
    expect(nextRound(s).currentQuestionIndex).toBe(0)
  })

  it('phase becomes active', () => {
    let s = initPractice(makeQuestions())
    for (let i = 0; i < 10; i++) s = answerQuestion(s, true)
    expect(nextRound(s).phase).toBe('active')
  })

  it('if no unmastered questions remain: practice goes to complete', () => {
    const s = runToPhase(initPractice(makeQuestions()), 'round_review')
    const next = nextRound(s)
    expect(['complete', 'active']).toContain(next.phase)
    const final = runToPhase(s, 'complete')
    expect(final.phase).toBe('complete')
  })

  it('if no unmastered questions remain in study: goes to session_review', () => {
    const s = runToPhase(initStudy(makeQuestions()), 'session_review')
    expect(s.phase).toBe('session_review')
  })

  it('resets roundResults to empty array', () => {
    let s = initPractice(makeQuestions())
    for (let i = 0; i < 10; i++) {
      const q = getCurrentQuestion(s)
      s = answerQuestion(s, true, null, { question: q, userAnswer: 0, isCorrect: true, confidence: null })
    }
    expect(s.roundResults).toHaveLength(10)
    s = nextRound(s)
    expect(s.roundResults).toEqual([])
  })
})

describe('nextSession', () => {
  it('session 1 → 2: currentPool switches to pool B', () => {
    const s = runToPhase(initStudy(makeQuestions()), 'session_review')
    const s2 = nextSession(s)
    expect(s2.session).toBe(2)
    expect(s2.currentPool.map(q => q.id).sort()).toEqual(s.pools.b.map(q => q.id).sort())
  })

  it('session 1 → 2: session tracker for session 1 is preserved', () => {
    const s = runToPhase(initStudy(makeQuestions()), 'session_review')
    const s2 = nextSession(s)
    expect(s2.sessionTrackers[1]).not.toBeNull()
  })

  it('session 2 → 3: currentPool is built from combined misses', () => {
    let s = initStudy(makeQuestions())
    // Session 1: answer first 2 wrong
    let answered = 0
    s = runToPhase(s, 'session_review')
    // Redo with some wrong
    s = initStudy(makeQuestions())
    answered = 0
    while (s.phase !== 'session_review') {
      if (s.phase === 'active') {
        s = answerQuestion(s, answered >= 2, answered < 2 ? 'know_it' : null)
        answered++
      } else if (s.phase === 'round_review') s = nextRound(s)
    }
    const s2 = nextSession(s)
    answered = 0
    let s2state = s2
    while (s2state.phase !== 'session_review') {
      if (s2state.phase === 'active') {
        s2state = answerQuestion(s2state, answered >= 2, answered < 2 ? 'unsure' : null)
        answered++
      } else if (s2state.phase === 'round_review') s2state = nextRound(s2state)
    }
    const s3 = nextSession(s2state)
    expect(s3.session).toBe(3)
    expect(s3.currentPool.length).toBeGreaterThan(0)
  })

  it('session 2 → complete: if no misses, skip session 3', () => {
    const qs = makeQuestions(4)
    let s = runToPhase(initStudy(qs), 'session_review')
    s = runToPhase(nextSession(s), 'session_review')
    expect(nextSession(s).phase).toBe('complete')
  })

  it('session 3 → complete', () => {
    const qs = makeQuestions(4)
    let s = initStudy(qs)
    // Answer some wrong in session 1
    let answered = 0
    while (s.phase !== 'session_review') {
      if (s.phase === 'active') { s = answerQuestion(s, answered > 0, 'know_it'); answered++ }
      else if (s.phase === 'round_review') s = nextRound(s)
    }
    s = runToPhase(nextSession(s), 'session_review') // session 2
    s = nextSession(s) // session 3
    s = runToPhase(s, 'session_review')
    expect(nextSession(s).phase).toBe('complete')
  })
})

describe('getCurrentQuestion', () => {
  it('returns the question at currentQuestionIndex in currentRound', () => {
    const s = initPractice(makeQuestions())
    const q = getCurrentQuestion(s)
    expect(q).toBe(s.currentRound[0])
  })

  it('returns null when phase is not active', () => {
    let s = initPractice(makeQuestions())
    for (let i = 0; i < 10; i++) s = answerQuestion(s, true)
    expect(getCurrentQuestion(s)).toBeNull()
  })
})

describe('getProgress', () => {
  it('returns correct answered/total counts', () => {
    const s = initPractice(makeQuestions())
    const p = getProgress(s)
    expect(p.answered).toBe(0)
    expect(p.total).toBe(12)
  })

  it('total reflects the current pool size', () => {
    const s = initStudy(makeQuestions())
    const p = getProgress(s)
    expect(p.total).toBe(s.currentPool.length)
  })
})

describe('round size edge cases', () => {
  it('pool of exactly 10: one full round, then complete', () => {
    const s = runToPhase(initPractice(makeQuestions(10)), 'complete')
    expect(s.phase).toBe('complete')
  })

  it('pool of 11: first round has 10, second round has 1', () => {
    let s = initPractice(makeQuestions(11))
    expect(s.currentRound).toHaveLength(10)
    for (let i = 0; i < 10; i++) s = answerQuestion(s, true)
    s = nextRound(s)
    expect(s.currentRound).toHaveLength(1)
  })

  it('pool of 3: single round of 3 questions', () => {
    const s = initPractice(makeQuestions(3))
    expect(s.currentRound).toHaveLength(3)
  })
})

describe('state isolation', () => {
  it('practice mode state has session null', () => {
    expect(initPractice(makeQuestions()).session).toBeNull()
  })

  it('study mode state has sessionTrackers for 1, 2, 3', () => {
    const s = initStudy(makeQuestions())
    expect(s.sessionTrackers).toHaveProperty('1')
    expect(s.sessionTrackers).toHaveProperty('2')
    expect(s.sessionTrackers).toHaveProperty('3')
  })

  it('answering in practice does not affect study state keys', () => {
    const ps = answerQuestion(initPractice(makeQuestions()), true)
    expect(ps.sessionTrackers[1]).toBeNull()
    expect(ps.sessionTrackers[2]).toBeNull()
    expect(ps.sessionTrackers[3]).toBeNull()
  })
})
