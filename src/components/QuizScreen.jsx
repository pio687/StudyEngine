import {
  QUIZ_SUBJECT,
  QUIZ_TITLE,
} from "../engineLogic.js";
import StandardQuestion from "./questions/StandardQuestion.jsx";
import InputQuestion from "./questions/InputQuestion.jsx";
import OrderingQuestion from "./questions/OrderingQuestion.jsx";
import MatchingQuestion from "./questions/MatchingQuestion.jsx";

export default function QuizScreen({
  s, T, C, CV, lm, q, current, total, questions, answers, ua, select, calcInput, handleCalc, fitbInput, handleFitb,
  orderSelected, clearOrdering, pickOrdering, matchState, setMatchState, setAnswers, confidence, setConfidence,
  handleSubmit, setCurrent, resetAll, goToBank, mode, setMode,
  lightMode, toggleLight, renderMasteryBars, mobile, deck, weakSpotIds, setCurrentView,
}) {

  if (!q || total === 0) {
    if (mode === "study") {
      return (
        <div style={s.app}><div style={s.wrap}>
          <div style={{ textAlign:"center", color:T.muted, fontFamily:"monospace", fontSize:13 }}>
            <div style={{ marginBottom:12 }}>Session complete.</div>
            <button style={s.btn(true, false)} onClick={() => setCurrentView("SESSION_END")}>See Results</button>
          </div>
        </div></div>
      );
    }
    return (
      <div style={s.app}><div style={s.wrap}>
        <div style={{ textAlign:"center", color:T.muted, fontFamily:"monospace", fontSize:13 }}>
          <div style={{ marginBottom:12 }}>No questions available.</div>
          <button style={s.btn(true, false)} onClick={resetAll}>Reset Progress</button>
        </div>
      </div></div>
    );
  }

  return (
    <div style={s.app}><div style={s.wrap}>
      <div style={s.logo}>
        <div style={s.logoTop}>{QUIZ_SUBJECT}</div>
        <div style={s.logoTitle}>{QUIZ_TITLE}</div>
        {mode === "study" && deck.sessionPools && (
          <div style={{ fontSize:11, fontFamily:"monospace", color:T.muted, marginTop:-6, marginBottom:4, fontWeight:700 }}>
            Session {deck.sessionIndex + 1} of {weakSpotIds.length > 0 || deck.sessionIndex >= 1 ? 3 : "?"}
          </div>
        )}
      </div>

      {renderMasteryBars()}

      <div style={s.progRow}>
        <div style={s.progBar}><div style={s.progFill((current+1)/total*100)} /></div>
        <div style={s.progTxt}>Q{current+1}/{total}</div>
      </div>

      <div style={s.card}>
        <div style={s.tag}>{q.topic}</div>
        <div style={s.qText}>{q.question}</div>

        {/* TRUE/FALSE & MULTIPLE CHOICE / DEFINITION */}
        {(q.type==="tf"||q.type==="mc"||q.type==="def") && (
          <StandardQuestion q={q} ua={ua} select={select} s={s} T={T} lm={lm} mobile={mobile} />
        )}

        {/* CALCULATION & FILL IN THE BLANK */}
        {(q.type==="calc"||q.type==="fitb") && (
          <InputQuestion q={q} calcInput={calcInput} handleCalc={handleCalc} fitbInput={fitbInput} handleFitb={handleFitb} s={s} T={T} mobile={mobile} lm={lm} />
        )}

        {/* ORDERING */}
        {q.type==="ordering" && (
          <OrderingQuestion q={q} orderSelected={orderSelected} clearOrdering={clearOrdering} pickOrdering={pickOrdering} s={s} T={T} />
        )}

        {/* MATCHING */}
        {q.type==="match" && (
          <MatchingQuestion q={q} matchState={matchState} setMatchState={setMatchState} setAnswers={setAnswers} lm={lm} T={T} />
        )}
      </div>

      {/* CONFIDENCE RATING — Study Mode only, always visible, activates after answer selected */}
      {mode === "study" && (
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
          <div style={{ fontSize:11, color:answers[q?.id] !== undefined ? "var(--muted)" : "var(--border)", fontFamily:"monospace", marginBottom:10, textAlign:"center", letterSpacing:"0.08em", textTransform:"uppercase", transition:"color 0.15s" }}>How confident were you?</div>
          <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
            {[
              { key:"unsure", label:"Unsure",  emoji:"🟡" },
              { key:"know",   label:"Know it", emoji:"🟢" },
            ].map(({ key, label, emoji }) => {
              const answered = answers[q?.id] !== undefined;
              const sel = answered && confidence[q?.id] === key;
              return (
                <button key={key}
                  onClick={() => answered && setConfidence(p => ({ ...p, [q.id]: key }))}
                  style={{ padding:"8px 14px", borderRadius:7, border:`1px solid ${sel?"var(--accent)":"var(--border)"}`, background:sel?"color-mix(in srgb, var(--accent) 7%, transparent)":"transparent", color:sel?"var(--accent)":answered?"var(--muted)":"var(--border)", cursor:answered?"pointer":"default", fontSize:13, display:"flex", alignItems:"center", gap:6, transition:"all 0.15s" }}>
                  {emoji} {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {(() => {
        const answered = answers[q?.id] !== undefined;
        const confSelected = confidence[q?.id] !== undefined;
        const canProceed = mode !== 'study' || (answered && confSelected);
        return (
          <div style={s.navRow}>
            <button style={s.btn(false, current === 0)} onClick={() => current > 0 && setCurrent(c => c - 1)} disabled={current === 0}>← Back</button>
            <div style={s.dots}>
              {questions.map((_, i) => (
                <div key={i} style={s.navDot(i === current, answers[questions[i].id] !== undefined)} onClick={() => setCurrent(i)} />
              ))}
            </div>
            {current < total - 1
              ? <button style={s.btn(false, !canProceed)} onClick={() => canProceed && setCurrent(c => c + 1)} disabled={!canProceed}>Next →</button>
              : <button style={s.btn(true, !canProceed)} onClick={handleSubmit} disabled={!canProceed}>SUBMIT</button>
            }
          </div>
        );
      })()}

      <div style={{ textAlign:"center", marginTop:8, fontSize:11, color:T.muted, fontFamily:"monospace", display:"flex", justifyContent:"center", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <span style={s.resetLink} onClick={resetAll}>reset progress</span>
        <span style={s.resetLink} onClick={goToBank}>question bank</span>
        <span style={s.resetLink} onClick={() => { setMode(null); setCurrentView("MENU"); }}>{mode === "study" ? "📚 study" : "⚡ practice"}</span>
        <label style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
          <input type="checkbox" checked={lightMode} onChange={toggleLight} style={{ cursor:"pointer" }} />
          light mode
        </label>
      </div>
    </div></div>
  );
}
