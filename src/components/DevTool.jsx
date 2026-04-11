import { useState } from "react";
import { buildRound } from "../engineLogic.js";

export default function DevTool({ deck, setDeck, questions, setQuestions, setCurrentView, totalCount, lightMode, mode, setConfidence }) {
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(10);
  const [msg, setMsg] = useState("");
  const lm = lightMode; // scoped to DevTool

  // Shared pool calculations
  const sessionPoolIds = mode === "study" && deck.sessionPools
    ? (deck.sessionPools[String(deck.sessionIndex + 1)] || [])
    : null;
  const activeIds = mode === "practice" ? (deck.correctOnceIds || []) : deck.masteredIds;

  const getC = (arr) => arr.filter(d => !activeIds.includes(d.id) && (!sessionPoolIds || sessionPoolIds.includes(d.id))).length;
  const tfC = getC(deck.tf);
  const mcC = getC(deck.mc);
  const calcC = getC(deck.calc);
  const defC = getC(deck.def);
  const specialC = getC(deck.special);
  const fitbC = getC(deck.fitb);

  const activeCount = tfC + mcC + calcC + defC + specialC + fitbC;
  const displayTotal = sessionPoolIds ? sessionPoolIds.length : totalCount;
  const displayMastered = sessionPoolIds ? sessionPoolIds.filter(id => activeIds.includes(id)).length : activeIds.length;

  function masterRandom() {
    const allActive = [...deck.tf, ...deck.mc, ...deck.calc, ...deck.def, ...deck.special, ...deck.fitb]
      .filter(d => !activeIds.includes(d.id))
      .filter(d => !sessionPoolIds || sessionPoolIds.includes(d.id));

    if (allActive.length === 0) { setMsg("No active questions to master."); setTimeout(() => setMsg(""), 3000); return; }
    const n = Math.min(count, allActive.length);
    const toMaster = allActive.sort(() => Math.random() - 0.5).slice(0, n);
    const toMasterIds = toMaster.map(d => d.id);

    let newDeck;
    if (mode === "practice") {
      newDeck = {
        ...deck,
        tf:      deck.tf.filter(d => !toMasterIds.includes(d.id)),
        mc:      deck.mc.filter(d => !toMasterIds.includes(d.id)),
        calc:    deck.calc.filter(d => !toMasterIds.includes(d.id)),
        def:     deck.def.filter(d => !toMasterIds.includes(d.id)),
        special: deck.special.filter(d => !toMasterIds.includes(d.id)),
        fitb:    deck.fitb.filter(d => !toMasterIds.includes(d.id)),
        correctOnceIds: [...(deck.correctOnceIds || []), ...toMasterIds],
      };
    } else {
      const newMasteredIds = [...deck.masteredIds, ...toMasterIds];
      newDeck = {
        ...deck,
        tf:      deck.tf.filter(d => !newMasteredIds.includes(d.id)),
        mc:      deck.mc.filter(d => !newMasteredIds.includes(d.id)),
        calc:    deck.calc.filter(d => !newMasteredIds.includes(d.id)),
        def:     deck.def.filter(d => !newMasteredIds.includes(d.id)),
        special: deck.special.filter(d => !newMasteredIds.includes(d.id)),
        fitb:    deck.fitb.filter(d => !newMasteredIds.includes(d.id)),
        masteredIds: newMasteredIds,
      };
    }
    setDeck(newDeck);
    const sessionComplete = mode === "study" && sessionPoolIds
      && sessionPoolIds.every(id => newDeck.masteredIds.includes(id));
    const allMastered = mode === "practice" ? (newDeck.correctOnceIds?.length || 0) >= totalCount : newDeck.tf.length === 0 && newDeck.mc.length === 0 && newDeck.calc.length === 0 && newDeck.def.length === 0 && newDeck.special.length === 0 && newDeck.fitb.length === 0;
    if (sessionComplete) {
      setCurrentView("SESSION_END");
    } else if (allMastered) {
      setCurrentView("WIN");
    } else {
      setQuestions(buildRound(newDeck, mode));
      setCurrentView("QUIZ");
    }
    setMsg(`Mastered ${n} questions.${sessionComplete ? " Session complete!" : allMastered ? " All done!" : " Round rebuilt."}`);
    setTimeout(() => setMsg(""), 3000);
  }

  function fillConfidence() {
    const newConfidence = {};
    questions.forEach(q => newConfidence[q.id] = 'know');
    setConfidence(newConfidence);
    setMsg("Confidence filled for this round.");
    setTimeout(() => setMsg(""), 3000);
  }

  const border  = "1px solid var(--border)";
  const bg      = "var(--card)";
  const txt     = "var(--text)";
  const hdr     = "var(--text)";
  const devLink = "var(--muted)";
  const inpSt   = { width:60, padding:"5px 8px", borderRadius:5, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", fontFamily:"monospace", fontSize:12 };
  const btnSt   = { padding:"5px 12px", borderRadius:5, border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", fontFamily:"monospace", fontSize:12, cursor:"pointer" };

  if (!show) return (
    <div style={{ textAlign:"center", marginTop:24, paddingTop:16, borderTop:lm?"1px solid #eee":"1px solid rgba(255,255,255,0.06)" }}>
      <span onClick={() => setShow(true)} style={{ fontSize:10, color:devLink, fontFamily:"monospace", cursor:"pointer", letterSpacing:"0.1em" }}>dev</span>
    </div>
  );

  return (
    <div style={{ marginTop:24, padding:"14px 16px", borderRadius:8, border, background:bg }}>
      <div style={{ fontSize:11, fontFamily:"monospace", color:hdr, marginBottom:12, display:"flex", justifyContent:"space-between" }}>
        <span>dev tools</span>
        <span style={{ cursor:"pointer" }} onClick={() => setShow(false)}>×</span>
      </div>
      <div style={{ fontSize:12, fontFamily:"monospace", color:txt, marginBottom:10 }}>
        active: {activeCount} · {mode === "practice" ? "completed" : "mastered"}: {displayMastered} · total: {displayTotal}
      </div>
      <div style={{ fontSize:12, fontFamily:"monospace", color:txt, marginBottom:12 }}>
        tf: {tfC} · mc: {mcC} · calc: {calcC} · def: {defC} · fitb: {fitbC} · special: {specialC}
      </div>
      {mode === "study" && (
        <div style={{ fontSize:11, fontFamily:"monospace", color:txt, marginBottom:12 }}>
          session: {deck.sessionIndex + 1} · pool: {deck.sessionPools ? (deck.sessionPools[String(deck.sessionIndex + 1)] || []).length : "not built"}
        </div>
      )}
      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <input type="number" min={1} max={activeCount} value={count} onChange={e => setCount(parseInt(e.target.value) || 1)} style={inpSt} />
        <button onClick={masterRandom} style={btnSt}>master random</button>
        {mode === "study" && deck.sessionPools && deck.sessionIndex < 2 && (
          <button onClick={() => {
            setCurrentView("SESSION_END");
            setMsg(`Session ${deck.sessionIndex + 1} ended!`);
            setTimeout(() => setMsg(""), 3000);
          }} style={btnSt}>advance session ↗</button>
        )}
        {mode === "study" && (
          <button onClick={fillConfidence} style={btnSt}>fill confidence</button>
        )}
        {msg && <span style={{ fontSize:11, fontFamily:"monospace", color:lm?"#0770d1":"#3fb950" }}>{msg}</span>}
      </div>
    </div>
  );
}
