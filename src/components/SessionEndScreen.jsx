import {
  SESSION_1_END,
  SESSION_2_END_WEAK,
  SESSION_2_END_PERFECT,
  SESSION_3_END,
  ALL_Q,
} from "../engineLogic.js";
import { getWrongAnswerDisplay } from "../utils/answerDisplay.js";
import MasteryBars from "./MasteryBars.jsx";
import shared from "./Shared.module.css";
import styles from "./SessionEndScreen.module.css";

export default function SessionEndScreen({
  QUIZ_SUBJECT,
  QUIZ_TITLE,
  deck,
  setDeck,
  weakSpotIds,
  resetAll,
  continueToNextSession,
  setCurrentView,
  latestDeckRef,
  resumeRef,
  saveProgress,
  advanceSession,
  goToBank,
  mode,
  currentView,
  totalCount,
  masteredCount,
}) {
  const sessionIdx = deck.sessionIndex; // 0 = just finished S1, 1 = just finished S2, 2 = just finished S3
  const isS2 = sessionIdx === 1;
  const isS3 = sessionIdx === 2;
  const hasWeakSpots = weakSpotIds.length > 0;

  // End of Session 2 with no weak spots → straight to win
  if (isS2 && !hasWeakSpots) {
    return (
      <div className={shared.app}>
        <div className={shared.wrap}>
          <div className={shared.logo}>
            <div className={shared.logoTop}>{QUIZ_SUBJECT}</div>
            <div className={shared.logoTitle}>{QUIZ_TITLE}</div>
          </div>
          <MasteryBars mode={mode} deck={deck} currentView={currentView} totalCount={totalCount} masteredCount={masteredCount} />
          <div className={styles.card}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--accent)",
                  marginBottom: 8,
                }}
              >
                Perfect Prep.
              </div>
              <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
                {SESSION_2_END_PERFECT}
              </div>
            </div>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              style={{ width: "100%", padding: "12px" }}
              onClick={resetAll}
            >
              START OVER
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8, fontSize:11, color:"var(--muted)", fontFamily:"monospace", display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
            <span className={styles.resetLink} onClick={() => setCurrentView("MENU")}>🏠 menu</span>
            <span className={styles.resetLink} onClick={goToBank}>📚 question bank</span>
            <span className={styles.resetLink} onClick={resetAll}>🔄 reset</span>
          </div>
        </div>
      </div>
    );
  }

  // Session end message
  let message = SESSION_1_END;
  if (isS2 && hasWeakSpots)
    message = SESSION_2_END_WEAK.replace("{n}", weakSpotIds.length);
  if (isS3) message = SESSION_3_END;

  const sessionPool = deck.sessionPools?.[String(sessionIdx + 1)] || [];
  const sessionWeakSpots = ALL_Q.filter(q => weakSpotIds.includes(q.id) && sessionPool.includes(q.id));

  return (
    <div className={shared.app}>
      <div className={shared.wrap}>
        <div className={shared.logo}>
          <div className={shared.logoTop}>{QUIZ_SUBJECT}</div>
          <div className={shared.logoTitle}>Session {sessionIdx + 1} Complete</div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: "var(--muted)",
              marginTop: -6,
              marginBottom: 4,
            }}
          >
            Session {sessionIdx + 1} of 3
          </div>
        </div>
        <MasteryBars mode={mode} deck={deck} currentView={currentView} totalCount={totalCount} masteredCount={masteredCount} />
        <div className={styles.card}>
          {(() => {
            const st = sessionPool.length;
            const ss = isS3 ? st : st - sessionWeakSpots.length;
            const sp = st > 0 ? Math.round((ss / st) * 100) : 100;
            return (
              <>
                <div
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    border: `3px solid ${sp >= 70 ? "var(--accent)" : "var(--wrong)"}`,
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
                      color: sp >= 70 ? "var(--accent)" : "var(--wrong)",
                    }}
                  >
                    {sp}%
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--muted)",
                      fontFamily: "monospace",
                    }}
                  >
                    {ss}/{st}
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
                  {sp === 100 && !isS3 ? "Perfect session! 🌱" : isS3 ? "All weak spots mastered!" : sp >= 80 ? "Great work!" : sp >= 60 ? "Getting there." : "Keep at it."}
                </div>
              </>
            );
          })()}

          {/* Sleep recommendation */}
          <div className={styles.sleepBox}>
            {message}
          </div>

          {/* Session Weak Spots Review */}
          {sessionWeakSpots.length > 0 && !isS3 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--wrong)", marginBottom: 10 }}>⚠ Review before you sleep</div>
              {sessionWeakSpots.map((q, i) => {
                const { ca } = getWrongAnswerDisplay(q, undefined);
                const isHCW = deck.hcwIds?.includes(q.id);
                return (
                  <div key={q.id} className={styles.wrongItem} style={isHCW ? { borderColor:"rgba(249,115,22,0.4)", background:"rgba(249,115,22,0.04)" } : undefined}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4, gap:8 }}>
                      <div style={{ fontSize:13, color:"var(--text)", lineHeight:1.5, flex:1 }}><strong>#{i + 1} [{q.topic}]</strong> {q.question.split("\n")[0]}</div>
                      {isHCW && <span style={{ fontSize:10, fontFamily:"monospace", color:"#f97316", background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.3)", borderRadius:4, padding:"1px 5px", flexShrink:0 }}>HCW</span>}
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:4 }}>Correct answer: <span style={{ color:"var(--accent)" }}>{ca}</span></div>
                    <div style={{ fontSize:12, color:"var(--yellow)", lineHeight:1.5 }}>{q.explanation}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons — only show next session button if not S3 */}
          {!isS3 && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                style={{ flex:2, padding:"12px" }}
                onClick={() => {
                  const freshDeck = latestDeckRef.current || deck;
                  const advancedDeck = advanceSession(freshDeck);
                  saveProgress(advancedDeck);
                  latestDeckRef.current = advancedDeck;
                  setDeck(advancedDeck);
                  resumeRef.current = true;
                  setCurrentView("MENU");
                }}
              >
                SEE YOU TOMORROW
              </button>
              <button
                className={styles.btn}
                style={{ flex:1, padding:"12px" }}
                onClick={continueToNextSession}
              >
                Continue now
              </button>
            </div>
          )}
          {isS3 && (() => {
            const s3Topics = deck.sessionTopicResults?.[2] || {};
            const s1Topics = deck.sessionTopicResults?.[0] || {};
            const s2Topics = deck.sessionTopicResults?.[1] || {};
            const topics = Object.keys(s3Topics).filter(t => t !== "Integrative");

            return topics.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:10 }}>Topic Summary</div>
                {topics.map(topic => {
                  const s3 = s3Topics[topic] || { correct:0, total:0 };
                  const s1 = s1Topics[topic] || { correct:0, total:0 };
                  const s2 = s2Topics[topic] || { correct:0, total:0 };
                  const s3pct = s3.total > 0 ? Math.round((s3.correct/s3.total)*100) : null;
                  const prevTotal = s1.total + s2.total;
                  const prevPct = prevTotal > 0 ? Math.round(((s1.correct+s2.correct)/prevTotal)*100) : null;
                  const stillWeak = s3pct !== null && s3pct < 70;
                  const color = stillWeak ? "#f97316" : "var(--accent)";
                  const icon = stillWeak ? "⚠" : "✓";
                  return (
                    <div key={topic} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderRadius:7, border:`1px solid ${stillWeak?"rgba(249,115,22,0.3)":"rgba(63,185,80,0.2)"}`, background:stillWeak?"rgba(249,115,22,0.04)":"rgba(63,185,80,0.04)", marginBottom:6 }}>
                      <div style={{ fontSize:13, color:"var(--text)" }}>{icon} {topic}</div>
                      <div style={{ fontSize:12, fontFamily:"monospace", color, display:"flex", gap:8, alignItems:"center" }}>
                        {prevPct !== null && <span style={{ color:"var(--muted)" }}>{prevPct}% →</span>}
                        <span style={{ fontWeight:700 }}>{s3pct !== null ? `${s3pct}%` : "—"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null;
          })()}
          {isS3 && (
            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ width:"100%", padding:"12px" }} onClick={resetAll}>START OVER</button>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 8, fontSize:11, color:"var(--muted)", fontFamily:"monospace", display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap" }}>
          <span className={styles.resetLink} onClick={() => setCurrentView("MENU")}>return to menu</span>
          <span className={styles.resetLink} onClick={goToBank}>question bank</span>
          <span className={styles.resetLink} onClick={resetAll}>reset progress</span>
        </div>
      </div>
    </div>
  );
}
