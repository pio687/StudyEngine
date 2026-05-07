export default function SessionIntro({ config, session, questionCount, onBegin }) {
  const isReview = session === 3

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-5">
      <div className="w-full max-w-[620px] text-center">

        {config && (
          <div className="mb-5">
            <div className="text-[10px] font-mono uppercase tracking-wide text-neutral mb-1">
              {config.subject}
            </div>
            <div className="text-lg font-bold text-text leading-tight">
              {config.title}
            </div>
          </div>
        )}

        <div className="text-[40px] mb-3">{isReview ? '🎯' : '📖'}</div>
        <div className="text-[11px] font-mono uppercase tracking-wide text-muted mb-2">
          Session {session} of 3
        </div>
        <div className="text-lg font-bold text-text mb-2">
          {isReview ? 'Review Round' : 'Fresh Questions'}
        </div>
        <div className="text-[13px] text-muted leading-normal mb-1.5">
          {isReview
            ? `${questionCount} missed question${questionCount === 1 ? '' : 's'} from Sessions 1 & 2, sorted by priority.`
            : `The other half of the question bank — ${questionCount} new questions.`}
        </div>
        <div className="text-xs text-border italic mb-6">
          {isReview
            ? 'High-confidence wrongs come first.'
            : 'Take your time — spacing between sessions helps retention.'}
        </div>

        <button
          onClick={onBegin}
          className="px-6 py-2.5 rounded-[7px] border-none bg-accent text-btn-text font-mono font-bold text-[13px] cursor-pointer"
        >
          BEGIN SESSION →
        </button>

      </div>
    </div>
  )
}
