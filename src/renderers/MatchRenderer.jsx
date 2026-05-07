import { useState } from 'react'

export default function MatchRenderer({ question, onSubmit }) {
  const n = question.pairs.length
  const [descOrder] = useState(question.initialDescOrder)
  const [userPairings, setUserPairings] = useState(new Map())
  const [selectedTerm, setSelectedTerm] = useState(null)
  const [selectedDesc, setSelectedDesc] = useState(null)

  const usedDescs = new Set(userPairings.values())
  const pairedTerms = new Set(userPairings.keys())

  function handleTermClick(termIndex) {
    if (selectedTerm === termIndex) { setSelectedTerm(null); return }
    setSelectedTerm(termIndex)
    if (selectedDesc !== null) completePair(termIndex, selectedDesc)
  }

  function handleDescClick(descIndex) {
    if (selectedDesc === descIndex) { setSelectedDesc(null); return }
    setSelectedDesc(descIndex)
    if (selectedTerm !== null) completePair(selectedTerm, descIndex)
  }

  function completePair(termIndex, descIndex) {
    setUserPairings(prev => {
      const next = new Map(prev)
      for (const [t, d] of next) { if (d === descIndex) next.delete(t) }
      next.set(termIndex, descIndex)
      if (next.size === n) {
        const pairings = Array.from({ length: n }, (_, i) => next.get(i))
        onSubmit(pairings)
      }
      return next
    })
    setSelectedTerm(null)
    setSelectedDesc(null)
  }

  function unpair(termIndex) {
    setUserPairings(prev => { const next = new Map(prev); next.delete(termIndex); return next })
  }

  function cellClass(isSelected, isPaired) {
    const base = 'px-2.5 py-2.5 rounded-lg text-[13px] w-full text-left min-h-[44px] min-w-0 break-words transition-all cursor-pointer'
    if (isSelected) return `${base} border border-neutral bg-neutral/10 text-neutral`
    if (isPaired) return `${base} border border-neutral/35 bg-neutral/[0.05] text-neutral`
    return `${base} border border-border bg-transparent text-text`
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-x-1.5 gap-y-1 mb-0.5">
        <span className="text-[10px] font-mono text-muted text-center uppercase tracking-wide">Term</span>
        <span className="text-[10px] font-mono text-muted text-center uppercase tracking-wide">Description</span>
      </div>
      {question.pairs.map((pair, termIndex) => {
        const descIndex = descOrder[termIndex]
        return (
          <div key={termIndex} className="grid grid-cols-2 gap-1.5 items-center">
            <button className={cellClass(selectedTerm === termIndex, pairedTerms.has(termIndex))} onClick={() => handleTermClick(termIndex)} aria-label={`Term: ${pair.term}`} aria-pressed={selectedTerm === termIndex}>
              {pair.term}
              {pairedTerms.has(termIndex) && (
                <span onClick={e => { e.stopPropagation(); unpair(termIndex) }} role="button" aria-label={`Unpair ${pair.term}`} className="ml-1.5 text-border text-xs">×</span>
              )}
            </button>
            <button className={cellClass(selectedDesc === descIndex, usedDescs.has(descIndex))} onClick={() => handleDescClick(descIndex)} aria-label={`Description: ${question.pairs[descIndex].desc}`} aria-pressed={selectedDesc === descIndex}>
              {question.pairs[descIndex].desc}
            </button>
          </div>
        )
      })}
      <div className="text-[11px] font-mono text-muted mt-0.5">
        {userPairings.size}/{n} paired
      </div>
    </div>
  )
}
