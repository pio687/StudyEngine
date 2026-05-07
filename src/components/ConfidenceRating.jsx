export default function ConfidenceRating({ onRate, disabled, selected }) {
  return (
    <div className="mt-3.5">
      <div className={`text-[11px] font-mono uppercase tracking-wide text-center mb-2.5 transition-colors ${disabled ? 'text-border' : 'text-muted'}`}>
        How confident were you?
      </div>
      <div className="flex gap-2">
        {[
          { key: 'unsure',  label: 'Unsure',  emoji: '🟡' },
          { key: 'know_it', label: 'Know it', emoji: '🟢' },
        ].map(({ key, label, emoji }) => {
          const isSelected = selected === key
          return (
            <button
              key={key}
              onClick={() => !disabled && onRate(key)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`flex-1 py-2.5 px-3.5 rounded-[7px] text-[13px] flex items-center justify-center gap-1.5 transition-all ${
                disabled ? 'cursor-not-allowed' : 'cursor-pointer'
              } ${
                isSelected
                  ? 'border border-accent bg-accent/10 text-accent'
                  : 'border border-border bg-transparent'
              } ${
                disabled && !isSelected ? 'text-border' : !isSelected ? 'text-muted' : ''
              }`}
            >
              {emoji} {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
