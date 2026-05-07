import { useState } from 'react'

export default function TFRenderer({ question, onSubmit }) {
  const [selected, setSelected] = useState(null)

  function handleSelect(value) {
    setSelected(value)
    onSubmit(value)
  }

  function btnClass(value) {
    const sel = value === selected
    return `flex-1 py-3 rounded-[7px] text-sm font-semibold tracking-wide transition-all cursor-pointer ${
      sel
        ? 'border border-neutral bg-neutral/[0.08] text-neutral'
        : 'border border-border bg-transparent text-text'
    }`
  }

  return (
    <div className="flex gap-2" role="radiogroup" aria-label="True or False">
      <button className={btnClass(true)}  onClick={() => handleSelect(true)}  role="radio" aria-checked={selected === true}>TRUE</button>
      <button className={btnClass(false)} onClick={() => handleSelect(false)} role="radio" aria-checked={selected === false}>FALSE</button>
    </div>
  )
}
