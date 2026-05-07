function formatUserAnswer(question, userAnswer) {
  switch (question.type) {
    case 'mc': case 'def': return question.options[userAnswer] ?? String(userAnswer)
    case 'tf':             return userAnswer ? 'True' : 'False'
    case 'fitb':           return String(userAnswer)
    case 'ordering':       return userAnswer.map(i => question.correctOrder[i]).join(' → ')
    case 'match':          return userAnswer.map((descIdx, termIdx) => `${question.pairs[termIdx].term} → ${question.pairs[descIdx].desc}`).join(', ')
    case 'calc':           return String(userAnswer) + (question.unit ? ` ${question.unit}` : '')
    default:               return String(userAnswer)
  }
}

function formatCorrectAnswer(question) {
  switch (question.type) {
    case 'mc': case 'def': return question.options[question.answer]
    case 'tf':             return question.answer ? 'True' : 'False'
    case 'fitb':           return question.accepted.join(' / ')
    case 'ordering':       return question.correctOrder.join(' → ')
    case 'match':          return question.pairs.map(p => `${p.term} → ${p.desc}`).join(', ')
    case 'calc':           return String(question.answer) + (question.unit ? ` ${question.unit}` : '') + (question.tolerance > 0 ? ` (±${question.tolerance})` : '')
    default:               return ''
  }
}

function ScoreCircle({ correct, total }) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const radius = 48
  const stroke = 6
  const normalizedR = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedR
  const offset = circumference * (1 - pct / 100)

  const message = correct === total
    ? 'Perfect round!'
    : pct >= 70
      ? 'Great work!'
      : 'Keep studying!'

  const ringColor = pct >= 70 ? 'var(--accent)' : 'var(--wrong)'

  return (
    <div className="flex flex-col items-center mb-6 -mt-2.5">
      <div className="text-[11px] font-mono uppercase tracking-wide text-muted mb-3.5">
        Round Results
      </div>
      <svg width={radius * 2} height={radius * 2} role="img" aria-label={`Score: ${correct} out of ${total}, ${pct} percent`} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={radius} cy={radius} r={normalizedR}
          fill="none" stroke="var(--border)" strokeWidth={stroke}
        />
        <circle
          cx={radius} cy={radius} r={normalizedR}
          fill="none" stroke={ringColor} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="flex flex-col items-center justify-center pointer-events-none" style={{ marginTop: -(radius * 2), height: radius * 2 }}>
        <span className="text-[26px] font-bold text-text leading-none">{pct}%</span>
        <span className="text-xs text-muted font-mono mt-0.5">{correct}/{total}</span>
      </div>
      <div className="mt-2.5 text-[13px] font-semibold text-text">{message}</div>
    </div>
  )
}

function ResultCard({ result }) {
  const { question, userAnswer, isCorrect, confidence } = result
  const isHCW = !isCorrect && confidence === 'know_it'

  return (
    <div
      className={`bg-card rounded-lg px-3.5 py-3 border border-l-[3px] ${
        isCorrect ? 'border-border border-l-accent/70' : 'border-wrong/25 border-l-wrong/70'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-2">
        <span className={`text-sm font-bold shrink-0 mt-px ${isCorrect ? 'text-accent/90' : 'text-wrong/90'}`}>
          {isCorrect ? '✓' : '✗'}
        </span>
        <p className="m-0 text-[13px] text-text leading-snug flex-1">
          {question.question}
        </p>
      </div>

      {/* Wrong: user answer + correct answer + HCW */}
      {!isCorrect && (
        <div className="ml-6 mb-2 flex flex-col gap-0.5">
          {isHCW && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-mono font-bold rounded px-1.5 py-px tracking-wide bg-hcw/15 text-hcw/90 border border-hcw/30">
                HCW
              </span>
              <span className="text-[11px] font-mono text-hcw/80">
                High-confidence wrong — priority review
              </span>
            </div>
          )}
          <span className="text-xs text-muted">
            Your answer: <span className="text-wrong/90">{formatUserAnswer(question, userAnswer)}</span>
          </span>
          <span className="text-xs text-muted">
            Correct: <span className="text-accent/90">{formatCorrectAnswer(question)}</span>
          </span>
        </div>
      )}

      {/* Explanation */}
      <p className={`m-0 ml-6 text-xs leading-normal ${isCorrect ? 'text-accent/75' : 'text-muted'}`}>
        {question.explanation}
      </p>
    </div>
  )
}

export default function RoundSummary({ roundResults, sessionPhase, onNextRound, onViewSessionSummary }) {
  const correct = roundResults.filter(r => r.isCorrect).length
  const total = roundResults.length
  const isSessionDone = sessionPhase === 'session_review' || sessionPhase === 'complete'

  const correctResults = roundResults.filter(r => r.isCorrect)
  const wrongResults   = roundResults.filter(r => !r.isCorrect)
  const sorted = [...correctResults, ...wrongResults]

  return (
    <div className="min-h-screen bg-bg flex justify-center px-4 py-6">
      <div className="w-full max-w-[620px]">

        <ScoreCircle correct={correct} total={total} />

        <div className="flex flex-col gap-2 mb-5">
          {sorted.map((result) => (
            <ResultCard key={result.question.id} result={result} />
          ))}
        </div>

        <button
          onClick={isSessionDone ? onViewSessionSummary : onNextRound}
          className="w-full py-2.5 px-4 rounded-[7px] border-none bg-accent text-btn-text font-mono font-bold text-[13px] cursor-pointer"
        >
          {isSessionDone ? 'FINISH →' : 'NEXT ROUND →'}
        </button>

      </div>
    </div>
  )
}
