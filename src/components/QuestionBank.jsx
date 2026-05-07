import { useState, useMemo } from 'react'

const TYPE_LABELS = {
  mc: 'MC', tf: 'TF', fitb: 'FITB', def: 'DEF',
  ordering: 'ORDER', match: 'MATCH', calc: 'CALC',
}

const TYPE_COLORS = {
  mc:       { bg: 'rgba(88,166,255,0.12)',  border: 'rgba(88,166,255,0.35)',  text: 'rgba(88,166,255,0.9)'  },
  tf:       { bg: 'rgba(180,100,255,0.12)', border: 'rgba(180,100,255,0.4)',  text: 'rgba(180,100,255,0.9)' },
  fitb:     { bg: 'rgba(255,140,0,0.12)',   border: 'rgba(255,140,0,0.35)',   text: 'rgba(255,140,0,0.85)'  },
  def:      { bg: 'rgba(72,200,130,0.1)',   border: 'rgba(72,200,130,0.3)',   text: 'rgba(72,200,130,0.85)' },
  ordering: { bg: 'rgba(248,81,73,0.1)',    border: 'rgba(248,81,73,0.3)',    text: 'rgba(248,81,73,0.85)'  },
  match:    { bg: 'rgba(255,200,0,0.1)',    border: 'rgba(255,200,0,0.3)',    text: 'rgba(255,200,0,0.85)'  },
  calc:     { bg: 'rgba(200,160,45,0.12)',  border: 'rgba(200,160,45,0.35)', text: 'rgba(200,160,45,0.9)'  },
}

const DIFFICULTY_COLORS = {
  1: { bg: 'rgba(63,185,80,0.12)',  border: 'rgba(63,185,80,0.35)',  text: 'rgba(63,185,80,0.9)'  },
  2: { bg: 'rgba(227,179,65,0.12)', border: 'rgba(227,179,65,0.35)', text: 'rgba(227,179,65,0.9)' },
  3: { bg: 'rgba(248,81,73,0.12)',  border: 'rgba(248,81,73,0.35)',  text: 'rgba(248,81,73,0.9)'  },
}

function AnswerBlock({ question }) {
  switch (question.type) {
    case 'mc':
    case 'def':
      return (
        <div className="flex flex-col gap-0.5 mt-2">
          {question.options.map((opt, i) => (
            <div key={i} className={`text-xs leading-snug ${i === question.answer ? 'text-accent/90 font-semibold' : 'text-muted'}`}>
              {i === question.answer ? '✓ ' : '  '}{opt}
            </div>
          ))}
        </div>
      )
    case 'tf':
      return (
        <div className="mt-2 text-xs font-semibold text-accent/90">
          ✓ {question.answer ? 'True' : 'False'}
        </div>
      )
    case 'fitb':
      return (
        <div className="mt-2 text-xs text-accent/[0.85]">
          Accepted: {question.accepted.join(', ')}
        </div>
      )
    case 'ordering':
      return (
        <div className="flex flex-col gap-0.5 mt-2">
          {question.correctOrder.map((item, i) => (
            <div key={i} className="text-xs text-accent/[0.85]">
              {i + 1}. {item}
            </div>
          ))}
        </div>
      )
    case 'match':
      return (
        <div className="flex flex-col gap-0.5 mt-2">
          {question.pairs.map((pair, i) => (
            <div key={i} className="text-xs text-accent/[0.85]">
              {pair.term} → {pair.desc}
            </div>
          ))}
        </div>
      )
    case 'calc':
      return (
        <div className="mt-2 text-xs text-accent/[0.85]">
          {question.answer}{question.unit ? ` ${question.unit}` : ''}{question.tolerance > 0 ? ` (±${question.tolerance})` : ''}
        </div>
      )
    default:
      return null
  }
}

