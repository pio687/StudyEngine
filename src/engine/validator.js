const VALID_TYPES = new Set(['mc', 'tf', 'fitb', 'def', 'ordering', 'match', 'calc'])
const VALID_DIFFICULTIES = new Set([1, 2, 3])

export function validateBank(parsed) {
  const errors = []

  // Config validation
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['Bank must be an object'], questions: [] }
  }

  const { config, questions } = parsed

  if (!config || typeof config !== 'object') {
    errors.push('Missing config block')
  } else {
    if (config.schema_version !== 4) {
      errors.push(`config.schema_version must be 4 (got ${config.schema_version})`)
    }
    if (!config.storage_key) {
      errors.push('config.storage_key is required')
    } else if (!/^[a-zA-Z0-9_-]+$/.test(config.storage_key)) {
      errors.push('config.storage_key must contain only letters, numbers, hyphens, and underscores')
    }
    if (!config.title) {
      errors.push('config.title is required')
    }
  }

  // Questions array validation
  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push('questions must be a non-empty array')
    return { valid: false, errors, questions: [] }
  }

  const seenIds = new Set()

  for (const q of questions) {
    const prefix = `Question ${q.id ?? '(no id)'}`

    // Universal fields
    if (!q.id) {
      errors.push(`${prefix}: missing id`)
    } else if (seenIds.has(q.id)) {
      errors.push(`Question ${q.id}: duplicate id`)
    } else {
      seenIds.add(q.id)
    }

    if (!q.type) {
      errors.push(`${prefix}: missing type`)
    } else if (!VALID_TYPES.has(q.type)) {
      errors.push(`${prefix}: unknown type "${q.type}"`)
    }

    if (!q.topic) errors.push(`${prefix}: missing topic`)
    if (q.difficulty === undefined || q.difficulty === null) {
      errors.push(`${prefix}: missing difficulty`)
    } else if (!VALID_DIFFICULTIES.has(q.difficulty)) {
      errors.push(`${prefix}: difficulty must be 1, 2, or 3 (got ${q.difficulty})`)
    }
    if (!q.question) errors.push(`${prefix}: missing question text`)
    if (!q.explanation) errors.push(`${prefix}: missing explanation`)

    // Type-specific validation
    if (q.type === 'tf') {
      if (typeof q.answer !== 'boolean') {
        errors.push(`${prefix}: answer must be a boolean (got ${typeof q.answer})`)
      }
    }

    if (q.type === 'mc' || q.type === 'def') {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(`${prefix}: options must be an array of exactly 4 items (got ${Array.isArray(q.options) ? q.options.length : typeof q.options})`)
      }
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
        errors.push(`${prefix}: answer must be an integer 0–3 (got ${q.answer})`)
      }
    }

    if (q.type === 'fitb') {
      if (!Array.isArray(q.accepted) || q.accepted.length === 0) {
        errors.push(`${prefix}: accepted must be a non-empty array`)
      }
    }

    if (q.type === 'ordering') {
      if (!Array.isArray(q.correctOrder) || q.correctOrder.length < 3) {
        errors.push(`${prefix}: correctOrder must be an array with at least 3 items (got ${Array.isArray(q.correctOrder) ? q.correctOrder.length : typeof q.correctOrder})`)
      }
    }

    if (q.type === 'match') {
      if (!Array.isArray(q.pairs) || q.pairs.length < 3) {
        errors.push(`${prefix}: pairs must be an array with at least 3 items (got ${Array.isArray(q.pairs) ? q.pairs.length : typeof q.pairs})`)
      } else {
        for (let i = 0; i < q.pairs.length; i++) {
          const pair = q.pairs[i]
          if (!pair.term || !pair.desc) {
            errors.push(`${prefix}: pairs[${i}] must have both term and desc`)
          }
        }
      }
    }

    if (q.type === 'calc') {
      if (typeof q.answer !== 'number') {
        errors.push(`${prefix}: answer must be a number (got ${typeof q.answer})`)
      }
      if (typeof q.tolerance !== 'number' || q.tolerance < 0) {
        errors.push(`${prefix}: tolerance must be a number >= 0 (got ${q.tolerance})`)
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, questions: [] }
  }

  return { valid: true, errors: [], questions }
}
