import {
  ALL_TF,
  ALL_MC,
  ALL_CALC,
  ALL_DEF,
  ALL_SPECIAL,
  ALL_FITB,
} from "../engineLogic.js";

export default function BankScreen({
  s,
  QUIZ_SUBJECT,
  leaveBank,
  T,
  DevTool,
  patchNotes,
  description,
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
    <div style={s.app}>
      <div style={{ ...s.wrap, maxWidth: 700 }}>
        <div style={s.logo}>
          <div style={s.logoTop}>{QUIZ_SUBJECT}</div>
          <div style={s.logoTitle}>Question Bank</div>
        </div>
        <button
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: 16,
            borderRadius: 7,
            border: `1px solid ${T.border}`,
            background: "transparent",
            color: T.text,
            cursor: "pointer",
            fontSize: 13,
          }}
          onClick={leaveBank}
        >
          Back
        </button>
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: T.accent,
              fontFamily: "monospace",
              marginBottom: 4,
            }}
          >
            {patchNotes}
          </div>
          <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            {description}
          </div>
        </div>
        <div
          style={{
            marginBottom: 16,
            fontSize: 12,
            color: T.muted,
            fontFamily: "monospace",
          }}
        >
          {allQ.length} questions across {topics.length} topics
        </div>
        {topics.map((topic) => {
          const qs = allQ.filter((q) => q.topic === topic);
          return (
            <div key={topic} style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.neutral,
                  fontFamily: "monospace",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                  paddingBottom: 6,
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                {topic} ({qs.length})
              </div>
              {qs.map((q) => {
                const typeLabel = q.type==="tf"?"T/F":q.type==="mc"?"MC":q.type==="calc"?"CALC":q.type==="def"?"DEF":q.type==="fitb"?"FITB":q.type==="match"?"MATCH":"ORDER";
                const correctText = q.type==="tf"?(q.answer?"True":"False"):q.type==="mc"||q.type==="def"?q.options[q.answer]:q.type==="calc"?q.answerDisplay:q.type==="fitb"?q.accepted.join(" / "):q.type==="match"?"See pairs below":q.correctOrder?.join(" → ");
                return (
                  <div key={q.id} style={{ padding:"10px 12px", borderRadius:7, border:`1px solid ${T.border}`, background:"rgba(255,255,255,0.02)", marginBottom:7, textAlign: "center" }}>
                    <div style={{ display:"flex", gap:8, alignItems: "center", flexDirection: "column", marginBottom:4 }}>
                      <div style={{ fontSize:9, fontFamily:"monospace", color:T.muted, background:T.border, borderRadius:3, padding:"2px 5px", flexShrink:0 }}>{typeLabel}</div>
                      <div style={{ fontSize:13, color:T.text, lineHeight:1.5, whiteSpace:"pre-line", marginBottom: 4 }}>{q.question}</div>
                    </div>
                    {q.type==="mc"||q.type==="def"
                      ? <div>{q.options.map((opt,j)=>{
                          const isCor = j===q.answer||opt===q.answer;
                          return <div key={j} style={{ fontSize:12, color:isCor?T.accent:T.muted, marginBottom:3, display:"flex", alignItems:"center", justifyContent: "center", gap:6 }}>
                            <span style={{ width:14, flexShrink:0, textAlign: "right" }}>{isCor?"✓":""}</span><span style={{ textAlign: "left" }}>{opt}</span>
                          </div>;
                        })}</div>
                      : q.type==="match"
                        ? <div>{q.pairs.map((p,i)=><div key={i} style={{ fontSize:12, color:T.accent, marginBottom:2 }}>✓ {p.term} → {p.desc}</div>)}</div>
                        : <div style={{ fontSize:12, color:T.accent, marginTop:6 }}>✓ {correctText}</div>
                    }
                    <div style={{ fontSize:11, color:T.yellow, marginTop:6, lineHeight:1.5 }}>{q.explanation}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <button
          style={{ width: "100%", padding: "11px", marginTop: 8, borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.text, cursor: "pointer", fontSize: 13 }}
          onClick={leaveBank}
        >
          Back
        </button>
        <DevTool />
      </div>
    </div>
  );
}
