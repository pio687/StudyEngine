import {
  WIN_EMOJI,
  WIN_PERFECT_TITLE,
  WIN_PERFECT_SUBTITLE,
  WIN_TITLE,
  WIN_SUBTITLE,
} from "../engineLogic.js";
import { getAnswerDisplay } from "../utils/answerDisplay.js";
import MasteryBars from "./MasteryBars.jsx";
import shared from "./Shared.module.css";
import styles from "./WinScreen.module.css";

export default function WinScreen({
  QUIZ_SUBJECT,
  isPerfect,
  missedQs,
  resetAll,
  goToBank,
  mode,
  deck,
  currentView,
  totalCount,
  masteredCount,
}) {
  return (
    <div className={shared.app}>
      <div className={shared.wrap}>
        <div className={shared.logo}>
          <div className={shared.logoTop}>{QUIZ_SUBJECT}</div>
        </div>
        <MasteryBars mode={mode} deck={deck} currentView={currentView} totalCount={totalCount} masteredCount={masteredCount} />
        <div className={styles.card}>
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
                    color: "var(--accent)",
                    marginBottom: 8,
                  }}
                >
                  {WIN_PERFECT_TITLE}
                </div>
                <div style={{ fontSize: 14, color: "var(--muted)" }}>
                  {WIN_PERFECT_SUBTITLE}
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--accent)",
                    marginBottom: 8,
                  }}
                >
                  {WIN_TITLE}
                </div>
                <div style={{ fontSize: 14, color: "var(--muted)" }}>
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
                  className={styles.resultItemWrong}
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
                        color: "var(--text)",
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
                        color: "var(--wrong)",
                        flexShrink: 0,
                      }}
                    >
                      missed {count}x
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 4 }}>
                    ✓ {ca}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--yellow)", lineHeight: 1.5 }}>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            style={{ width: "100%", padding: "12px" }}
            onClick={resetAll}
          >
            START OVER
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span className={styles.resetLink} onClick={goToBank}>
            📚 question bank
          </span>
        </div>
      </div>
    </div>
  );
}
