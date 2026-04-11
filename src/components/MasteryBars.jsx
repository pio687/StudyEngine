export default function MasteryBars({ mode, deck, currentView, totalCount, masteredCount }) {
  const isStudyMode = mode === "study";

  let barTotal = totalCount;
  let barCorrectOnce = (deck.correctOnceIds || []).length;
  let barMastered = masteredCount;

  if (isStudyMode && deck.sessionPools && currentView !== "WIN") {
    const currentPoolIds = deck.sessionPools[String(deck.sessionIndex + 1)];
    if (currentPoolIds && currentPoolIds.length > 0) {
      barTotal = currentPoolIds.length;
      barCorrectOnce = (deck.correctOnceIds || []).filter(id => currentPoolIds.includes(id)).length;
      barMastered = (deck.masteredIds || []).filter(id => currentPoolIds.includes(id)).length;
    }
  }

  const correctOncePct = barTotal > 0 ? Math.round((barCorrectOnce / barTotal) * 100) : 100;
  const masteredPct = barTotal > 0 ? Math.round((barMastered / barTotal) * 100) : 100;

  return (
    <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ fontSize:10, color:"var(--muted)", fontFamily:"monospace", whiteSpace:"nowrap", minWidth:55, fontWeight:700 }}>
        {isStudyMode ? <><div style={{ marginBottom:4 }}>Correct</div><div>Mastered</div></> : <div>Complete</div>}
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
        {isStudyMode && (
          <div style={{ height:5, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", background:"linear-gradient(90deg,#3fb950,#bc8cff)", borderRadius:3, transition:"width 0.5s ease", width:`${correctOncePct}%` }} />
          </div>
        )}
        <div style={{ height:5, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", background:"linear-gradient(90deg,#e3b341,#d4920a)", borderRadius:3, transition:"width 0.5s ease", width:isStudyMode ? `${masteredPct}%` : `${correctOncePct}%` }} />
        </div>
      </div>
      <div style={{ fontSize:11, fontFamily:"monospace", minWidth:50, textAlign:"right" }}>
        {isStudyMode && <div style={{ marginBottom:4, color:"var(--accent)" }}>{barCorrectOnce}/{barTotal}</div>}
        <div style={{ color:"var(--yellow)" }}>{isStudyMode ? barMastered : barCorrectOnce}/{barTotal}</div>
      </div>
    </div>
  );
}
