export default function ProgressBar({ progress, masteryStats }) {
  const { answered, total, answeredInRound, roundSize } = progress

  const correctPct  = total     > 0 ? (answered            / total)     * 100 : 0
  const roundPct    = roundSize > 0 ? ((answeredInRound + 1) / roundSize) * 100 : 0

  const bankTotal   = masteryStats?.total ?? 1
  const masteredPct = bankTotal > 0 ? ((masteryStats?.mastered ?? 0) / bankTotal) * 100 : 0
  const missedPct   = bankTotal > 0 ? ((masteryStats?.missed   ?? 0) / bankTotal) * 100 : 0

  return (
    <div className="mb-3.5">

      {/* Mastery bar — full bank, green from left / red from right */}
      {masteryStats && (
        <div className="mb-2.5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] font-mono text-accent/80">
              {masteryStats.mastered} correct in this session
            </span>
            <span className="text-[11px] font-mono text-wrong/75">
              {masteryStats.missed} missed
            </span>
          </div>
          <div className="h-1.5 bg-border rounded-sm overflow-hidden relative" role="progressbar" aria-label="Session mastery" aria-valuenow={masteryStats.mastered} aria-valuemin={0} aria-valuemax={bankTotal}>
            <div className="absolute left-0 top-0 bottom-0 rounded-sm transition-[width] duration-300 bg-accent/70" style={{ width: `${masteredPct}%` }} />
            <div className="absolute right-0 top-0 bottom-0 rounded-sm transition-[width] duration-300 bg-wrong/60" style={{ width: `${missedPct}%` }} />
          </div>
        </div>
      )}

      {/* Correct bar — session-scoped */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] font-mono text-muted">Total correct</span>
        <span className="text-[11px] font-mono text-muted">{answered}/{total}</span>
      </div>
      <div className="h-1 bg-border rounded-sm overflow-hidden" role="progressbar" aria-label="Total correct" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={total}>
        <div className="h-full rounded-sm transition-[width] duration-300 bg-gold/90" style={{ width: `${correctPct}%` }} />
      </div>

      {/* Round progress bar */}
      <div className="flex items-center gap-2 mt-2.5">
        <div className="h-0.5 bg-border rounded-sm overflow-hidden flex-1">
          <div className="h-full bg-accent rounded-[1px] transition-[width] duration-300" style={{ width: `${roundPct}%` }} />
        </div>
        <span className="text-[11px] font-mono text-muted shrink-0" aria-live="polite">Q{answeredInRound + 1}/{roundSize}</span>
      </div>

    </div>
  )
}
