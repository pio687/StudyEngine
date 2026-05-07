const PREFIX = 'studyengine_'

export function saveState(storageKey, state) {
  try {
    localStorage.setItem(PREFIX + storageKey, JSON.stringify(state))
  } catch (e) {
    // localStorage full or unavailable — silently fail
  }
}

export function loadState(storageKey) {
  try {
    const raw = localStorage.getItem(PREFIX + storageKey)
    if (raw === null) return null
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

export function clearState(storageKey) {
  localStorage.removeItem(PREFIX + storageKey)
}

export function hasState(storageKey) {
  return localStorage.getItem(PREFIX + storageKey) !== null
}
