import { useState } from 'react'

export default function CalcRenderer({ question, onSubmit }) {
  const [value, setValue] = useState('')

  function handleChange(e) {
    const v = e.target.value
    setValue(v)
    const num = parseFloat(v)
    if (!isNaN(num)) onSubmit(num)
  }

  return (
    <div className="flex gap-2 items-center">
      <input
        type="number"
        value={value}
        onChange={handleChange}
        placeholder="Enter answer…"
        aria-label={`Your answer${question.unit ? ` in ${question.unit}` : ''}`}
        autoFocus
        className="flex-1 px-3.5 py-2.5 bg-white/[0.04] border border-border rounded-[7px] text-text font-mono text-[17px] outline-none transition-colors focus:border-neutral"
      />
      {question.unit && (
        <span className="text-sm text-muted font-mono shrink-0">{question.unit}</span>
      )}
    </div>
  )
}
