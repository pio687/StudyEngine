import { useState } from "react";
import { getAnswerDisplay, getWrongAnswerDisplay } from "../utils/answerDisplay.js";
import MasteryBars from "./MasteryBars.jsx";
import shared from "./Shared.module.css";
import styles from "./ResultsScreen.module.css";

export default function ResultsScreen({
  QUIZ_SUBJECT,
  pct,
  score,
  total,
  questions,
  answers,
  checkCorrect,
  confidence,
  wrongQs,
  startNext,
  resetAll,
  goToBank,
  mode,
  deck,
  currentView,
  totalCount,
  masteredCount,
}) {
  const [copied, setCopied] = useState(false);

  function copyWrong() {
    const text = wrongQs
      .map((q, i) => {
        const { ua, ca } = getWrongAnswerDisplay(q, answers[q.id]);
        return `--- WRONG #${i + 1} [${
          q.topic
        }] ---\nQ: ${q.question.split("\n")[0]}\nYour answer: ${ua}\nCorrect: ${ca}\nExplanation: ${q.explanation}`;
      })
      .join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className={shared.app}>
      <div className={shared.wrap}>
        <div className={shared.logo}>
          <div className={shared.logoTop}>{QUIZ_SUBJECT}</div>
          <div className={shared.logoTitle}>Results</div>
        </div>
        <MasteryBars mode={mode} deck={deck} currentView={currentView} totalCount={totalCount} masteredCount={masteredCount} />
        <div className={styles.card}>
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: "50%",
              border: `3px solid ${pct >= 70 ? "var(--accent)" : "var(--wrong)"}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: pct >= 70 ? "var(--accent)" : "var(--wrong)",
              }}
            >
              {pct}%
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--muted)",
                fontFamily: "monospace",
              }}
            >
              {score}/{total}
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              color: "var(--muted)",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {pct === 100
              ? "Perfect! 🌱"
              : pct >= 80
              ? "Great work!"
              : pct >= 60
              ? "Getting there."
              : "Keep at it."}
          </div>
          {questions.map((q, i) => {
            const cor = checkCorrect(q, answers[q.id]);
            const { ua, ca } = getAnswerDisplay(q, answers[q.id]);
            const isHCW = !cor && confidence[q.id] === "know";
            return (
              <div key={q.id} className={cor ? styles.resultItemCorrect : styles.resultItemWrong}>
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
                    <strong>Q{i + 1}.</strong> {q.question.split("\n")[0]}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    {isHCW && (
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: "monospace",
                          color: "#f97316",
                          background: "rgba(249,115,22,0.1)",
                          border: "1px solid rgba(249,115,22,0.3)",
                          borderRadius: 4,
                          padding: "1px 5px",
                        }}
                      >
                        HCW
                      </span>
                    )}
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: "monospace",
                        color: cor ? "var(--accent)" : "var(--wrong)",
                        fontWeight: 700,
                      }}
                    >
                      {cor ? "✓" : "✗"}
                    </div>
                  </div>
                </div>
                {!cor && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      marginBottom: 2,
                    }}
                  >
                    Your answer: <span style={{ color: "var(--wrong)" }}>{ua}</span> ·
                    Correct: <span style={{ color: "var(--accent)" }}>{ca}</span>
                  </div>
                )}
                {isHCW && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#f97316",
                      marginBottom: 4,
                      fontFamily: "monospace",
                    }}
                  >
                    ⚠ High-confidence wrong — priority review
                  </div>
                )}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--yellow)",
                    lineHeight: 1.5,
                    marginTop: 5,
                    paddingTop: 5,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {q.explanation}
                </div>
              </div>
            );
          })}
          
          {wrongQs.length > 0 && (
            <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid var(--border)` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--wrong)" }}>⚠ {wrongQs.length} wrong</div>
                <button onClick={copyWrong} style={{ padding:"5px 12px", borderRadius:6, border:`1px solid var(--border)`, background:copied?"#238636":"transparent", color:copied?"var(--text)":"var(--muted)", cursor:"pointer", fontSize:12, fontFamily:"monospace" }}>{copied?"✓ Copied!":"Copy all"}</button>
              </div>
              {wrongQs.map((q,i) => {
                const { ua, ca } = getWrongAnswerDisplay(q, answers[q.id]);
                const isHCW = confidence[q.id] === "know";
                return (
                  <div key={q.id} className={styles.wrongItem} style={{ borderColor:isHCW?"rgba(249,115,22,0.4)":undefined, background:isHCW?"rgba(249,115,22,0.04)":undefined }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4, gap:8 }}>
                      <div style={{ fontSize:13, color:"var(--text)", lineHeight:1.5, flex:1 }}><strong>#{i+1} [{q.topic}]</strong> {q.question.split("\n")[0]}</div>
                      {isHCW && <span style={{ fontSize:10, fontFamily:"monospace", color:"#f97316", background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.3)", borderRadius:4, padding:"1px 5px", flexShrink:0 }}>HCW</span>}
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:2 }}>Your answer: <span style={{ color:"var(--wrong)" }}>{ua}</span></div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:2 }}>Correct: <span style={{ color:"var(--accent)" }}>{ca}</span></div>
                    <div style={{ fontSize:12, color:"var(--yellow)", lineHeight:1.5, marginTop:5, paddingTop:5, borderTop:"1px solid rgba(255,255,255,0.06)" }}>{q.explanation}</div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 7,
                border: "none",
                background: "var(--btn-bg)",
                color: "var(--btn-text)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "monospace",
              }}
              onClick={startNext}
            >
              NEXT ROUND
            </button>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span className={styles.resetLink} onClick={resetAll}>
            🔄 reset
          </span>
          {" · "}
          <span className={styles.resetLink} onClick={goToBank}>
            📚 bank
          </span>
        </div>
      </div>
    </div>
  );
}
