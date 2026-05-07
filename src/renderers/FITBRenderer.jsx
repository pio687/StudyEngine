import { useState } from 'react'

export default function FITBRenderer({ question, onSubmit }) {
  const [value, setValue] = useState('')

  function handleChange(e) {
    const v = e.target.value
    setValue(v)
    if (v.trim()) onSubmit(v.trim())
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="Type your answer…"
      aria-label="Your answer"
      autoFocus
      className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-border rounded-[7px] text-text font-mono text-[15px] outline-none transition-colors focus:border-neutral"
    />
  )
}
