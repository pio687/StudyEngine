import { describe, it, expect } from 'vitest'
import { shuffleArray, splitPools, buildRound, getUnmastered } from './questionSelector.js'
import { createTracker, recordAnswer } from './masteryTracker.js'

const sampleQuestions = [
  { id: 'mc1', type: 'mc', topic: 'A', difficulty: 1 },
  { id: 'mc2', type: 'mc', topic: 'B', difficulty: 2 },
  { id: 'tf1', type: 'tf', topic: 'C', difficulty: 1 },
  { id: 'mc3', type: 'mc', topic: 'A', difficulty: 3 },
  { id: 'tf2', type: 'tf', topic: 'B', difficulty: 2 },
  { id: 'mc4', type: 'mc', topic: 'C', difficulty: 1 },
  { id: 'fitb1', type: 'fitb', topic: 'A', difficulty: 2 },
  { id: 'mc5', type: 'mc', topic: 'B', difficulty: 3 },
  { id: 'tf3', type: 'tf', topic: 'C', difficulty: 1 },
  { id: 'mc6', type: 'mc', topic: 'A', difficulty: 2 },
  { id: 'fitb2', type: 'fitb', topic: 'B', difficulty: 3 },
  { id: 'mc7', type: 'mc', topic: 'C', difficulty: 1 },
]

describe('shuffleArray', () => {
  it('returns a new array (does not mutate input)', () => {
    const input = [1, 2, 3]
    shuffleArray(input)
    expect(input).toEqual([1, 2, 3])
  })

  it('returned array has same length and elements', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffleArray(input)
    expect(result).toHaveLength(input.length)
    expect(result.sort()).toEqual([...input].sort())
  })

  it('returned array is not always in the same order', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const results = Array.from({ length: 10 }, () => shuffleArray(input).join(','))
    const unique = new Set(results)
    expect(unique.size).toBeGreaterThan(1)
  })
})

describe('splitPools', () => {
  it('returns two pools that together contain all questions', () => {
    const { poolA, poolB } = splitPools(sampleQuestions)
    const allIds = sampleQuestions.map(q => q.id).sort()
    const combined = [...poolA, ...poolB].map(q => q.id).sort()
    expect(combined).toEqual(allIds)
  })

  it('pools have no overlap', () => {
    const { poolA, poolB } = splitPools(sampleQuestions)
    const aIds = new Set(poolA.map(q => q.id))
    expect(poolB.every(q => !aIds.has(q.id))).toBe(true)
  })

  it('even count: pools are equal size', () => {
    const { poolA, poolB } = splitPools(sampleQuestions)
    expect(poolA.length).toBe(6)
    expect(poolB.length).toBe(6)
  })

  it('odd count: pool A has one more than pool B', () => {
    const odd = sampleQuestions.slice(0, 11)
    const { poolA, poolB } = splitPools(odd)
    expect(poolA.length).toBe(6)
    expect(poolB.length).toBe(5)
  })
})

describe('buildRound', () => {
  it('returns up to roundSize questions', () => {
    const round = buildRound(sampleQuestions)
    expect(round.length).toBe(10)
  })

  it('if pool has fewer than roundSize, returns all of them', () => {
    const small = sampleQuestions.slice(0, 3)
    expect(buildRound(small)).toHaveLength(3)
  })

  it('no two consecutive questions share the same topic (when possible)', () => {
    const round = buildRound(sampleQuestions)
    for (let i = 1; i < round.length; i++) {
      expect(round[i].topic).not.toBe(round[i - 1].topic)
    }
  })

  it('returns empty array for empty pool', () => {
    expect(buildRound([])).toEqual([])
  })
})

describe('getUnmastered', () => {
  it('returns all questions when tracker has no mastered', () => {
    const result = getUnmastered(sampleQuestions, createTracker())
    expect(result).toHaveLength(sampleQuestions.length)
  })

  it('excludes mastered questions', () => {
    let t = createTracker()
    t = recordAnswer(t, 'mc1', true)
    t = recordAnswer(t, 'mc2', true)
    const result = getUnmastered(sampleQuestions, t)
    expect(result.find(q => q.id === 'mc1')).toBeUndefined()
    expect(result.find(q => q.id === 'mc2')).toBeUndefined()
    expect(result).toHaveLength(sampleQuestions.length - 2)
  })

  it('returns empty array when all are mastered', () => {
    let t = createTracker()
    for (const q of sampleQuestions) t = recordAnswer(t, q.id, true)
    expect(getUnmastered(sampleQuestions, t)).toEqual([])
  })
})
