export function shuffleArray(array) {
  const arr = array.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function splitPools(questions) {
  const shuffled = shuffleArray(questions)
  const mid = Math.ceil(shuffled.length / 2)
  return {
    poolA: shuffled.slice(0, mid),
    poolB: shuffled.slice(mid),
  }
}

export function buildRound(unmasteredPool, roundSize = 10) {
  if (unmasteredPool.length === 0) return []

  const pool = unmasteredPool.slice(0, roundSize)

  // Group by topic, shuffle within each group
  const topicMap = new Map()
  for (const q of pool) {
    if (!topicMap.has(q.topic)) topicMap.set(q.topic, [])
    topicMap.get(q.topic).push(q)
  }
  for (const [topic, group] of topicMap) {
    topicMap.set(topic, shuffleArray(group))
  }

  // Greedy: always pick from the largest group that doesn't match lastTopic.
  // This maximizes spacing even when topics are unevenly distributed.
  const round = []
  let lastTopic = null

  while (round.length < pool.length) {
    const candidates = [...topicMap.entries()]
      .filter(([topic, group]) => group.length > 0 && topic !== lastTopic)
      .sort((a, b) => b[1].length - a[1].length)

    // If all remaining questions share the last topic, allow a repeat
    const source = candidates.length > 0
      ? candidates[0]
      : [...topicMap.entries()].find(([, group]) => group.length > 0)

    const [topic, group] = source
    round.push(group.shift())
    lastTopic = topic
  }

  return round
}

export function getUnmastered(pool, tracker) {
  return pool.filter(q => !tracker.mastered.includes(q.id))
}
