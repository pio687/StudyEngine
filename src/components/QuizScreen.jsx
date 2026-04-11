import {
  QUIZ_SUBJECT,
  QUIZ_TITLE,
} from "../engineLogic.js";
import StandardQuestion from "./questions/StandardQuestion.jsx";
import InputQuestion from "./questions/InputQuestion.jsx";
import OrderingQuestion from "./questions/OrderingQuestion.jsx";
import MatchingQuestion from "./questions/MatchingQuestion.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import MasteryBars from "./MasteryBars.jsx";
import shared from "./Shared.module.css";
import styles from "./QuizScreen.module.css";

export default function QuizScreen({
  q, current, total, questions, answers, ua, select, calcInput, handleCalc, fitbInput, handleFitb,
  orderSelected, clearOrdering, pickOrdering, matchState, setMatchState, setAnswers, confidence, setConfidence,
  handleSubmit, setCurrent, resetAll, goToBank, mode, setMode,
  lightMode, toggleLight, deck, weakSpotIds, setCurrentView, currentView, totalCount, masteredCount,
  confirmReset, setConfirmReset,
}) {
  const lm = lightMode; // for MatchingQuestion

  function btnClass(primary, disabled) {
    if (disabled) return `${styles.btn} ${styles.btnDisabled}`;
    return `${styles.btn} ${primary ? styles.btnPrimary : styles.btnSecondary}`;
  }

  if (!q || total === 0) {
    if (mode === "study") {
      return (
        <div className={shared.app}><div className={shared.wrap}>
          <div style={{ textAlign:"center", color:"var(--muted)", fontFamily:"monospace", fontSize:13 }}>
            <div style={{ marginBottom:12 }}>Session complete.</div>
            <button className={btnClass(true, false)} onClick={() => setCurrentView("SESSION_END")}>See Results</button>
          </div>
        </div></div>
      );
    }
    return (
      <div className={shared.app}><div className={shared.wrap}>
        <div style={{ textAlign:"center", color:"var(--muted)", fontFamily:"monospace", fontSize:13 }}>
          <div style={{ marginBottom:12 }}>No questions available.</div>
          <button className={btnClass(true, false)} onClick={resetAll}>Reset Progress</button>
        </div>
      </div></div>
    );
  }

  return (
    <>
    <div className={shared.app}><div className={shared.wrap}>
      <div className={shared.logo}>
        <div className={shared.logoTop}>{QUIZ_SUBJECT}</div>
        <div className={shared.logoTitle}>{QUIZ_TITLE}</div>
        {mode === "study" && deck.sessionPools && (
          <div style={{ fontSize:11, fontFamily:"monospace", color:"var(--muted)", marginTop:-6, marginBottom:4, fontWeight:700 }}>
            Session {deck.sessionIndex + 1} of {weakSpotIds.length > 0 || deck.sessionIndex >= 1 ? 3 : "?"}
          </div>
        )}
      </div>

      <MasteryBars mode={mode} deck={deck} currentView={currentView} totalCount={totalCount} masteredCount={masteredCount} />

      <div className={styles.progRow}>
        <div className={styles.progBar}><div className={styles.progFill} style={{ width: `${(current+1)/total*100}%` }} /></div>
        <div className={styles.progTxt}>Q{current+1}/{total}</div>
      </div>

      <div className={styles.card}>
        <div className={styles.tag}>{q.topic}</div>
        <div className={styles.qText}>{q.question}</div>

        {/* TRUE/FALSE & MULTIPLE CHOICE / DEFINITION */}
        {(q.type==="tf"||q.type==="mc"||q.type==="def") && (
          <StandardQuestion q={q} ua={ua} select={select} />
        )}

        {/* CALCULATION & FILL IN THE BLANK */}
        {(q.type==="calc"||q.type==="fitb") && (
          <InputQuestion q={q} calcInput={calcInput} handleCalc={handleCalc} fitbInput={fitbInput} handleFitb={handleFitb} />
        )}

        {/* ORDERING */}
        {q.type==="ordering" && (
          <OrderingQuestion q={q} orderSelected={orderSelected} clearOrdering={clearOrdering} pickOrdering={pickOrdering} />
        )}

        {/* MATCHING */}
        {q.type==="match" && (
          <MatchingQuestion q={q} matchState={matchState} setMatchState={setMatchState} setAnswers={setAnswers} lm={lm} />
        )}
      </div>

      {/* CONFIDENCE RATING — Study Mode only, always visible, activates after answer selected */}
      {mode === "study" && (
        <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, padding:"14px 16px", marginBottom:12 }}>
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
          <div className={styles.navRow}>
            <button className={btnClass(false, current === 0)} onClick={() => current > 0 && setCurrent(c => c - 1)} disabled={current === 0}>← Back</button>
            <div className={styles.dots}>
              {questions.map((_, i) => {
                const isCur = i === current;
                const isAns = answers[questions[i].id] !== undefined;
                return (
                  <div key={i} className={styles.navDot} style={{ width: isCur ? 16 : 7, background: isCur ? "var(--accent)" : isAns ? "var(--neutral)" : "var(--border)" }} onClick={() => setCurrent(i)} />
                );
              })}
            </div>
            {current < total - 1
              ? <button className={btnClass(false, !canProceed)} onClick={() => canProceed && setCurrent(c => c + 1)} disabled={!canProceed}>Next →</button>
              : <button className={btnClass(true, !canProceed)} onClick={handleSubmit} disabled={!canProceed}>SUBMIT</button>
            }
          </div>
        );
      })()}

      <div style={{ textAlign:"center", marginTop:8, fontSize:11, color:"var(--muted)", fontFamily:"monospace", display:"flex", justifyContent:"center", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <span className={styles.resetLink} onClick={() => setConfirmReset(true)}>🔄 reset progress</span>
        <span className={styles.resetLink} onClick={goToBank}>📚 question bank</span>
        <span className={styles.resetLink} onClick={() => { setMode(null); setCurrentView("MENU"); }}>🏠 menu</span>
        <label style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
          <input type="checkbox" checked={lightMode} onChange={toggleLight} style={{ cursor:"pointer" }} />
          light mode
        </label>
      </div>
    </div></div>
    {confirmReset && (
      <ConfirmModal
        title="Reset Progress"
        message={`Are you sure you want to reset all ${mode} progress? This cannot be undone.`}
        confirmText="Reset"
        onConfirm={resetAll}
        onCancel={() => setConfirmReset(false)}
      />
    )}
    </>
  );
}
