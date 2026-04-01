export default function InputQuestion({ q, calcInput, handleCalc, fitbInput, handleFitb, s, T, mobile, lm }) {
  return (
    <>
      {q.type === "calc" && (
        <div>
          <input type="text" placeholder="Enter your answer" value={calcInput} onChange={e => handleCalc(e.target.value)} style={s.calcIn} />
          <div style={{ fontSize: 11, color: T.muted, marginTop: 5, fontFamily: "monospace" }}>Enter a number</div>
        </div>
      )}
      {q.type === "fitb" && (
        <div>
          <input
            type="text"
            placeholder="Type your answer..."
            value={fitbInput}
            onChange={e => handleFitb(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && fitbInput.trim()) handleFitb(fitbInput); }}
            style={{ ...s.calcIn, fontSize: mobile ? 17 : 15 }}
          />
        </div>
      )}
    </>
  );
}
