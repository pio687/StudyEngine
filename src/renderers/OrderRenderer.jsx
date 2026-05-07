import { useState, useEffect, useRef } from 'react'

export default function OrderRenderer({ question, onSubmit }) {
  const [order, setOrder] = useState(question.initialOrder)
  const itemRefs = useRef([])

  useEffect(() => { onSubmit(question.initialOrder) }, [])

  function moveUp(pos) {
    if (pos === 0) return
    const next = [...order];
    [next[pos - 1], next[pos]] = [next[pos], next[pos - 1]]
    setOrder(next)
    onSubmit(next)
    requestAnimationFrame(() => itemRefs.current[pos - 1]?.focus())
  }

  function moveDown(pos) {
    if (pos === order.length - 1) return
    const next = [...order];
    [next[pos], next[pos + 1]] = [next[pos + 1], next[pos]]
    setOrder(next)
    onSubmit(next)
    requestAnimationFrame(() => itemRefs.current[pos + 1]?.focus())
  }

  function handleKeyDown(e, pos) {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveUp(pos)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveDown(pos)
    }
  }

  return (
    <div className="flex flex-col gap-1.5" role="listbox" aria-label="Reorder items using arrow keys">
      {order.map((originalIndex, pos) => (
        <div
          key={originalIndex}
          ref={el => itemRefs.current[pos] = el}
          tabIndex={0}
          role="option"
          aria-label={`Position ${pos + 1}: ${question.correctOrder[originalIndex]}. Use arrow keys to reorder.`}
          onKeyDown={e => handleKeyDown(e, pos)}
          className="flex items-center gap-2 px-3.5 py-3 rounded-lg border border-border bg-transparent text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <span className="w-5 h-5 rounded-full bg-neutral text-btn-text flex items-center justify-center text-[11px] font-bold font-mono shrink-0">
            {pos + 1}
          </span>
          <span className="flex-1">{question.correctOrder[originalIndex]}</span>
          <div className="flex flex-col shrink-0">
            <button onClick={() => moveUp(pos)} disabled={pos === 0} aria-label={`Move "${question.correctOrder[originalIndex]}" up`} tabIndex={-1} className={`bg-transparent border-none text-sm px-2.5 py-1.5 leading-none ${pos === 0 ? 'text-border cursor-not-allowed' : 'text-muted cursor-pointer'}`}>▲</button>
            <button onClick={() => moveDown(pos)} disabled={pos === order.length - 1} aria-label={`Move "${question.correctOrder[originalIndex]}" down`} tabIndex={-1} className={`bg-transparent border-none text-sm px-2.5 py-1.5 leading-none ${pos === order.length - 1 ? 'text-border cursor-not-allowed' : 'text-muted cursor-pointer'}`}>▼</button>
          </div>
        </div>
      ))}
    </div>
  )
}
