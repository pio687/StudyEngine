import { useState, useEffect } from 'react'
import QuestionCard from './QuestionCard'
import ProgressBar from './ProgressBar'
import RoundSummary from './RoundSummary'
import SessionSummary from './SessionSummary'
import SessionIntro from './SessionIntro'

export default function SessionScreen({ config, sessionState, currentQuestion, progress, masteryStats, roundHistory = [], onAnswer, onNextRound, onNextSession, onBeginSession, onStudyComplete, onResetProgress, onBack, onOpenQuestionBank, theme, onToggleTheme }) {
  const { phase, mode, session, roundResults, currentRound, currentQuestionIndex } = sessionState
  const question = currentQuestion

  const [canSubmit, setCanSubmit] = useState(false)
  const [submitTrigger, setSubmitTrigger] = useState(0)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    setShowResetConfirm(false)
  }, [question?.id])

  function handleNextClick() {
    if (!canSubmit) return
    setSubmitTrigger(t => t + 1)
  }

  if (phase === 'session_intro') {
    return (
      <SessionIntro
        config={config}
        session={session}
        questionCount={sessionState.currentPool.length}
        onBegin={onBeginSession}
      />
    )
  }

  if (phase === 'session_review') {
    return (
      <SessionSummary
        config={config}
        session={sessionState.session}
        tracker={sessionState.tracker}
        currentPool={sessionState.currentPool}
        sessionTrackers={sessionState.sessionTrackers}
        onNextSession={onNextSession}
        onComplete={onStudyComplete}
      />
    )
  }

  if (phase === 'round_review') {
    return (
      <RoundSummary
        roundResults={roundResults}
        sessionPhase={phase}
        onNextRound={onNextRound}
        onViewSessionSummary={onBack}
      />
    )
  }

  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-5">
        <div className="text-center">
          <div className="text-[40px] mb-3">🎉</div>
          <div className="text-lg font-bold text-text mb-2">
            {mode === 'practice' ? 'Study Complete!' : 'Mastery Complete!'}
          </div>
          <div className="text-[13px] text-muted mb-5">
            You mastered all {progress.total} questions.
          </div>
          <button onClick={onBack} className="px-5 py-2.5 rounded-[7px] border-none bg-accent text-btn-text font-mono font-bold text-[13px] cursor-pointer transition-all">← Back to Start</button>
        </div>
      </div>
    )
  }

  if (!question) return null

  const roundSize = currentRound?.length ?? 0

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[620px] mx-auto px-4 pt-3">

        {/* Session header */}
        {config && (
          <div className="mb-3.5 mt-2.5 text-center">
            <div className="text-[10px] font-mono uppercase tracking-wide text-neutral mb-1">
              {config.subject}
            </div>
            <div className="text-lg font-bold text-text leading-tight">
              {config.title}
            </div>
            {mode === 'study' && session && (
              <div className="text-[11px] font-mono text-muted mt-1">
                Session {session} of 3
              </div>
            )}
          </div>
        )}

        <ProgressBar progress={progress} masteryStats={masteryStats} />
        <QuestionCard
          key={question.id}
          question={question}
          mode={mode}
          onAnswer={onAnswer}
          onCanSubmitChange={setCanSubmit}
          submitTrigger={submitTrigger}
        />

        {/* Nav row */}
        <div className="mt-2.5 mb-2">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="px-4 py-2 rounded-[7px] border border-border bg-transparent text-text font-mono text-[13px] cursor-pointer">menu</button>

            <div className="flex gap-1.5 items-center" role="status" aria-label={`Question ${currentQuestionIndex + 1} of ${roundSize}`}>
              {Array.from({ length: roundSize }, (_, i) => {
                const isAnswered = i < currentQuestionIndex
                const isCurrent = i === currentQuestionIndex
                return (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all duration-150 ${
                    isCurrent
                      ? 'bg-accent'
                      : isAnswered
                        ? 'bg-neutral/45'
                        : 'bg-transparent border-[1.5px] border-border'
                  }`} />
                )
              })}
            </div>

            <button
              onClick={handleNextClick}
              disabled={!canSubmit}
              className={`px-4 py-2 rounded-[7px] border-none font-mono font-bold text-[13px] transition-all ${canSubmit ? 'bg-accent text-btn-text cursor-pointer' : 'bg-white/[0.08] text-border cursor-not-allowed'}`}
            >
              Next →
            </button>
          </div>

          {/* Utility links below nav */}
          <div className="flex justify-center gap-3 items-center mt-3">
            {showResetConfirm ? (
              <>
                <span className="font-mono text-[11px] text-muted py-1.5">Reset progress?</span>
                <button onClick={() => setShowResetConfirm(false)} className="bg-transparent border-none py-1.5 px-1 font-mono text-[11px] text-muted cursor-pointer underline">cancel</button>
                <button onClick={onResetProgress} className="bg-transparent border-none py-1.5 px-1 font-mono text-[11px] text-wrong cursor-pointer underline">reset</button>
              </>
            ) : (
              <>
                <button onClick={() => setShowResetConfirm(true)} className="bg-transparent border-none py-1.5 px-1 font-mono text-[11px] text-muted cursor-pointer underline">reset progress</button>
                <button onClick={onOpenQuestionBank} className="bg-transparent border-none py-1.5 px-1 font-mono text-[11px] text-muted cursor-pointer underline">question bank</button>
                <label className="flex items-center gap-1.5 cursor-pointer py-1.5 px-1">
                  <input type="checkbox" checked={theme === 'light'} onChange={onToggleTheme} className="w-[11px] h-[11px] accent-accent cursor-pointer" />
                  <span className="font-mono text-[11px] text-muted">light mode</span>
                </label>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
