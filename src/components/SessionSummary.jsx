function ScoreCircle({ correct, total }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const radius = 48
  const stroke = 6
  const normalizedR = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedR
  const offset = circumference * (1 - pct / 100)

  const ringColor = pct >= 70 ? 'var(--accent)' : 'var(--wrong)'

  return (
    <div className="flex flex-col items-center mb-6 -mt-2.5">
      <div className="text-[11px] font-mono uppercase tracking-wide text-muted mb-3.5">
        Session Results
      </div>
      <svg width={radius * 2} height={radius * 2} role="img" aria-label={`Score: ${correct} out of ${total}, ${pct} percent`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={radius} cy={radius} r={normalizedR} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={radius} cy={radius} r={normalizedR}
          fill="none" stroke={ringColor} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: -(radius * 2), height: radius * 2 }}>
        <span className="text-[26px] font-bold text-text leading-none">{pct}%</span>
        <span className="text-xs text-muted font-mono mt-0.5">{correct}/{total}</span>
      </div>
    </div>
  )
}

export default function SessionSummary({ config, session, tracker, currentPool, sessionTrackers, onNextSession, onComplete }) {
  const total = currentPool.length
  const masteredCount = tracker.mastered.length
  const missedCount = tracker.missed.length
  const hcwCount = tracker.missed.filter(id => tracker.results[id]?.confidence === 'know_it').length

  const topicStats = {}
  for (const q of currentPool) {
    if (!topicStats[q.topic]) topicStats[q.topic] = { total: 0, correct: 0 }
    topicStats[q.topic].total++
    if (tracker.mastered.includes(q.id)) topicStats[q.topic].correct++
  }

  let nextPreview = ''
  let isFinish = false

  if (session === 1) {
    nextPreview = "Session 2 will cover the other half of the bank. Get some rest — spacing helps retention."
  } else if (session === 2) {
    const s1Missed = sessionTrackers[1]?.missed ?? []
    const nextMissedCount = new Set([...s1Missed, ...tracker.missed]).size
    if (nextMissedCount > 0) {
      nextPreview = `Session 3 will review ${nextMissedCount} question${nextMissedCount === 1 ? '' : 's'} you missed.`
    } else {
      nextPreview = "No misses — you're done!"
      isFinish = true
    }
  } else if (session === 3) {
    nextPreview = "All sessions complete. Review the question bank to reinforce."
    isFinish = true
  }

  return (
    <div className="min-h-screen bg-bg flex justify-center px-4 py-6">
      <div className="w-full max-w-[620px]">

        {/* Header */}
        {config && (
          <div className="mb-5 text-center">
            <div className="text-[10px] font-mono uppercase tracking-wide text-neutral mb-1">
              {config.subject}
            </div>
            <div className="text-lg font-bold text-text leading-tight">
              {config.title}
            </div>
            <div className="text-xs font-mono text-muted mt-1.5">
              Session {session} Complete
            </div>
          </div>
        )}

        <ScoreCircle correct={masteredCount} total={total} />

        {/* Stats */}
        <div className="bg-card border border-border rounded-lg px-4 py-3.5 mb-3.5">
          <div className="text-[10px] font-mono uppercase tracking-wide text-muted mb-2.5">
            Session Stats
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Questions</span>
              <span className="text-[13px] font-semibold font-mono text-text">{total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Mastered</span>
              <span className="text-[13px] font-semibold font-mono text-accent/90">{masteredCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Missed</span>
              <span className={`text-[13px] font-semibold font-mono ${missedCount > 0 ? 'text-wrong/90' : 'text-muted'}`}>{missedCount}</span>
            </div>
            {hcwCount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">High-confidence wrong</span>
                <span className="text-[13px] font-semibold font-mono text-hcw/90">{hcwCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Per-topic breakdown */}
        <div className="bg-card border border-border rounded-lg px-4 py-3.5 mb-3.5">
          <div className="text-[10px] font-mono uppercase tracking-wide text-muted mb-2.5">
            By Topic
          </div>
          <div className="flex flex-col gap-2.5">
            {Object.entries(topicStats).map(([topic, { correct, total: tTotal }]) => {
              const pct = tTotal > 0 ? correct / tTotal : 0
              return (
                <div key={topic}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] font-mono text-text">{topic}</span>
                    <span className="text-[11px] font-mono text-muted">{correct}/{tTotal}</span>
                  </div>
                  <div className="h-[3px] bg-border rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm transition-[width] duration-300 ${
                        pct === 1 ? 'bg-accent' : pct >= 0.7 ? 'bg-accent/70' : 'bg-wrong/60'
                      }`}
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* What's next */}
        <div className="bg-card border border-border rounded-lg px-4 py-3 mb-5">
          <div className="text-[10px] font-mono uppercase tracking-wide text-muted mb-1.5">
            What's Next
          </div>
          <p className="m-0 text-[13px] text-text leading-normal">
            {nextPreview}
          </p>
        </div>

        <button
          onClick={isFinish ? onComplete : onNextSession}
          className="w-full py-2.5 px-4 rounded-[7px] border-none bg-accent text-btn-text font-mono font-bold text-[13px] cursor-pointer"
        >
          {isFinish ? 'FINISH →' : `START SESSION ${session + 1} →`}
        </button>

      </div>
    </div>
  )
}
