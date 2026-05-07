import { describe, it, expect } from 'vitest'
import { validateBank } from './validator.js'

const validBank = {
  config: {
    schema_version: 4,
    storage_key: 'test-quiz-v1',
    deck_version: 1,
    emoji: '🧪',
    title: 'Test Quiz',
    subject: 'Testing',
    description: 'A test quiz.',
  },
  questions: [
    {
      id: 'mc1', type: 'mc', topic: 'A', difficulty: 2,
      question: 'Test?', explanation: 'Because.',
      options: ['A', 'B', 'C', 'D'], answer: 0,
    },
    {
      id: 'tf1', type: 'tf', topic: 'A', difficulty: 1,
      question: 'True?', explanation: 'Yes.',
      answer: true,
    },
  ],
}

const bankWith = (overrides) => structuredClone({ ...validBank, ...overrides })

const withQuestion = (qOverrides) => bankWith({
  questions: [{ ...validBank.questions[0], ...qOverrides }],
})

describe('valid banks', () => {
  it('accepts a well-formed bank with mc and tf questions', () => {
    expect(validateBank(validBank).valid).toBe(true)
  })

  it('accepts a bank with all 7 question types', () => {
    const bank = bankWith({
      questions: [
        { id: 'mc1', type: 'mc', topic: 'A', difficulty: 1, question: 'Q?', explanation: 'E.', options: ['A','B','C','D'], answer: 0 },
        { id: 'tf1', type: 'tf', topic: 'A', difficulty: 1, question: 'Q?', explanation: 'E.', answer: false },
        { id: 'fitb1', type: 'fitb', topic: 'A', difficulty: 1, question: 'Q?', explanation: 'E.', accepted: ['yes'] },
        { id: 'def1', type: 'def', topic: 'A', difficulty: 1, question: 'Q?', explanation: 'E.', options: ['A','B','C','D'], answer: 1 },
        { id: 'order1', type: 'ordering', topic: 'A', difficulty: 1, question: 'Q?', explanation: 'E.', correctOrder: ['a','b','c'] },
        { id: 'match1', type: 'match', topic: 'A', difficulty: 1, question: 'Q?', explanation: 'E.', pairs: [{term:'T1',desc:'D1'},{term:'T2',desc:'D2'},{term:'T3',desc:'D3'}] },
        { id: 'calc1', type: 'calc', topic: 'A', difficulty: 1, question: 'Q?', explanation: 'E.', answer: 42, tolerance: 0, unit: '' },
      ],
    })
    expect(validateBank(bank).valid).toBe(true)
  })

  it('returns the questions array on success', () => {
    const result = validateBank(validBank)
    expect(result.questions).toHaveLength(validBank.questions.length)
  })
})

describe('config validation', () => {
  it('rejects missing config', () => {
    const { errors } = validateBank({ questions: validBank.questions })
    expect(errors.some(e => e.includes('config'))).toBe(true)
  })

  it('rejects missing schema_version', () => {
    const bank = bankWith({ config: { ...validBank.config, schema_version: undefined } })
    expect(validateBank(bank).valid).toBe(false)
  })

  it('rejects wrong schema_version (not 4)', () => {
    const bank = bankWith({ config: { ...validBank.config, schema_version: 3 } })
    const { errors } = validateBank(bank)
    expect(errors.some(e => e.includes('schema_version'))).toBe(true)
  })

  it('rejects missing storage_key', () => {
    const bank = bankWith({ config: { ...validBank.config, storage_key: '' } })
    expect(validateBank(bank).valid).toBe(false)
  })

  it('rejects missing title', () => {
    const bank = bankWith({ config: { ...validBank.config, title: '' } })
    expect(validateBank(bank).valid).toBe(false)
  })
})

