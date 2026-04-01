import {
  WIN_EMOJI,
  WIN_PERFECT_TITLE,
  WIN_PERFECT_SUBTITLE,
  WIN_TITLE,
  WIN_SUBTITLE,
} from "../engineLogic.js";

export default function WinScreen({
  s,
  QUIZ_SUBJECT,
  renderMasteryBars,
  T,
  isPerfect,
  missedQs,
  getAnswerDisplay,
  resetAll,
  goToBank,
}) {
  return (
    <div style={s.app}>
      <div style={s.wrap}>
        <div style={s.logo}>
          <div style={s.logoTop}>{QUIZ_SUBJECT}</div>
        </div>
        {renderMasteryBars()}
        <div style={s.card}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {isPerfect ? WIN_EMOJI : "🎉"}
            </div>
            {isPerfect ? (
              <>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: T.accent,
                    marginBottom: 8,
                  }}
                >
                  {WIN_PERFECT_TITLE}
                </div>
                <div style={{ fontSize: 14, color: T.muted }}>
                  {WIN_PERFECT_SUBTITLE}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: T.accent,
                    marginBottom: 8,
                  }}
                >
                  {WIN_TITLE}
                </div>
                <div style={{ fontSize: 14, color: T.muted }}>
                  {WIN_SUBTITLE}
                </div>
              </>
            )}
          </div>
          {!isPerfect &&
            missedQs.map(({ q, count }) => {
              const { ca } = getAnswerDisplay(q, null);
              return (
                <div
                  key={q.id}
                  style={{ ...s.resultItem(false), marginBottom: 8 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: T.text,
                        lineHeight: 1.5,
                        flex: 1,
                      }}
                    >
                      {q.question.split("\n")[0]}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: "monospace",
                        color: T.wrong,
                        flexShrink: 0,
                      }}
                    >
                      missed {count}x
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: T.accent, marginBottom: 4 }}>
                    ✓ {ca}
                  </div>
                  <div style={{ fontSize: 12, color: T.yellow, lineHeight: 1.5 }}>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          <button
            style={{ ...s.btn(true, false), width: "100%", padding: "12px", fontFamily: "monospace" }}
            onClick={resetAll}
          >
            START OVER
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={s.resetLink} onClick={goToBank}>
            question bank
          </span>
        </div>
      </div>
    </div>
  );
}
