import { useState, useEffect } from 'react'
import MCRenderer from '../renderers/MCRenderer'
import TFRenderer from '../renderers/TFRenderer'
import FITBRenderer from '../renderers/FITBRenderer'
import DefRenderer from '../renderers/DefRenderer'
import OrderRenderer from '../renderers/OrderRenderer'
import MatchRenderer from '../renderers/MatchRenderer'
import CalcRenderer from '../renderers/CalcRenderer'
import ConfidenceRating from './ConfidenceRating'

function checkAnswer(question, userAnswer) {
  switch (question.type) {
    case 'mc':
    case 'def':
      return userAnswer === question.answer
    case 'tf':
      return userAnswer === question.answer
    case 'fitb':
      return question.accepted.some(a => a.toLowerCase() === userAnswer.toLowerCase())
    case 'ordering':
      return userAnswer.every((origIdx, pos) => origIdx === pos)
    case 'match':
      return userAnswer.every((descIdx, termIdx) => descIdx === termIdx)
    case 'calc':
      return Math.abs(userAnswer - question.answer) <= question.tolerance
    default:
      return false
  }
}

function getRenderer(question, onSubmit) {
  const props = { question, onSubmit }
  switch (question.type) {
    case 'mc':       return <MCRenderer    {...props} />
    case 'tf':       return <TFRenderer    {...props} />
    case 'fitb':     return <FITBRenderer  {...props} />
    case 'def':      return <DefRenderer   {...props} />
    case 'ordering': return <OrderRenderer {...props} />
    case 'match':    return <MatchRenderer {...props} />
    case 'calc':     return <CalcRenderer  {...props} />
    default:
      return <p className="text-[13px] text-muted italic">Unknown type: {question.type}</p>
  }
}

export default function QuestionCard({ question, mode, onAnswer, onCanSubmitChange, submitTrigger }) {
  const [userAnswer, setUserAnswer] = useState(null)
  const [confidence, setConfidence] = useState(null)

  const isStudy = mode === 'study'
  const hasAnswer = userAnswer !== null && userAnswer !== ''
  const canSubmit = isStudy ? (hasAnswer && confidence !== null) : hasAnswer

  useEffect(() => {
    onCanSubmitChange?.(canSubmit)
  }, [canSubmit])

  useEffect(() => {
    if (submitTrigger > 0) handleSubmit()
  }, [submitTrigger])

  function handleRendererSubmit(answer) {
    setUserAnswer(answer)
  }

  function handleSubmit() {
    if (!canSubmit) return
    const isCorrect = checkAnswer(question, userAnswer)
    onAnswer(isCorrect, isStudy ? confidence : null, {
      question,
      userAnswer,
      isCorrect,
      confidence: isStudy ? confidence : null,
    })
  }

  return (
    <div className="bg-card border border-border rounded-[10px] px-5 pt-5 pb-4 mb-3">
      {/* Topic tag + difficulty */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[10px] font-mono uppercase tracking-wide bg-neutral/10 border border-neutral/25 rounded px-1.5 py-0.5 text-neutral">
          {question.topic}
        </span>
        <span className="text-[11px] text-border tracking-wider" aria-label={`Difficulty ${question.difficulty} of 3`}>
          {'★'.repeat(question.difficulty)}{'☆'.repeat(3 - question.difficulty)}
        </span>
      </div>

      {/* Question text */}
      <p className="text-[15px] text-text leading-relaxed m-0 mb-4">
        {question.question}
      </p>

      {/* Renderer */}
      {getRenderer(question, handleRendererSubmit)}

      {/* Study mode: confidence rating */}
      {isStudy && (
        <div className="border-t border-border mt-3.5 pt-0.5">
          <ConfidenceRating
            disabled={!hasAnswer}
            selected={confidence}
            onRate={setConfidence}
          />
        </div>
      )}

    </div>
  )
}
