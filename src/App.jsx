/**
 * STUDYENGINE.JSX — Study Engine v3
 * ─────────────────────────────────────────────────────────────────────────────
 * Conceived and shamelessly vibe coded by pio687 with the help of Claude and friends
 * Question data lives in questions.js — swap that file to change quizzes.
 * This file should not ne be modified
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO USE THIS TEMPLATE
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Edit questions.js with your question bank.
 * 2. Update STORAGE_KEY in questions.js if this is a new quiz.
 * 3. Tfqzs. (Only Gemini Code Assistant knows what this means)
 * - 4 T/F (balanced: 2 true, 2 false)
 * - 3 MC (rotating across topics)
 * - 1 integrative/scenario MC (tagged topic:"Integrative")
 * - 1 rotating special slot: auto-derived from populated question types
 *   (calc, def/ordering, integrative, matching — only active types rotate in)
 * - Backfill ensures exactly 10 questions unless fewer remain in entire bank
 * - Mastery: 2 consecutive correct = retired; wrong = front of queue
 * - ALL question types use the same mastery pool — no special cases
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STYLE SYSTEM
 * ─────────────────────────────────────────────────────────────────────────────
 * C  = dark theme colors (default)
 * CV = light theme colors (light mode toggle)
 * T  = active theme (T = lightMode ? CV : C)
 * All styles use T.xxx so they switch automatically with the toggle.
 * lm = lightMode boolean, declared once at component level.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// Import ALL our logic and constants from the new logic file
import {
  QUIZ_TITLE, QUIZ_SUBJECT, QUIZ_EMOJI, QUIZ_DESCRIPTION,
  ALL_Q, getQById,
  SLOT_ROTATION,
  saveProgress, advanceSession,
  computeTopicResults, checkCorrect, buildRound,
} from "./engineLogic.js";

import { useQuizEngine } from './components/hooks/useQuizEngine.js';
import MenuScreen from './components/MenuScreen.jsx';
import WinScreen from './components/WinScreen.jsx';
import ResultsScreen from './components/ResultsScreen.jsx';
import SessionEndScreen from './components/SessionEndScreen.jsx';
import BankScreen from './components/BankScreen.jsx';
import QuizScreen from './components/QuizScreen.jsx';
import './App.css';

const PATCH_NOTES = `v3 Engine — April 1, 2026`;

// ─────────────────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:"#0d1117", card:"#161b22", border:"#30363d",
  accent:"#3fb950", accentDim:"#238636",
  wrong:"#f85149", neutral:"#58a6ff",
  text:"#e6edf3", muted:"#8b949e",
  yellow:"#e3b341", yellowBg:"rgba(227,179,65,0.07)", yellowBorder:"rgba(227,179,65,0.25)",
};
const CV = {
  bg:"#ffffff", card:"#ffffff", border:"#e0e0e0",
  accent:"#0770d1", accentDim:"#0558a8",
  wrong:"#cc3333", neutral:"#0770d1",
  text:"#1a1a1a", muted:"#5a5a5a",
  yellow:"#7a5200", yellowBg:"rgba(212,146,10,0.08)", yellowBorder:"rgba(212,146,10,0.3)",
  selBg:"#fff8e6", selBorder:"#d4920a", selText:"#3d2600",
  btnBg:"#0770d1", btnText:"#ffffff",
};

// ─────────────────────────────────────────────────────────────────────────────
// DEV TOOL
// ─────────────────────────────────────────────────────────────────────────────

function DevTool({ deck, setDeck, questions, setQuestions, setCurrentView, continueToNextSession, totalCount, lightMode, mode, devAdvanceSession, setConfidence }) {
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(10);
  const [msg, setMsg] = useState("");
  const lm = lightMode; // scoped to DevTool

  function masterRandom() {
    // In Study Mode, only master questions in the current session pool
    const sessionPoolIds = mode === "study" && deck.sessionPools
      ? (deck.sessionPools[String(deck.sessionIndex + 1)] || null)
      : null;

    const allActive = [...deck.tf, ...deck.mc, ...deck.calc, ...deck.def, ...deck.special, ...deck.fitb]
      .filter(d => !deck.masteredIds.includes(d.id))
      .filter(d => !sessionPoolIds || sessionPoolIds.includes(d.id));

    if (allActive.length === 0) { setMsg("No active questions to master."); setTimeout(() => setMsg(""), 3000); return; }
    const n = Math.min(count, allActive.length);
    const toMaster = allActive.sort(() => Math.random() - 0.5).slice(0, n);
    const newMasteredIds = [...deck.masteredIds, ...toMaster.map(d => d.id)];
    const newDeck = {
      ...deck,
      tf:      deck.tf.filter(d => !newMasteredIds.includes(d.id)),
      mc:      deck.mc.filter(d => !newMasteredIds.includes(d.id)),
      calc:    deck.calc.filter(d => !newMasteredIds.includes(d.id)),
      def:     deck.def.filter(d => !newMasteredIds.includes(d.id)),
      special: deck.special.filter(d => !newMasteredIds.includes(d.id)),
      fitb:    deck.fitb.filter(d => !newMasteredIds.includes(d.id)),
      masteredIds: newMasteredIds,
    };
    setDeck(newDeck);
    const sessionComplete = mode === "study" && sessionPoolIds
      && sessionPoolIds.every(id => newMasteredIds.includes(id));
    const allMastered = newDeck.tf.length === 0 && newDeck.mc.length === 0 && newDeck.calc.length === 0 && newDeck.def.length === 0 && newDeck.special.length === 0 && newDeck.fitb.length === 0;
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

  const activeCount = deck.tf.length + deck.mc.length + deck.calc.length + deck.def.length + deck.special.length + deck.fitb.length;
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
        active: {activeCount} · mastered: {deck.masteredIds.length} · total: {totalCount}
      </div>
      <div style={{ fontSize:12, fontFamily:"monospace", color:txt, marginBottom:12 }}>
        tf: {deck.tf.length} · mc: {deck.mc.length} · calc: {deck.calc.length} · def: {deck.def.length} · fitb: {deck.fitb.length} · special: {deck.special.length}
      </div>
      {mode === "study" && (
        <div style={{ fontSize:11, fontFamily:"monospace", color:txt, marginBottom:12 }}>
          session: {deck.sessionIndex + 1} · pool: {deck.sessionPools ? (deck.sessionPools[String(deck.sessionIndex + 1)] || []).length : "not built"}
        </div>
      )}
      <div style={{ fontSize:11, fontFamily:"monospace", color:txt, marginBottom:12 }}>
        slot rotation: [{SLOT_ROTATION.join(" → ")}]
      </div>
      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <input type="number" min={1} max={activeCount} value={count} onChange={e => setCount(parseInt(e.target.value) || 1)} style={inpSt} />
        <button onClick={masterRandom} style={btnSt}>master random</button>
        {mode === "study" && deck.sessionIndex < 2 && (
          <button onClick={devAdvanceSession} style={btnSt}>advance session ↗</button>
        )}
        {mode === "study" && (
          <button onClick={fillConfidence} style={btnSt}>fill confidence</button>
        )}
        {msg && <span style={{ fontSize:11, fontFamily:"monospace", color:lm?"#0770d1":"#3fb950" }}>{msg}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StudyEngine() {
  const [lightMode, setLightMode] = useState(() => {
    try { return localStorage.getItem("quiz_lightmode") === "true"; } catch { return false; }
  });

  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 480);

  const engine = useQuizEngine();

  // EFFECTS
  useEffect(() => {
    document.body.dataset.theme = lightMode ? "light" : "dark";
    document.body.style.backgroundColor = "var(--bg)"; 
  }, [lightMode]);

  useEffect(() => {
    function handleResize() { setMobile(window.innerWidth <= 480); }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.title = QUIZ_TITLE;
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${QUIZ_EMOJI}</text></svg>`;
    }
  }, []);

  // Render a loading screen to prevent flashes of content while initial state is determined.
  if (engine.currentView === "LOADING" || !engine.deck) {
    return <div style={{ minHeight:"100vh", background:"var(--bg)" }} />;
  }

  // CSS Variable Shim for un-migrated components
  const T = {
    bg: "var(--bg)", card: "var(--card)", border: "var(--border)",
    accent: "var(--accent)", accentDim: "var(--accent-dim)",
    wrong: "var(--wrong)", neutral: "var(--neutral)",
    text: "var(--text)", muted: "var(--muted)",
    yellow: "var(--yellow)", yellowBg: "var(--yellow-bg)", yellowBorder: "var(--yellow-border)"
  };
  const lm = lightMode; // single declaration, used everywhere below

  function toggleLight() {
    setLightMode(prev => {
      const next = !prev;
      try { localStorage.setItem("quiz_lightmode", String(next)); } catch {}
      return next;
    });
  }

  const s = {
    app:      { minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:mobile?"flex-start":"center", justifyContent:"center", fontFamily:"'Segoe UI',system-ui,sans-serif", padding:mobile?"12px 10px":"20px 16px" },
    wrap:     { width:"100%", maxWidth:mobile?"100%":620 },
    logo:     { textAlign:"center", marginBottom:14 },
    logoTop:  { fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)", fontFamily:"monospace", marginBottom:2 },
    logoTitle:{ fontSize:mobile?22:19, fontWeight:800, color:"var(--text)", marginBottom:10 },
    card:     { background:"var(--card)", border:"1px solid var(--border)", borderRadius:10, padding:mobile?"16px 14px 14px":"22px 22px 18px", marginBottom:12 },
    tag:      { display:"inline-block", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--neutral)", background:"color-mix(in srgb, var(--neutral) 10%, transparent)", border:"1px solid color-mix(in srgb, var(--neutral) 25%, transparent)", borderRadius:4, padding:"2px 7px", marginBottom:10, fontFamily:"monospace" },
    qText:    { fontSize:mobile?17:15, color:"var(--text)", lineHeight:1.65, marginBottom:16, whiteSpace:"pre-line" },
    progRow:  { display:"flex", gap:8, alignItems:"center", marginBottom:14 },
    progBar:  { flex:1, height:3, background:"var(--border)", borderRadius:2, overflow:"hidden" },
    progFill: (p) => ({ height:"100%", width:`${p}%`, background:"var(--accent)", borderRadius:2, transition:"width 0.3s" }),
    progTxt:  { fontSize:11, color:"var(--muted)", fontFamily:"monospace", whiteSpace:"nowrap" },
    opts:     { display:"flex", flexDirection:"column", gap:mobile?10:7 },
    opt:      (sel) => ({ padding:mobile?"14px 14px":"11px 14px", borderRadius:8, border:`1px solid ${sel?"var(--neutral)":"var(--border)"}`, background:sel?"color-mix(in srgb, var(--neutral) 7%, transparent)":"transparent", color:sel?"var(--neutral)":"var(--text)", cursor:"pointer", fontSize:mobile?16:14, display:"flex", alignItems:"flex-start", gap:9, transition:"all 0.12s", textAlign:"left", width:"100%", boxSizing:"border-box" }),
    dot:      (sel) => ({ width:mobile?16:13, height:mobile?16:13, borderRadius:"50%", border:`2px solid ${sel?"var(--neutral)":"var(--muted)"}`, background:sel?"var(--neutral)":"transparent", flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#000" }),
    tfRow:    { display:"flex", gap:8 },
    tfBtn:    (sel) => ({ flex:1, padding:mobile?"16px":"12px", borderRadius:7, border:`1px solid ${sel?"var(--neutral)":"var(--border)"}`, background:sel?"color-mix(in srgb, var(--neutral) 10%, transparent)":"transparent", color:sel?"var(--neutral)":"var(--text)", cursor:"pointer", fontWeight:700, fontSize:mobile?17:14, textAlign:"center", transition:"all 0.12s" }),
    calcIn:   { width:"100%", padding:mobile?"14px":"10px 13px", background:"color-mix(in srgb, var(--text) 3%, transparent)", border:"1px solid var(--border)", borderRadius:7, color:"var(--text)", fontSize:mobile?18:17, fontFamily:"monospace", outline:"none", boxSizing:"border-box" },
    exp:      { marginTop:12, padding:"9px 13px", borderRadius:7, background:"var(--yellow-bg)", border:"1px solid var(--yellow-border)", fontSize:mobile?14:13, color:"var(--yellow)", lineHeight:1.6 },
    navRow:   { display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 },
    btn:      (primary,disabled) => ({ padding:mobile?"12px 20px":"8px 16px", borderRadius:7, border:primary?"none":"1px solid var(--border)", background:disabled?"color-mix(in srgb, var(--text) 10%, transparent)":primary?"var(--btn-bg)":"transparent", color:disabled?"var(--muted)":primary?"var(--btn-text)":"var(--text)", cursor:disabled?"not-allowed":"pointer", fontSize:mobile?15:13, fontWeight:primary?700:400, fontFamily:primary?"monospace":"inherit", transition:"all 0.12s" }),
    dots:     { display:"flex", gap:5, alignItems:"center" },
    navDot:   (cur,ans) => ({ width:cur?16:7, height:7, borderRadius:4, background:cur?"var(--accent)":ans?"var(--neutral)":"var(--border)", transition:"all 0.18s", cursor:"pointer" }),
    resetLink:{ fontSize:11, color:"var(--muted)", fontFamily:"monospace", cursor:"pointer", textDecoration:"underline" },
    orderLabel:{ fontSize:11, color:"var(--muted)", fontFamily:"monospace", marginBottom:6 },
    orderChips:{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14, minHeight:32 },
    orderChip: () => ({ padding:"5px 11px", borderRadius:20, background:"color-mix(in srgb, var(--neutral) 10%, transparent)", border:"1px solid var(--neutral)", color:"var(--neutral)", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:5 }),
    orderGrid: { display:"flex", flexDirection:"column", gap:7 },
    orderBtn:  (sel) => ({ padding:"11px 14px", borderRadius:8, border:`1px solid ${sel?"var(--neutral)":"var(--border)"}`, background:sel?"color-mix(in srgb, var(--neutral) 7%, transparent)":"transparent", color:sel?"var(--neutral)":"var(--text)", cursor:"pointer", fontSize:14, textAlign:"left", fontWeight:sel?600:400, transition:"all 0.12s", display:"flex", alignItems:"center", gap:10, width:"100%", boxSizing:"border-box" }),
    orderBadge:{ width:20, height:20, borderRadius:"50%", background:"var(--neutral)", color:"var(--bg)", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
    resultItem:(cor) => ({ padding:"11px 13px", borderRadius:7, border:`1px solid ${cor?"color-mix(in srgb, var(--accent) 20%, transparent)":"color-mix(in srgb, var(--wrong) 20%, transparent)"}`, background:cor?"color-mix(in srgb, var(--accent) 4%, transparent)":"color-mix(in srgb, var(--wrong) 4%, transparent)", marginBottom:7 }),
    wrongItem: { padding:"10px 13px", borderRadius:7, border:"1px solid color-mix(in srgb, var(--wrong) 20%, transparent)", background:"color-mix(in srgb, var(--wrong) 4%, transparent)", marginBottom:7 },
  };

  function getAnswerDisplay(q, a) {
    let ua = "—", ca = "";
    if (q.type==="tf")                    { ua=a===undefined?"—":a?"True":"False"; ca=q.answer?"True":"False"; }
    else if (q.type==="mc"||q.type==="def") { ua=a!==undefined?q.options[a]:"—"; ca=q.options[q.answer]; }
    else if (q.type==="calc")             { ua=a??"—"; ca=q.answerDisplay; }
    else if (q.type==="fitb")             { ua=a??"—"; ca=q.accepted[0]; }
    else if (q.type==="ordering")         { ua=Array.isArray(a)?a.join(" → "):"—"; ca=q.correctOrder.join(" → "); }
    else if (q.type==="match")            { ua="(matching answer)"; ca="All pairs matched"; }
    return { ua, ca };
  }

  function getWrongAnswerDisplay(q, a) {
    let ua = "No answer", ca = "";
    if (q.type==="tf")                    { ua=a===undefined?"No answer":a?"True":"False"; ca=q.answer?"True":"False"; }
    else if (q.type==="mc"||q.type==="def") { ua=a!==undefined?q.options[a]:"No answer"; ca=q.options[q.answer]; }
    else if (q.type==="calc")             { ua=a??"No answer"; ca=q.answerDisplay; }
    else if (q.type==="fitb")             { ua=a??"No answer"; ca=q.accepted[0]; }
    else if (q.type==="ordering")         { ua=Array.isArray(a)?a.join(" → "):"No answer"; ca=q.correctOrder.join(" → "); }
    else if (q.type==="match")            { ua="(matching answer)"; ca=q.pairs.map(p=>p.term+" → "+p.desc).join(" | "); }
    return { ua, ca };
  }

  const totalCount = ALL_Q.length;
  const masteredCount = engine.deck.masteredIds.length;
  const masteryPct = Math.round((masteredCount / totalCount) * 100);
  const weakSpotIds = ALL_Q.filter(q => (engine.deck.missedCounts[q.id] || 0) > 0 || engine.deck.hcwIds.includes(q.id)).map(q => q.id);

  // Render helper for MasteryBars
  function renderMasteryBars() {
    return (
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:10, color:"var(--muted)", fontFamily:"monospace", whiteSpace:"nowrap", minWidth:55, fontWeight:700 }}>
          {engine.mode === "practice"
            ? <div>Complete</div>
            : <><div style={{ marginBottom:4 }}>Correct</div><div>Mastered</div></>
          }
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
          {engine.mode !== "practice" && (
            <div style={{ height:5, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg,#3fb950,#bc8cff)", borderRadius:3, transition:"width 0.5s ease", width:`${Math.round((engine.deck.correctOnceIds?.length||0)/totalCount*100)}%` }} />
            </div>
          )}
          <div style={{ height:5, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", background:"linear-gradient(90deg,#e3b341,#d4920a)", borderRadius:3, transition:"width 0.5s ease", width:engine.mode==="practice"?`${Math.round((engine.deck.correctOnceIds?.length||0)/totalCount*100)}%`:`${masteryPct}%` }} />
          </div>
        </div>
        <div style={{ fontSize:11, fontFamily:"monospace", minWidth:50, textAlign:"right" }}>
          {engine.mode !== "practice" && <div style={{ marginBottom:4, color:"var(--accent)" }}>{engine.deck.correctOnceIds?.length||0}/{totalCount}</div>}
          <div style={{ color:"var(--yellow)" }}>{engine.mode==="practice"?(engine.deck.correctOnceIds?.length||0):masteredCount}/{totalCount}</div>
        </div>
      </div>
    );
  }
  if (engine.currentView === "MENU") {
    const resumeSession = engine.resumeRef.current;
    const resumeSessionNum = resumeSession ? engine.deck.sessionIndex + 1 : null;
    return <MenuScreen {...{ QUIZ_SUBJECT, QUIZ_TITLE, resumeSession, resumeSessionNum, selectMode: engine.selectMode, lightMode, toggleLight, goToBank: engine.goToBank }} />;
  }

  if (engine.currentView === "WIN") {
    const missedQs = Object.entries(engine.deck.missedCounts||{}).sort((a,b)=>b[1]-a[1]).map(([id,count])=>({ q:getQById(id), count })).filter(x=>x.q);
    const isPerfect = missedQs.length === 0;
    return <WinScreen {...{ s, QUIZ_SUBJECT, renderMasteryBars, T, isPerfect, missedQs, getAnswerDisplay, resetAll: engine.resetAll, goToBank: engine.goToBank }} />;
  }

  if (engine.currentView === "RESULTS") {
    return <ResultsScreen {...{ s, QUIZ_SUBJECT, renderMasteryBars, pct: engine.pct, score: engine.score, total: engine.total, T, questions: engine.questions, answers: engine.answers, checkCorrect, getAnswerDisplay, confidence: engine.confidence, wrongQs: engine.wrongQs, getWrongAnswerDisplay, startNext: engine.startNext, resetAll: engine.resetAll, goToBank: engine.goToBank, lm, C, CV }} />;
  }

  if (engine.currentView === "SESSION_END") {
    return <SessionEndScreen {...{ s, QUIZ_SUBJECT, QUIZ_TITLE, renderMasteryBars, deck: engine.deck, weakSpotIds, sessionScoreRef: engine.sessionScoreRef, questions: engine.questions, answers: engine.answers, getWrongAnswerDisplay, confidence: engine.confidence, resetAll: engine.resetAll, continueToNextSession: engine.continueToNextSession, setMode: engine.setMode, setCurrentView: engine.setCurrentView, T, lm, computeTopicResults, latestDeckRef: engine.latestDeckRef, resumeRef: engine.resumeRef, saveProgress, advanceSession, checkCorrect }} />;
  }

  if (engine.currentView === "BANK") {
    const DevToolComponent = () => <DevTool {...engine} totalCount={totalCount} lightMode={lightMode} />;
    return <BankScreen {...{ s, QUIZ_SUBJECT, leaveBank: engine.leaveBank, T, DevTool: DevToolComponent, patchNotes: PATCH_NOTES, description: QUIZ_DESCRIPTION }} />;
  }

  return <QuizScreen {...{ ...engine, s, T, C, CV, lm, lightMode, toggleLight, renderMasteryBars, mobile, weakSpotIds }} />;
}
