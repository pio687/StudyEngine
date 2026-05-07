import { describe, it, expect } from 'vitest'
import {
  createTracker, recordAnswer, getMissedQuestions,
  getPriorityMisses, isMastered
} from './masteryTracker.js'

const makeTracker = () => createTracker()

describe('createTracker', () => {
  it('returns object with empty results, mastered, and missed', () => {
    const t = makeTracker()
    expect(t.results).toEqual({})
    expect(t.mastered).toEqual([])
    expect(t.missed).toEqual([])
  })
})

describe('recordAnswer', () => {
  it('correct answer adds question to mastered', () => {
    const t = recordAnswer(makeTracker(), 'q1', true)
    expect(t.mastered).toContain('q1')
  })

  it('correct answer does not remove question from missed (missed is append-only)', () => {
    let t = recordAnswer(makeTracker(), 'q1', false)
    t = recordAnswer(t, 'q1', true)
    expect(t.missed).toContain('q1')
    expect(t.mastered).toContain('q1')
  })

  it('wrong answer adds question to missed', () => {
    const t = recordAnswer(makeTracker(), 'q1', false)
    expect(t.missed).toContain('q1')
  })

  it('wrong answer removes question from mastered if it was there', () => {
    let t = recordAnswer(makeTracker(), 'q1', true)
    t = recordAnswer(t, 'q1', false)
    expect(t.mastered).not.toContain('q1')
  })

  it('stores confidence level from wrong answer in results', () => {
    const t = recordAnswer(makeTracker(), 'q1', false, 'know_it')
    expect(t.results['q1'].confidence).toBe('know_it')
  })

  it('preserves wrong-answer confidence when answered correctly', () => {
    let t = recordAnswer(makeTracker(), 'q1', false, 'unsure')
    t = recordAnswer(t, 'q1', true, null)
    expect(t.results['q1'].confidence).toBe('unsure')
  })

  it('stores null confidence without error (practice mode)', () => {
    const t = recordAnswer(makeTracker(), 'q1', true, null)
    expect(t.results['q1'].confidence).toBeNull()
  })

  it('increments attempt count on repeated answers', () => {
    let t = recordAnswer(makeTracker(), 'q1', false)
    t = recordAnswer(t, 'q1', true)
    expect(t.results['q1'].attempts).toBe(2)
  })

  it('does not mutate the input tracker', () => {
    const original = makeTracker()
    recordAnswer(original, 'q1', true)
    expect(original.mastered).toEqual([])
  })
})

describe('getMissedQuestions', () => {
  it('returns empty array on fresh tracker', () => {
    expect(getMissedQuestions(makeTracker())).toEqual([])
  })

  it('returns IDs of missed questions', () => {
    const t = recordAnswer(makeTracker(), 'q1', false)
    expect(getMissedQuestions(t)).toContain('q1')
  })

  it('includes questions that were wrong then corrected (append-only)', () => {
    let t = recordAnswer(makeTracker(), 'q1', false)
    t = recordAnswer(t, 'q1', true)
    expect(getMissedQuestions(t)).toContain('q1')
  })
})

describe('getPriorityMisses', () => {
  const questions = [
    { id: 'a', difficulty: 3 },
    { id: 'b', difficulty: 1 },
    { id: 'c', difficulty: 2 },
    { id: 'd', difficulty: 2 },
  ]

  it('sorts know_it confidence wrongs before unsure wrongs', () => {
    let t = makeTracker()
    t = recordAnswer(t, 'a', false, 'unsure')
    t = recordAnswer(t, 'b', false, 'know_it')
    const result = getPriorityMisses(t, questions)
    expect(result[0].id).toBe('b')
  })

  it('within same confidence, sorts by difficulty descending', () => {
    let t = makeTracker()
    t = recordAnswer(t, 'b', false, 'know_it')  // diff 1
    t = recordAnswer(t, 'c', false, 'know_it')  // diff 2
    t = recordAnswer(t, 'a', false, 'know_it')  // diff 3
    const result = getPriorityMisses(t, questions)
    expect(result.map(q => q.id)).toEqual(['a', 'c', 'b'])
  })

  it('returns empty array when no misses', () => {
    expect(getPriorityMisses(makeTracker(), questions)).toEqual([])
  })
})

describe('isMastered', () => {
  it('returns false for unanswered question', () => {
    expect(isMastered(makeTracker(), 'q1')).toBe(false)
  })

  it('returns true after correct answer', () => {
    const t = recordAnswer(makeTracker(), 'q1', true)
    expect(isMastered(t, 'q1')).toBe(true)
  })

  it('returns false after correct then wrong answer', () => {
    let t = recordAnswer(makeTracker(), 'q1', true)
    t = recordAnswer(t, 'q1', false)
    expect(isMastered(t, 'q1')).toBe(false)
  })
})
