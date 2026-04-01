import { MATCH_COLORS, LIGHT_MATCH_COLORS } from "../../engineLogic.js";

export default function MatchingQuestion({ q, matchState, setMatchState, setAnswers, lm, T }) {
  const pairs = q.shuffledPairs || q.pairs;
  const { selectedTerm, selectedDesc, matched, wrong, feedback: mFeedback } = matchState;
  const matchCount = Object.keys(matched).length;
  const activeMatchColors = lm ? LIGHT_MATCH_COLORS : MATCH_COLORS;
  const SEL_STYLE = { background: "rgba(239,159,39,0.15)", borderColor: "#EF9F27", color: lm ? "#3d2600" : "#fbbf24", borderWidth: 1.5 };
  const WRONG_STYLE = { background: "rgba(248,81,73,0.08)", borderColor: T.wrong, color: T.wrong };

  function getMatchedColorIdx(termIdx) { return matched[termIdx] !== undefined ? matched[termIdx] : null; }
  function getDescMatchedColorIdx(descIdx) {
    for (const [tIdx, cIdx] of Object.entries(matched)) {
      if (q.pairs[parseInt(tIdx)].desc === pairs[descIdx].desc) return cIdx;
    }
    return null;
  }

  function handleMatchTerm(idx) {
    if (matched[idx] !== undefined) return;
    if (selectedTerm === idx) { setMatchState(p => ({ ...p, selectedTerm: null })); return; }
    if (selectedDesc !== null) {
      const descPair = pairs[selectedDesc];
      const termPair = q.pairs[idx];
      if (termPair.desc === descPair.desc) {
        const newMatched = { ...matched, [idx]: matchCount };
        setMatchState(p => ({ ...p, selectedTerm: null, selectedDesc: null, matched: newMatched, feedback: "" }));
        setAnswers(prev => ({ ...prev, [q.id]: newMatched }));
      } else {
        setMatchState(p => ({ ...p, selectedTerm: null, selectedDesc: null, wrong: { term: idx, desc: selectedDesc }, feedback: "Not a match — try again" }));
        setTimeout(() => setMatchState(p => ({ ...p, wrong: { term: null, desc: null }, feedback: "" })), 900);
      }
    } else {
      setMatchState(p => ({ ...p, selectedTerm: idx }));
    }
  }

  function handleMatchDesc(descIdx) {
    if (getDescMatchedColorIdx(descIdx) !== null) return;
    if (selectedDesc === descIdx) { setMatchState(p => ({ ...p, selectedDesc: null })); return; }
    if (selectedTerm !== null) {
      const descPair = pairs[descIdx];
      const termPair = q.pairs[selectedTerm];
      if (termPair.desc === descPair.desc) {
        const newMatched = { ...matched, [selectedTerm]: matchCount };
        setMatchState(p => ({ ...p, selectedTerm: null, selectedDesc: null, matched: newMatched, feedback: "" }));
        setAnswers(prev => ({ ...prev, [q.id]: newMatched }));
      } else {
        setMatchState(p => ({ ...p, selectedTerm: null, selectedDesc: null, wrong: { term: selectedTerm, desc: descIdx }, feedback: "Not a match — try again" }));
        setTimeout(() => setMatchState(p => ({ ...p, wrong: { term: null, desc: null }, feedback: "" })), 900);
      }
    } else {
      setMatchState(p => ({ ...p, selectedDesc: descIdx }));
    }
  }

  const matchBase = { padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.text, cursor: "pointer", fontSize: 13, lineHeight: 1.5, textAlign: "left", transition: "all 0.12s", width: "100%", boxSizing: "border-box", minHeight: 42, display: "flex", alignItems: "center" };

  return (
    <div>
      <div style={{ fontSize: 11, color: T.muted, fontFamily: "monospace", marginBottom: 10 }}>{matchCount} / {q.pairs.length} matched</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Term</div>
          {q.pairs.map((p, i) => {
            const cIdx = getMatchedColorIdx(i);
            const c = cIdx !== null ? activeMatchColors[cIdx % activeMatchColors.length] : null;
            const st = c ? { background: c.bg, borderColor: c.border, color: c.text, borderWidth: 1.5, cursor: "default", fontWeight: 600 } : wrong.term === i ? WRONG_STYLE : selectedTerm === i ? SEL_STYLE : {};
            return <button key={i} style={{ ...matchBase, ...st }} onClick={() => handleMatchTerm(i)}>{p.term}</button>;
          })}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: "monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Description</div>
          {pairs.map((p, descIdx) => {
            const cIdx = getDescMatchedColorIdx(descIdx);
            const c = cIdx !== null ? activeMatchColors[cIdx % activeMatchColors.length] : null;
            const st = c ? { background: c.bg, borderColor: c.border, color: c.text, borderWidth: 1.5, cursor: "default", fontWeight: 600 } : wrong.desc === descIdx ? WRONG_STYLE : selectedDesc === descIdx ? SEL_STYLE : {};
            return <button key={descIdx} style={{ ...matchBase, ...st }} onClick={() => handleMatchDesc(descIdx)}>{p.desc}</button>;
          })}
        </div>
      </div>
      {mFeedback && <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: T.wrong }}>{mFeedback}</div>}
      {matchCount === q.pairs.length && <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, color: T.accent, fontFamily: "monospace" }}>All matched!</div>}
    </div>
  );
}
