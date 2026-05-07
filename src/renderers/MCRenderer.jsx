import { useState } from 'react'

export default function MCRenderer({ question, onSubmit }) {
  const [selectedIndex, setSelectedIndex] = useState(null)

  function handleSelect(index) {
    setSelectedIndex(index)
    onSubmit(index)
  }

  return (
    <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Answer options">
      {question.options.map((option, index) => {
        const sel = index === selectedIndex
        return (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            role="radio"
            aria-checked={sel}
            className={`flex items-center gap-2.5 w-full text-left px-3.5 py-3 rounded-lg text-sm transition-all cursor-pointer ${
              sel
                ? 'border border-neutral bg-neutral/[0.08] text-neutral'
                : 'border border-border bg-transparent text-text'
            }`}
          >
            <div className={`w-[13px] h-[13px] rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold transition-all ${
              sel
                ? 'border-2 border-neutral bg-neutral text-btn-text'
                : 'border-2 border-border bg-transparent'
            }`}>
              {sel ? '✓' : ''}
            </div>
            {option}
          </button>
        )
      })}
    </div>
  )
}
