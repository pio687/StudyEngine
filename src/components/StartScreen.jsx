export default function StartScreen({
  config,
  questionCount,
  savedPracticeSession,
  savedStudySession,
  onStartPractice,
  onStartStudy,
  onResumePractice,
  onResumeStudy,
  theme,
  onToggleTheme,
}) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-5">
      <div className="w-full max-w-[620px]">

        {/* Logo */}
        <div className="mb-6">
          <div className="text-[11px] font-mono uppercase tracking-wide text-muted mb-1">
            {config.subject}
          </div>
          <div className="text-xl font-bold text-text mb-1.5">
            {config.emoji} {config.title}
          </div>
          <div className="text-[13px] text-muted leading-normal">
            {config.description}
          </div>
          <div className="text-[11px] font-mono text-border mt-1.5">
            {questionCount} questions
          </div>
        </div>

        {/* Mode buttons */}
        <div className="flex flex-col gap-2.5 mb-4">

          {/* Study */}
          <button
            onClick={savedStudySession ? onResumeStudy : onStartStudy}
            className="bg-transparent border-2 border-accent rounded-[10px] px-4 py-4 text-left cursor-pointer w-full transition-colors hover:bg-accent/[0.06]"
          >
            <div className="text-sm font-bold text-accent mb-0.5">
              📚 Mastery Mode
            </div>
            <div className="text-xs text-muted">
              {savedStudySession
                ? `Session ${savedStudySession.session} in progress — ${savedStudySession.tracker?.mastered?.length ?? 0} / ${savedStudySession.currentPool?.length ?? questionCount} answered · tap to resume`
                : 'Three-session spaced repetition with confidence tracking. Best for exam prep.'}
            </div>
          </button>

          {/* Practice */}
          <button
            onClick={savedPracticeSession ? onResumePractice : onStartPractice}
            className="bg-transparent border border-border rounded-[10px] px-4 py-4 text-left cursor-pointer w-full transition-colors hover:bg-white/[0.03]"
          >
            <div className="text-sm font-bold text-text mb-0.5">
              ⚡ Study Mode
            </div>
            <div className="text-xs text-muted">
              {savedPracticeSession
                ? `${savedPracticeSession.tracker?.mastered?.length ?? 0} / ${savedPracticeSession.currentPool?.length ?? questionCount} answered · tap to resume`
                : 'Quick review. One correct answer clears the question.'}
            </div>
          </button>
        </div>

        {/* Theme toggle */}
        <div className="text-center mb-3">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={theme === 'light'} onChange={onToggleTheme} className="w-[11px] h-[11px] accent-accent cursor-pointer" />
            <span className="text-[11px] font-mono text-muted">light mode</span>
          </label>
        </div>

        {/* Start over links */}
        {(savedStudySession || savedPracticeSession) && (
          <div className="text-center text-[11px] text-muted font-mono flex justify-center gap-4 flex-wrap">
            {savedPracticeSession && (
              <button onClick={onStartPractice} className="bg-transparent border-none p-0 text-[11px] font-mono text-muted cursor-pointer underline">restart study</button>
            )}
            {savedStudySession && (
              <button onClick={onStartStudy} className="bg-transparent border-none p-0 text-[11px] font-mono text-muted cursor-pointer underline">restart mastery</button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