function BankCard({ question }) {
  const [showAnswer, setShowAnswer] = useState(false)
  const tc = TYPE_COLORS[question.type] ?? TYPE_COLORS.mc

  return (
    <div className="bg-card border border-border rounded-lg px-3.5 py-3">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wide rounded px-1.5 py-0.5" style={{ background: tc.bg, border: `1px solid ${tc.border}`, color: tc.text }}>
          {TYPE_LABELS[question.type] ?? question.type}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wide bg-neutral/10 border border-neutral/25 rounded px-1.5 py-0.5 text-neutral">
          {question.topic}
        </span>
        <span className="text-[11px] text-border tracking-wider" aria-label={`Difficulty ${question.difficulty} of 3`}>
          {'★'.repeat(question.difficulty)}{'☆'.repeat(3 - question.difficulty)}
        </span>
      </div>

      <p className="m-0 text-[13px] text-text leading-snug">
        {question.question}
      </p>

      <button
        onClick={() => setShowAnswer(!showAnswer)}
        className="bg-transparent border-none py-1.5 px-1 mt-1.5 font-mono text-[11px] text-muted cursor-pointer underline"
      >
        {showAnswer ? 'hide answer' : 'show answer'}
      </button>

      {showAnswer && (
        <>
          <AnswerBlock question={question} />
          {question.explanation && (
            <p className="mt-2 mb-0 text-xs leading-normal italic text-accent/[0.65]">
              {question.explanation}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function QuestionBank({ config, questions, onBack }) {
  const [selectedTopics, setSelectedTopics] = useState([])
  const [selectedTypes,  setSelectedTypes]  = useState([])
  const [selectedDifficulties, setSelectedDifficulties] = useState([])
  const [search, setSearch] = useState('')

  const topics = useMemo(() => [...new Set(questions.map(q => q.topic))].sort(), [questions])
  const types  = useMemo(() => [...new Set(questions.map(q => q.type))],         [questions])

  const stats = useMemo(() => {
    const byDifficulty = { 1: 0, 2: 0, 3: 0 }
    const byTopic = {}
    for (const q of questions) {
      byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1
      byTopic[q.topic] = (byTopic[q.topic] || 0) + 1
    }
    return { byDifficulty, byTopic }
  }, [questions])

  const filtered = useMemo(() => questions.filter(q => {
    if (selectedTopics.length > 0 && !selectedTopics.includes(q.topic)) return false
    if (selectedTypes.length  > 0 && !selectedTypes.includes(q.type))   return false
    if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(q.difficulty)) return false
    if (search && !q.question.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [questions, selectedTopics, selectedTypes, selectedDifficulties, search])

  function toggleTopic(topic) {
    setSelectedTopics(prev => prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic])
  }

  function toggleType(type) {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  function toggleDifficulty(level) {
    setSelectedDifficulties(prev => prev.includes(level) ? prev.filter(d => d !== level) : [...prev, level])
  }

  const topicEntries = Object.entries(stats.byTopic).sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[700px] mx-auto px-4 pt-4 pb-10">

        <button onClick={onBack} className="bg-transparent border-none py-2 px-1 font-mono text-xs text-muted cursor-pointer underline">← Back</button>

        {config && (
          <div className="mt-2.5 mb-4">
            <div className="text-[10px] font-mono uppercase tracking-wide text-neutral mb-0.5">
              {config.subject}
            </div>
            <div className="text-xl font-bold text-text leading-tight">
              {config.title}
            </div>
            <div className="text-[11px] font-mono text-muted mt-1">
              {questions.length} questions · {topics.length} topics · {types.length} types
            </div>
          </div>
        )}

        {/* Stats summary */}
        <div className="bg-card border border-border rounded-lg px-4 py-3.5 mb-3">
          <div className="text-[10px] font-mono uppercase tracking-wide text-muted mb-2.5">
            Exam Overview
          </div>

          {/* Difficulty distribution bar */}
          <div className="h-1.5 rounded-sm overflow-hidden flex mb-2">
            {[1, 2, 3].map(level => {
              const count = stats.byDifficulty[level] || 0
              if (count === 0) return null
              const dc = DIFFICULTY_COLORS[level]
              return <div key={level} className="h-full" style={{ width: `${(count / questions.length) * 100}%`, background: dc.text }} />
            })}
          </div>

          {/* Difficulty legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3.5">
            {[
              { level: 1, label: 'Easy' },
              { level: 2, label: 'Medium' },
              { level: 3, label: 'Hard' },
            ].map(({ level, label }) => {
              const dc = DIFFICULTY_COLORS[level]
              const count = stats.byDifficulty[level] || 0
              return (
                <div key={level} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{ background: dc.text }} />
                  <span className="text-[11px] font-mono text-muted">{label} {count}</span>
                </div>
              )
            })}
          </div>

          {/* Topic breakdown */}
          <div className="text-[10px] font-mono uppercase tracking-wide text-muted mb-2">
            By Topic
          </div>
          <div className="flex flex-col gap-2">
            {topicEntries.map(([topic, count]) => (
              <div key={topic}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[11px] font-mono text-text">{topic}</span>
                  <span className="text-[11px] font-mono text-muted">{count}</span>
                </div>
                <div className="h-[3px] bg-border rounded-sm overflow-hidden">
                  <div className="h-full rounded-sm bg-neutral/50" style={{ width: `${(count / questions.length) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg px-3.5 py-3 mb-4">

          <input
            type="text"
            placeholder="Search questions..."
            aria-label="Search questions"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg border border-border rounded-md px-2.5 py-[7px] font-mono text-xs text-text outline-none mb-2.5"
          />

          {/* Type pills */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {types.map(type => {
              const active = selectedTypes.includes(type)
              const tc = TYPE_COLORS[type] ?? TYPE_COLORS.mc
              return (
                <button key={type} onClick={() => toggleType(type)} className="text-[10px] font-mono font-bold uppercase tracking-wide rounded px-2.5 py-1 cursor-pointer transition-all" style={{
                  border: `1px solid ${active ? tc.border : 'var(--border)'}`,
                  background: active ? tc.bg : 'transparent',
                  color: active ? tc.text : 'var(--muted)',
                }}>
                  {TYPE_LABELS[type] ?? type}
                </button>
              )
            })}
          </div>

          {/* Difficulty pills */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[1, 2, 3].map(level => {
              const active = selectedDifficulties.includes(level)
              const dc = DIFFICULTY_COLORS[level]
              const label = ['', 'Easy', 'Medium', 'Hard'][level]
              return (
                <button key={level} onClick={() => toggleDifficulty(level)} className="text-[10px] font-mono font-bold uppercase tracking-wide rounded px-2.5 py-1 cursor-pointer transition-all" style={{
                  border: `1px solid ${active ? dc.border : 'var(--border)'}`,
                  background: active ? dc.bg : 'transparent',
                  color: active ? dc.text : 'var(--muted)',
                }}>
                  {'★'.repeat(level)}{'☆'.repeat(3 - level)} {label}
                </button>
              )
            })}
          </div>

          {/* Topic pills */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {topics.map(topic => {
              const active = selectedTopics.includes(topic)
              return (
                <button key={topic} onClick={() => toggleTopic(topic)} className={`text-[10px] font-mono uppercase tracking-wide rounded px-2.5 py-1 cursor-pointer transition-all ${
                  active
                    ? 'border border-neutral/50 bg-neutral/[0.12] text-neutral'
                    : 'border border-border bg-transparent text-muted'
                }`}>
                  {topic}
                </button>
              )
            })}
          </div>

          <div className="text-[11px] font-mono text-muted">
            Showing {filtered.length} of {questions.length}
          </div>
        </div>

        {/* Question list */}
        <div className="flex flex-col gap-2">
          {filtered.map(q => <BankCard key={q.id} question={q} />)}
        </div>

      </div>
    </div>
  )
}
