import {
  SESSION_1_END,
  SESSION_2_END_WEAK,
  SESSION_2_END_PERFECT,
  SESSION_3_END,
} from "../engineLogic.js";

export default function SessionEndScreen({
  s,
  QUIZ_SUBJECT,
  QUIZ_TITLE,
  renderMasteryBars,
  deck,
  weakSpotIds,
  sessionScoreRef,
  questions,
  answers,
  getWrongAnswerDisplay,
  confidence,
  resetAll,
  continueToNextSession,
  setMode,
  setCurrentView,
  T,
  lm,
  CV,
  C,
  computeTopicResults,
  latestDeckRef,
  resumeRef,
  saveProgress,
  advanceSession,
  checkCorrect,
}) {
  const sessionIdx = deck.sessionIndex; // 0 = just finished S1, 1 = just finished S2, 2 = just finished S3
  const isS2 = sessionIdx === 1;
  const isS3 = sessionIdx === 2;
  const hasWeakSpots = weakSpotIds.length > 0;

  // End of Session 2 with no weak spots → straight to win
  if (isS2 && !hasWeakSpots) {
    return (
      <div style={s.app}>
        <div style={s.wrap}>
          <div style={s.logo}>
            <div style={s.logoTop}>{QUIZ_SUBJECT}</div>
            <div style={s.logoTitle}>{QUIZ_TITLE}</div>
          </div>
          {renderMasteryBars()}
          <div style={s.card}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌟</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: T.accent,
                  marginBottom: 8,
                }}
              >
                Perfect Prep.
              </div>
              <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
                {SESSION_2_END_PERFECT}
              </div>
            </div>
            <button
              style={{
                ...s.btn(true, false),
                width: "100%",
                padding: "12px",
                fontFamily: "monospace",
              }}
              onClick={resetAll}
            >
              START OVER
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Session end message
  let message = SESSION_1_END;
  if (isS2 && hasWeakSpots)
    message = SESSION_2_END_WEAK.replace("{n}", weakSpotIds.length);
  if (isS2 && !hasWeakSpots) message = SESSION_2_END_PERFECT; // fallback if guard above didn't catch it
  if (isS3) message = SESSION_3_END;

  // Use snapshotted wrong answers — questions/answers may have been rebuilt
  const sessionWrongQs =
    sessionScoreRef.current?.wrongQs ??
    questions.filter((q) => !checkCorrect(q, answers[q.id]));
  const sessionAnswers = sessionScoreRef.current?.answers ?? answers;

  return (
    <div style={s.app}>
      <div style={s.wrap}>
        <div style={s.logo}>
          <div style={s.logoTop}>{QUIZ_SUBJECT}</div>
          <div style={s.logoTitle}>Session {sessionIdx + 1} Complete</div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: T.muted,
              marginTop: -6,
              marginBottom: 4,
            }}
          >
            Session {sessionIdx + 1} of {isS3 ? 3 : 3}
          </div>
        </div>
        {renderMasteryBars()}
        <div style={s.card}>
          {/* Score — use snapshotted values so they survive answers/questions being cleared */}
          {(() => {
            const snap = sessionScoreRef.current || { score:0, total:0, pct:0 };
            const sp = snap.pct, ss = snap.score, st = snap.total;
            return (
              <>
                <div
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    border: `3px solid ${sp >= 70 ? T.accent : T.wrong}`,
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
                      color: sp >= 70 ? T.accent : T.wrong,
                    }}
                  >
                    {sp}%
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: T.muted,
                      fontFamily: "monospace",
                    }}
                  >
                    {ss}/{st}
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    color: T.muted,
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {sp === 100 ? "Perfect round! 🌱" : sp >= 80 ? "Great work!" : sp >= 60 ? "Getting there." : "Keep at it."}
                </div>
              </>
            );
          })()}

          {/* Sleep recommendation */}
          <div style={{ background:T.yellowBg, border:`1px solid ${T.yellowBorder}`, borderRadius:8, padding:"14px 16px", marginBottom:16, fontSize:13, color:T.yellow, lineHeight:1.6, textAlign:"center" }}>
            {message}
          </div>

          {/* Wrong answer review */}
          {sessionWrongQs.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.wrong, marginBottom: 10 }}>⚠ Review before you sleep</div>
              {sessionWrongQs.map((q, i) => {
                const { ua, ca } = getWrongAnswerDisplay(q, sessionAnswers[q.id]);
                const isHCW = confidence[q.id] === "know";
                return (
                  <div key={q.id} style={{ ...s.wrongItem, borderColor:isHCW?"rgba(249,115,22,0.4)":undefined, background:isHCW?"rgba(249,115,22,0.04)":undefined, marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:4, gap:8 }}>
                      <div style={{ fontSize:13, color:T.text, lineHeight:1.5, flex:1 }}><strong>#{i + 1} [{q.topic}]</strong> {q.question.split("\n")[0]}</div>
                      {isHCW && <span style={{ fontSize:10, fontFamily:"monospace", color:"#f97316", background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.3)", borderRadius:4, padding:"1px 5px", flexShrink:0 }}>HCW</span>}
                    </div>
                    <div style={{ fontSize:12, color:T.muted, marginBottom:2 }}>Your answer: <span style={{ color:T.wrong }}>{ua}</span></div>
                    <div style={{ fontSize:12, color:T.muted, marginBottom:4 }}>Correct: <span style={{ color:T.accent }}>{ca}</span></div>
                    <div style={{ fontSize:12, color:T.yellow, lineHeight:1.5 }}>{q.explanation}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action buttons — only show next session button if not S3 */}
          {!isS3 && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{ flex:2, padding:"12px", borderRadius:7, border:"none", background:lm?CV.btnBg:C.accent, color:lm?CV.btnText:"#0d1117", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"monospace" }}
                onClick={() => {
                  const topicResults = computeTopicResults(sessionScoreRef.current?.questions ?? questions, sessionScoreRef.current?.answers ?? answers);
                  const freshDeck = latestDeckRef.current || deck;
                  const deckWithResults = { ...freshDeck, sessionTopicResults: { ...(freshDeck.sessionTopicResults || {}), [freshDeck.sessionIndex]: topicResults } };
                  const advancedDeck = advanceSession(deckWithResults);
                  saveProgress(advancedDeck);
                  latestDeckRef.current = advancedDeck;
                  resumeRef.current = true;
                  setCurrentView("MENU");
                }}
              >
                SEE YOU TOMORROW
              </button>
              <button
                style={{ flex:1, padding:"12px", borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontSize:12 }}
                onClick={continueToNextSession}
              >
                Continue now
              </button>
            </div>
          )}
          {isS3 && (() => {
            const s3Topics = computeTopicResults(questions, answers);
            const s1Topics = deck.sessionTopicResults?.[0] || {};
            const s2Topics = deck.sessionTopicResults?.[1] || {};
            const topics = Object.keys(s3Topics).filter(t => t !== "Integrative");

            return topics.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:10 }}>Topic Summary</div>
                {topics.map(topic => {
                  const s3 = s3Topics[topic] || { correct:0, total:0 };
                  const s1 = s1Topics[topic] || { correct:0, total:0 };
                  const s2 = s2Topics[topic] || { correct:0, total:0 };
                  const s3pct = s3.total > 0 ? Math.round((s3.correct/s3.total)*100) : null;
                  const prevTotal = s1.total + s2.total;
                  const prevPct = prevTotal > 0 ? Math.round(((s1.correct+s2.correct)/prevTotal)*100) : null;
                  const stillWeak = s3pct !== null && s3pct < 70;
                  const color = stillWeak ? "#f97316" : T.accent;
                  const icon = stillWeak ? "⚠" : "✓";
                  return (
                    <div key={topic} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderRadius:7, border:`1px solid ${stillWeak?"rgba(249,115,22,0.3)":"rgba(63,185,80,0.2)"}`, background:stillWeak?"rgba(249,115,22,0.04)":"rgba(63,185,80,0.04)", marginBottom:6 }}>
                      <div style={{ fontSize:13, color:T.text }}>{icon} {topic}</div>
                      <div style={{ fontSize:12, fontFamily:"monospace", color, display:"flex", gap:8, alignItems:"center" }}>
                        {prevPct !== null && <span style={{ color:T.muted }}>{prevPct}% →</span>}
                        <span style={{ fontWeight:700 }}>{s3pct !== null ? `${s3pct}%` : "—"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null;
          })()}
          {isS3 && (
            <button style={{ ...s.btn(true,false), width:"100%", padding:"12px", fontFamily:"monospace" }} onClick={resetAll}>START OVER</button>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={s.resetLink} onClick={resetAll}>reset all progress</span>
        </div>
      </div>
    </div>
  );
}