describe('universal field validation', () => {
  it('rejects question missing id', () => expect(validateBank(withQuestion({ id: undefined })).valid).toBe(false))
  it('rejects question missing type', () => expect(validateBank(withQuestion({ type: undefined })).valid).toBe(false))
  it('rejects question missing topic', () => expect(validateBank(withQuestion({ topic: undefined })).valid).toBe(false))
  it('rejects question missing difficulty', () => expect(validateBank(withQuestion({ difficulty: undefined })).valid).toBe(false))
  it('rejects question missing question text', () => expect(validateBank(withQuestion({ question: '' })).valid).toBe(false))
  it('rejects question missing explanation', () => expect(validateBank(withQuestion({ explanation: '' })).valid).toBe(false))
  it('rejects difficulty outside 1-3', () => expect(validateBank(withQuestion({ difficulty: 5 })).valid).toBe(false))
  it('rejects unknown type', () => expect(validateBank(withQuestion({ type: 'quiz' })).valid).toBe(false))

  it('rejects duplicate IDs', () => {
    const bank = bankWith({ questions: [validBank.questions[0], { ...validBank.questions[0], type: 'tf', answer: true }] })
    const { errors } = validateBank(bank)
    expect(errors.some(e => e.includes('duplicate'))).toBe(true)
  })
})

describe('type-specific validation', () => {
  it('mc: rejects options with != 4 items', () => {
    expect(validateBank(withQuestion({ options: ['A','B','C'] })).valid).toBe(false)
  })

  it('mc: rejects answer outside 0-3', () => {
    expect(validateBank(withQuestion({ answer: 5 })).valid).toBe(false)
  })

  it('mc: rejects non-integer answer', () => {
    expect(validateBank(withQuestion({ answer: 1.5 })).valid).toBe(false)
  })

  it('tf: rejects non-boolean answer', () => {
    const bank = withQuestion({ type: 'tf', answer: 'yes', options: undefined })
    expect(validateBank(bank).valid).toBe(false)
  })

  it('fitb: rejects empty accepted array', () => {
    const bank = withQuestion({ type: 'fitb', accepted: [], options: undefined, answer: undefined })
    expect(validateBank(bank).valid).toBe(false)
  })

  it('fitb: rejects missing accepted field', () => {
    const bank = withQuestion({ type: 'fitb', accepted: undefined, options: undefined, answer: undefined })
    expect(validateBank(bank).valid).toBe(false)
  })

  it('ordering: rejects correctOrder with < 3 items', () => {
    const bank = withQuestion({ type: 'ordering', correctOrder: ['a','b'], options: undefined, answer: undefined })
    expect(validateBank(bank).valid).toBe(false)
  })

  it('match: rejects pairs with < 3 items', () => {
    const bank = withQuestion({ type: 'match', pairs: [{term:'T1',desc:'D1'}], options: undefined, answer: undefined })
    expect(validateBank(bank).valid).toBe(false)
  })

  it('match: rejects pair missing term or desc', () => {
    const bank = withQuestion({ type: 'match', pairs: [{term:'T1',desc:'D1'},{term:'T2'},{term:'T3',desc:'D3'}], options: undefined, answer: undefined })
    expect(validateBank(bank).valid).toBe(false)
  })

  it('calc: rejects non-number answer', () => {
    const bank = withQuestion({ type: 'calc', answer: 'oops', tolerance: 0, options: undefined })
    expect(validateBank(bank).valid).toBe(false)
  })

  it('calc: rejects negative tolerance', () => {
    const bank = withQuestion({ type: 'calc', answer: 42, tolerance: -1, options: undefined })
    expect(validateBank(bank).valid).toBe(false)
  })
})

describe('error reporting', () => {
  it('collects multiple errors (does not stop at first)', () => {
    const bank = bankWith({ config: { ...validBank.config, schema_version: 3, storage_key: '', title: '' } })
    expect(validateBank(bank).errors.length).toBeGreaterThan(1)
  })

  it('error messages include the question id', () => {
    const { errors } = validateBank(withQuestion({ difficulty: 9 }))
    expect(errors.some(e => e.includes('mc1'))).toBe(true)
  })

  it('error messages describe the problem specifically', () => {
    const { errors } = validateBank(withQuestion({ options: ['A','B','C'] }))
    expect(errors.some(e => e.includes('4'))).toBe(true)
  })
})
