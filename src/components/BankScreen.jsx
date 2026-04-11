import {
  ALL_TF,
  ALL_MC,
  ALL_CALC,
  ALL_DEF,
  ALL_SPECIAL,
  ALL_FITB,
} from "../engineLogic.js";
import DevTool from "./DevTool.jsx";
import shared from "./Shared.module.css";
import styles from "./BankScreen.module.css";

export default function BankScreen({
  QUIZ_SUBJECT,
  leaveBank,
  patchNotes,
  description,
  deck,
  setDeck,
  questions,
  setQuestions,
  setCurrentView,
  totalCount,
  lightMode,
  mode,
  setConfidence,
}) {
  const allQ = [
    ...ALL_TF,
    ...ALL_MC,
    ...ALL_CALC,
    ...ALL_DEF,
    ...ALL_SPECIAL,
    ...ALL_FITB,
  ];
  const topics = [...new Set(allQ.map((q) => q.topic))];

  return (
    <div className={shared.app}>
      <div className={styles.bankWrap}>
        <div className={shared.logo}>
          <div className={shared.logoTop}>{QUIZ_SUBJECT}</div>
          <div className={shared.logoTitle}>Question Bank</div>
        </div>
        <button
          className={styles.backBtn}
          onClick={leaveBank}
        >
          Back
        </button>
        <div className={styles.descCard}>
          <div className={styles.descTitle}>
            {patchNotes}
          </div>
          <div className={styles.descText}>
            {description}
          </div>
        </div>
        <div
          style={{
            marginBottom: 16,
            fontSize: 12,
            color: "var(--muted)",
            fontFamily: "monospace",
          }}
        >
          {allQ.length} questions across {topics.length} topics
        </div>
        {topics.map((topic) => {
          const qs = allQ.filter((q) => q.topic === topic);
          return (
            <div key={topic} style={{ marginBottom: 24 }}>
              <div className={styles.topicHeader}>
                {topic} ({qs.length})
              </div>
              {qs.map((q) => {
                const typeLabel = q.type==="tf"?"T/F":q.type==="mc"?"MC":q.type==="calc"?"CALC":q.type==="def"?"DEF":q.type==="fitb"?"FITB":q.type==="match"?"MATCH":"ORDER";
                const correctText = q.type==="tf"?(q.answer?"True":"False"):q.type==="mc"||q.type==="def"?q.options[q.answer]:q.type==="calc"?q.answerDisplay:q.type==="fitb"?q.accepted.join(" / "):q.type==="match"?"See pairs below":q.correctOrder?.join(" → ");
                return (
                  <div key={q.id} className={styles.qCard}>
                    <div style={{ display:"flex", gap:8, alignItems: "center", flexDirection: "column", marginBottom:4 }}>
                      <div className={styles.typeTag}>{typeLabel}</div>
                      <div style={{ fontSize:13, color:"var(--text)", lineHeight:1.5, whiteSpace:"pre-line", marginBottom: 4 }}>{q.question}</div>
                    </div>
                    {q.type==="mc"||q.type==="def"
                      ? <div>{q.options.map((opt,j)=>{
                          const isCor = j===q.answer||opt===q.answer;
                          return <div key={j} style={{ fontSize:12, color:isCor?"var(--accent)":"var(--muted)", marginBottom:3, display:"flex", alignItems:"center", justifyContent: "center", gap:6 }}>
                            <span style={{ width:14, flexShrink:0, textAlign: "right" }}>{isCor?"✓":""}</span><span style={{ textAlign: "left" }}>{opt}</span>
                          </div>;
                        })}</div>
                      : q.type==="match"
                        ? <div>{q.pairs.map((p,i)=><div key={i} style={{ fontSize:12, color:"var(--accent)", marginBottom:2 }}>✓ {p.term} → {p.desc}</div>)}</div>
                        : <div style={{ fontSize:12, color:"var(--accent)", marginTop:6 }}>✓ {correctText}</div>
                    }
                    <div style={{ fontSize:11, color:"var(--yellow)", marginTop:6, lineHeight:1.5 }}>{q.explanation}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <button
          className={styles.backBtn}
          onClick={leaveBank}
        >
          Back
        </button>
        <DevTool deck={deck} setDeck={setDeck} questions={questions} setQuestions={setQuestions} setCurrentView={setCurrentView} totalCount={totalCount} lightMode={lightMode} mode={mode} setConfidence={setConfidence} />
      </div>
    </div>
  );
}
