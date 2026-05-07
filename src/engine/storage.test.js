import { describe, it, expect, beforeEach, vi } from 'vitest'
import { saveState, loadState, clearState, hasState } from './storage.js'

beforeEach(() => {
  const store = {}
  vi.stubGlobal('localStorage', {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = val },
    removeItem: (key) => { delete store[key] },
  })
})

describe('saveState / loadState', () => {
  it('saves and loads a simple object', () => {
    saveState('test', { hello: 'world' })
    expect(loadState('test')).toEqual({ hello: 'world' })
  })

  it('returns null for a key that does not exist', () => {
    expect(loadState('nonexistent')).toBeNull()
  })

  it('returns null for corrupt JSON', () => {
    localStorage.setItem('studyengine_corrupt', '{bad json')
    expect(loadState('corrupt')).toBeNull()
  })

  it('prefixes keys with studyengine_', () => {
    saveState('mykey', { x: 1 })
    expect(localStorage.getItem('studyengine_mykey')).toBe(JSON.stringify({ x: 1 }))
  })
})

describe('clearState', () => {
  it('removes saved state', () => {
    saveState('test', { x: 1 })
    clearState('test')
    expect(localStorage.getItem('studyengine_test')).toBeNull()
  })

  it('loadState returns null after clear', () => {
    saveState('test', { x: 1 })
    clearState('test')
    expect(loadState('test')).toBeNull()
  })
})

describe('hasState', () => {
  it('returns false when no state exists', () => {
    expect(hasState('test')).toBe(false)
  })

  it('returns true after saving state', () => {
    saveState('test', { x: 1 })
    expect(hasState('test')).toBe(true)
  })

  it('returns false after clearing state', () => {
    saveState('test', { x: 1 })
    clearState('test')
    expect(hasState('test')).toBe(false)
  })
})
