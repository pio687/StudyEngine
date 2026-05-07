import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveState, loadState, clearState, hasState } from './storage.js'

// Simulates the key patterns App.jsx uses:
//   {storage_key}_practice  and  {storage_key}_study
const STORAGE_KEY = 'quiz-test'
const practiceKey = STORAGE_KEY + '_practice'
const studyKey = STORAGE_KEY + '_study'

const mockPracticeState = { mode: 'practice', phase: 'active' }
const mockStudyState = { mode: 'study', phase: 'active', session: 1 }

beforeEach(() => {
  const store = {}
  vi.stubGlobal('localStorage', {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = val },
    removeItem: (key) => { delete store[key] },
  })
})

describe('practice mode persistence', () => {
  it('practice state is saved with _practice suffix', () => {
    saveState(practiceKey, mockPracticeState)
    expect(hasState(practiceKey)).toBe(true)
    expect(loadState(practiceKey)).toEqual(mockPracticeState)
  })

  it('study state is saved with _study suffix', () => {
    saveState(studyKey, mockStudyState)
    expect(hasState(studyKey)).toBe(true)
    expect(loadState(studyKey)).toEqual(mockStudyState)
  })

  it('saving practice state does not affect study state', () => {
    saveState(practiceKey, mockPracticeState)
    expect(hasState(studyKey)).toBe(false)
    expect(loadState(studyKey)).toBeNull()
  })

  it('saving study state does not affect practice state', () => {
    saveState(studyKey, mockStudyState)
    expect(hasState(practiceKey)).toBe(false)
    expect(loadState(practiceKey)).toBeNull()
  })

  it('both can exist in localStorage simultaneously', () => {
    saveState(practiceKey, mockPracticeState)
    saveState(studyKey, mockStudyState)
    expect(hasState(practiceKey)).toBe(true)
    expect(hasState(studyKey)).toBe(true)
    expect(loadState(practiceKey)).toEqual(mockPracticeState)
    expect(loadState(studyKey)).toEqual(mockStudyState)
  })

  it('completing practice mode clears practice state', () => {
    saveState(practiceKey, mockPracticeState)
    clearState(practiceKey)
    expect(hasState(practiceKey)).toBe(false)
    expect(loadState(practiceKey)).toBeNull()
  })

  it('completing practice mode does not clear study state', () => {
    saveState(practiceKey, mockPracticeState)
    saveState(studyKey, mockStudyState)
    clearState(practiceKey)
    expect(hasState(studyKey)).toBe(true)
    expect(loadState(studyKey)).toEqual(mockStudyState)
  })

  it('"start over" practice clears only practice state', () => {
    saveState(practiceKey, mockPracticeState)
    saveState(studyKey, mockStudyState)
    clearState(practiceKey)
    expect(hasState(practiceKey)).toBe(false)
    expect(hasState(studyKey)).toBe(true)
  })
})
