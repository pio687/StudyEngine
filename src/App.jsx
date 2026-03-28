/**
 * STUDYENGINE.JSX — Study Engine v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Designed by pio687 · Built by Claude Sonnet 4.6
 *
 * Single-file React study engine. Built with Vite + React.
 * Question data lives in questions.js — swap that file to change quizzes.
 * This file should not need to be modified between quizzes.
 *
 * SETUP (first time only):
 *   npm create vite@latest quiz-app -- --template react
 *   cd quiz-app
 *   npm install
 *   Replace src/App.jsx with this file.
 *   Add src/questions.js with your question bank.
 *   Add netlify.toml to project root (see bottom of this file).
 *   npm run dev → localhost:5173 to test locally.
 *   npm run build → drag dist/ to app.netlify.com/drop to deploy.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO USE THIS TEMPLATE
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Edit questions.js with your question bank.
 * 2. Update STORAGE_KEY in questions.js if this is a new quiz.
 * 3. Update DECK_VERSION in questions.js if the question structure changes.
 * 4. Update QUIZ_TITLE and QUIZ_SUBJECT in questions.js.
 * 5. Update PATCH_NOTES in questions.js.
 * This file (the engine) requires no changes between quizzes.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ROUND STRUCTURE (10 questions per round)
 * ─────────────────────────────────────────────────────────────────────────────
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

import { useState, useEffect } from "react";
import {
  STORAGE_KEY, DECK_VERSION, QUIZ_TITLE, QUIZ_SUBJECT, PATCH_NOTES,
  TF_QUESTIONS, MC_QUESTIONS, CALC_QUESTIONS, DEFINITION_QUESTIONS, SPECIAL_QUESTIONS,
} from "./questions.js";

// ─────────────────────────────────────────────────────────────────────────────
// MATCH COLORS
// ─────────────────────────────────────────────────────────────────────────────

const MATCH_COLORS = [
  { bg:"rgba(29,158,117,0.18)",  border:"#1D9E75", text:"#5DCAA5" },
  { bg:"rgba(55,138,221,0.18)",  border:"#378ADD", text:"#85B7EB" },
  { bg:"rgba(99,153,34,0.18)",   border:"#639922", text:"#97C459" },
  { bg:"rgba(186,140,23,0.18)",  border:"#BA8C17", text:"#FAC775" },
  { bg:"rgba(83,74,183,0.18)",   border:"#534AB7", text:"#AFA9EC" },
  { bg:"rgba(0,168,150,0.18)",   border:"#00A896", text:"#5DCAA5" },
  { bg:"rgba(137,106,196,0.18)", border:"#896AC4", text:"#C9B8F0" },
];

const LIGHT_MATCH_COLORS = [
  { bg:"#f0f0f0",   border:"#888888", text:"#333333" },
  { bg:"#e3f0fb",   border:"#378ADD", text:"#0C447C" },
  { bg:"#c3e6cb",   border:"#1a4d1c", text:"#0d2b0e" },
  { bg:"#fdf3dc",   border:"#BA8C17", text:"#633806" },
  { bg:"#f5ede3",   border:"#8B5E3C", text:"#4a2e1a" },
  { bg:"#e8eaf6",   border:"#3949AB", text:"#1a237e" },
  { bg:"#edfaf8",   border:"#5dcaa5", text:"#085041" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleMCOptions(q) {
  if (q.type !== "mc" && q.type !== "def") return q;
  const lastOpt = q.options[q.options.length - 1].toLowerCase();
  const isAOTA = lastOpt.includes("all of the above") || lastOpt.includes("all affect") || lastOpt.includes("all are correct");
  if (isAOTA) {
    const front = shuffle(q.options.slice(0, -1).map((_, i) => i));
    const newOptions = [...front.map(i => q.options[i]), q.options[q.options.length - 1]];
    const correctText = q.type === "def" ? q.answer : q.options[q.answer];
    return { ...q, options: newOptions, answer: newOptions.indexOf(correctText) };
  }
  const shuffled = shuffle(q.options.map((_, i) => i));
  const newOptions = shuffled.map(i => q.options[i]);
  const correctText = q.type === "def" ? q.answer : q.options[q.answer];
  return { ...q, options: newOptions, answer: newOptions.indexOf(correctText) };
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || saved.version !== DECK_VERSION) return null;
    return saved;
  } catch { return null; }
}

function saveProgress(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, version: DECK_VERSION })); } catch {}
}

const ALL_TF      = TF_QUESTIONS;
const ALL_MC      = MC_QUESTIONS;
const ALL_CALC    = CALC_QUESTIONS;
const ALL_DEF     = DEFINITION_QUESTIONS;
const ALL_SPECIAL = SPECIAL_QUESTIONS;
const ALL_Q       = [...ALL_TF, ...ALL_MC, ...ALL_CALC, ...ALL_DEF, ...ALL_SPECIAL];

function getQById(id) { return ALL_Q.find(q => q.id === id); }

function initDeck(saved) {
  if (saved && saved.tf && saved.mc && saved.calc && saved.def && saved.special) return saved;
  return {
    tf:      ALL_TF.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    mc:      ALL_MC.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    calc:    ALL_CALC.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    def:     ALL_DEF.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    special: ALL_SPECIAL.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    masteredIds: [],
    missedCounts: {},
    correctOnceIds: [],
    roundIndex: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC SLOT ROTATION
// Derives which special slot types are active from populated question arrays.
// Only types with at least one question are included in the rotation.
// Rotation cycles evenly across active types, one slot per round.
// ─────────────────────────────────────────────────────────────────────────────

function buildSlotRotation() {
  const rotation = [];
  if (ALL_CALC.length > 0)    rotation.push("calc");
  if (ALL_DEF.length > 0 || ALL_SPECIAL.filter(q => q.type === "ordering" || q.type === "match").length > 0)
    rotation.push("special");
  if (ALL_MC.some(q => q.topic === "Integrative")) rotation.push("integrative");
  // Always have at least one slot type — fall back to "extra" if bank is minimal
  if (rotation.length === 0)  rotation.push("extra");
  return rotation;
}

const SLOT_ROTATION = buildSlotRotation();

function checkCorrect(q, answer) {
  if (answer === undefined || answer === null || answer === "") return false;
  if (q.type === "tf")  return answer === q.answer;
  if (q.type === "mc" || q.type === "def") return answer === q.answer;
  if (q.type === "calc") {
    const num = parseFloat(String(answer).replace(/[^0-9.]/g, ""));
    return Math.abs(num - q.answer) <= q.tolerance;
  }
  if (q.type === "ordering") return JSON.stringify(answer) === JSON.stringify(q.correctOrder);
  if (q.type === "match")    return answer && typeof answer === "object" && Object.keys(answer).length === q.pairs.length;
  return false;
}

function buildRound(deck) {
  const qMap = id => getQById(id);

  // Derive slot type from dynamic rotation
  let slotType = SLOT_ROTATION[deck.roundIndex % SLOT_ROTATION.length];

  const activeCalc    = deck.calc.filter(d => !deck.masteredIds.includes(d.id));
  const activeDef     = deck.def.filter(d => !deck.masteredIds.includes(d.id));
  const activeSpecial = deck.special.filter(d => !deck.masteredIds.includes(d.id));
  const activeMC      = deck.mc.filter(d => !deck.masteredIds.includes(d.id) && qMap(d.id)?.topic !== "Integrative");
  const activeInteg   = deck.mc.filter(d => !deck.masteredIds.includes(d.id) && qMap(d.id)?.topic === "Integrative");

  const hasCalc    = activeCalc.length > 0;
  const hasSpecial = activeSpecial.length > 0 || activeDef.length > 0;
  const hasInteg   = activeInteg.length > 0;

  // Fallback: if the scheduled type is exhausted, find next available
  if (slotType === "calc"        && !hasCalc)    slotType = hasSpecial ? "special"    : hasInteg ? "integrative" : "extra";
  if (slotType === "special"     && !hasSpecial)  slotType = hasCalc   ? "calc"       : hasInteg ? "integrative" : "extra";
  if (slotType === "integrative" && !hasInteg)    slotType = hasCalc   ? "calc"       : hasSpecial ? "special"  : "extra";

  let specialQ = null;
  if (slotType === "calc") {
    const sorted = shuffle([...activeCalc]);
    if (sorted.length > 0) specialQ = qMap(sorted[0].id);
  } else if (slotType === "special") {
    const specialEntry = shuffle([...activeSpecial])[0];
    const defEntry     = shuffle([...activeDef])[0];
    if (specialEntry && (!defEntry || deck.roundIndex % 2 === 0)) {
      const sq = qMap(specialEntry.id);
      if (sq.type === "ordering")    specialQ = { ...sq, options: shuffle([...sq.correctOrder]) };
      else if (sq.type === "match")  specialQ = { ...sq, shuffledPairs: shuffle([...sq.pairs]) };
      else                           specialQ = shuffleMCOptions(sq);
    } else if (defEntry) {
      specialQ = shuffleMCOptions(qMap(defEntry.id));
    } else if (specialEntry) {
      const sq = qMap(specialEntry.id);
      if (sq.type === "ordering")    specialQ = { ...sq, options: shuffle([...sq.correctOrder]) };
      else if (sq.type === "match")  specialQ = { ...sq, shuffledPairs: shuffle([...sq.pairs]) };
    }
  } else if (slotType === "integrative") {
    const sorted = shuffle([...activeInteg]);
    if (sorted.length > 0) specialQ = shuffleMCOptions(qMap(sorted[0].id));
  }

  const activeTF = deck.tf.filter(d => !deck.masteredIds.includes(d.id));
  const trueTF   = shuffle(activeTF.filter(d => qMap(d.id)?.answer === true));
  const falseTF  = shuffle(activeTF.filter(d => qMap(d.id)?.answer === false));
  const pickedTF = [...trueTF.slice(0, 2), ...falseTF.slice(0, 2)];

  const needed = 10 - pickedTF.length - (specialQ ? 1 : 0);
  const mcTopicMap = {};
  shuffle(activeMC).forEach(d => {
    const t = qMap(d.id)?.topic || "Other";
    if (!mcTopicMap[t]) mcTopicMap[t] = [];
    mcTopicMap[t].push(d);
  });
  const mcTopics  = shuffle(Object.keys(mcTopicMap));
  const pickedMC  = [];
  let r = 0;
  while (pickedMC.length < needed) {
    let added = false;
    for (const t of mcTopics) {
      if (pickedMC.length >= needed) break;
      if (mcTopicMap[t][r]) { pickedMC.push(mcTopicMap[t][r]); added = true; }
    }
    r++;
    if (!added) break;
  }

  // Backfill to hit 10 (or total active if fewer than 10 remain)
  // NOTE: exclude integrative MC from backfill — it is only ever picked as specialQ
  const allPicked  = [...pickedTF, ...pickedMC];
  const targetMain = specialQ ? 9 : 10;
  if (allPicked.length < targetMain) {
    const usedIds = new Set(allPicked.map(d => d.id));
    // also exclude the specialQ id from backfill to prevent duplicates
    if (specialQ) usedIds.add(specialQ.id);
    const backfillMC = activeMC; // already excludes Integrative
    const pools = [activeTF, backfillMC, activeCalc, activeDef];
    for (const pool of pools) {
      if (allPicked.length >= targetMain) break;
      const extras = shuffle(pool.filter(d => !usedIds.has(d.id)));
      const take   = extras.slice(0, targetMain - allPicked.length);
      allPicked.push(...take);
      take.forEach(d => usedIds.add(d.id));
    }
  }

  const main = shuffle(allPicked.map(d => shuffleMCOptions(qMap(d.id))).filter(Boolean));
  if (specialQ) {
    const insertAt = Math.min(Math.floor(main.length / 2) + 1, main.length);
    main.splice(insertAt, 0, specialQ);
  }
  return main.filter(Boolean);
}

function applyResults(deck, questions, answers) {
  const threshold = 2;
  let newDeck = {
    ...deck,
    tf:      deck.tf.map(d => ({ ...d })),
    mc:      deck.mc.map(d => ({ ...d })),
    calc:    deck.calc.map(d => ({ ...d })),
    def:     deck.def.map(d => ({ ...d })),
    special: deck.special.map(d => ({ ...d })),
    masteredIds:    [...deck.masteredIds],
    missedCounts:   { ...deck.missedCounts },
    correctOnceIds: [...(deck.correctOnceIds || [])],
    roundIndex: deck.roundIndex + 1,
  };

  questions.forEach(q => {
    const correct = checkCorrect(q, answers[q.id]);
    const pool =
      q.type === "tf"                                    ? newDeck.tf      :
      q.type === "mc"                                    ? newDeck.mc      :
      q.type === "calc"                                  ? newDeck.calc    :
      q.type === "def"                                   ? newDeck.def     :
      (q.type === "ordering" || q.type === "match")      ? newDeck.special : null;

    if (!pool) return;
    const idx = pool.findIndex(d => d.id === q.id);
    if (idx === -1) return;

    const maxPos = pool.reduce((m, d) => Math.max(m, d.pos), 0);
    if (correct) {
      pool[idx].streak += 1;
      if (!newDeck.correctOnceIds.includes(q.id)) newDeck.correctOnceIds = [...newDeck.correctOnceIds, q.id];
      if (pool[idx].streak >= threshold) {
        newDeck.masteredIds.push(q.id);
        pool.splice(idx, 1);
        return;
      }
      pool[idx].pos = maxPos + Math.random() * 100;
    } else {
      pool[idx].streak = 0;
      pool[idx].misses  = (pool[idx].misses || 0) + 1;
      pool[idx].pos     = Math.max(0, pool[idx].pos - 50);
      newDeck.missedCounts = { ...newDeck.missedCounts, [q.id]: (newDeck.missedCounts[q.id] || 0) + 1 };
    }

    pool.sort((a, b) => a.pos - b.pos);
    const midpoint = Math.floor(pool.length / 2);
    pool.forEach((d, i) => { if (i < midpoint) d.pos = i; });
  });

  return newDeck;
}

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

function DevTool({ deck, setDeck, setQuestions, setShowResults, totalCount, lightMode }) {
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(10);
  const [msg, setMsg] = useState("");
  const lm = lightMode; // scoped to DevTool

  function masterRandom() {
    const allActive = [...deck.tf, ...deck.mc, ...deck.calc, ...deck.def, ...deck.special]
      .filter(d => !deck.masteredIds.includes(d.id));
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
      masteredIds: newMasteredIds,
    };
    setDeck(newDeck);
    const allMastered = newDeck.tf.length === 0 && newDeck.mc.length === 0 && newDeck.calc.length === 0 && newDeck.def.length === 0 && newDeck.special.length === 0;
    if (allMastered) {
      setShowResults(true);
    } else {
      setQuestions(buildRound(newDeck));
    }
    setMsg(`Mastered ${n} questions.${allMastered ? " All done!" : " Round rebuilt."}`);
    setTimeout(() => setMsg(""), 3000);
  }

  const activeCount = deck.tf.length + deck.mc.length + deck.calc.length + deck.def.length + deck.special.length;
  const border  = lm ? "1px solid #d0d0d0"            : "1px solid rgba(255,255,255,0.1)";
  const bg      = lm ? "#f7f7f7"                       : "rgba(255,255,255,0.03)";
  const txt     = lm ? "#555"                          : "rgba(255,255,255,0.5)";
  const hdr     = lm ? "#333"                          : "rgba(255,255,255,0.4)";
  const devLink = lm ? "#ccc"                          : "rgba(255,255,255,0.15)";
  const inpSt   = lm
    ? { width:60, padding:"5px 8px", borderRadius:5, border:"1px solid #ccc", background:"#fff", color:"#333", fontFamily:"monospace", fontSize:12 }
    : { width:60, padding:"5px 8px", borderRadius:5, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.7)", fontFamily:"monospace", fontSize:12 };
  const btnSt   = lm
    ? { padding:"5px 12px", borderRadius:5, border:"1px solid #ccc", background:"#fff", color:"#333", fontFamily:"monospace", fontSize:12, cursor:"pointer" }
    : { padding:"5px 12px", borderRadius:5, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.7)", fontFamily:"monospace", fontSize:12, cursor:"pointer" };

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
        tf: {deck.tf.length} · mc: {deck.mc.length} · calc: {deck.calc.length} · def: {deck.def.length} · special: {deck.special.length}
      </div>
      <div style={{ fontSize:11, fontFamily:"monospace", color:txt, marginBottom:12 }}>
        slot rotation: [{SLOT_ROTATION.join(" → ")}]
      </div>
      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <input type="number" min={1} max={activeCount} value={count} onChange={e => setCount(parseInt(e.target.value) || 1)} style={inpSt} />
        <button onClick={masterRandom} style={btnSt}>master random</button>
        {msg && <span style={{ fontSize:11, fontFamily:"monospace", color:lm?"#0770d1":"#3fb950" }}>{msg}</span>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StudyEngine() {
  const [deck, setDeck]           = useState(() => initDeck(loadProgress()));
  const [questions, setQuestions] = useState(() => buildRound(initDeck(loadProgress())));
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState({});
  const [calcInput, setCalcInput] = useState("");
  const [orderSelected, setOrderSelected] = useState([]);
  const [matchState, setMatchState] = useState({ selectedTerm:null, selectedDesc:null, matched:{}, wrong:{ term:null, desc:null }, feedback:"" });
  const [showResults, setShowResults] = useState(false);
  const [showBank, setShowBank]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const [lightMode, setLightMode] = useState(() => {
    try { return localStorage.getItem("quiz_lightmode") === "true"; } catch { return false; }
  });

  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 480);

  useEffect(() => {
    function handleResize() { setMobile(window.innerWidth <= 480); }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => { saveProgress(deck); }, [deck]);

  const T  = lightMode ? CV : C;
  const lm = lightMode; // single declaration, used everywhere below
  const q  = questions[current];
  const total      = questions.length;
  const totalCount = ALL_Q.length;
  const masteredCount = deck.masteredIds.length;
  const masteryPct = Math.round((masteredCount / totalCount) * 100);
  const allMastered = deck.tf.length === 0 && deck.mc.length === 0 && deck.calc.length === 0 && deck.def.length === 0 && deck.special.length === 0;

  // If no current question and not in results/bank, trigger reset via effect
  useEffect(() => {
    if (!q && !showResults && !showBank) resetAll();
  }, [q, showResults, showBank]);

  function toggleLight() {
    setLightMode(prev => {
      const next = !prev;
      try { localStorage.setItem("quiz_lightmode", String(next)); } catch {}
      return next;
    });
  }

  function select(val) { if (!showResults) setAnswers(p => ({ ...p, [q.id]: val })); }
  function handleCalc(val) { setCalcInput(val); setAnswers(p => ({ ...p, [q.id]: val })); }

  function pickOrdering(item) {
    if (showResults) return;
    setOrderSelected(prev => {
      if (prev.includes(item)) return prev;
      const next = [...prev, item];
      setAnswers(p => ({ ...p, [q.id]: next }));
      return next;
    });
  }

  function clearOrdering() {
    setOrderSelected([]);
    setAnswers(p => { const n = { ...p }; delete n[q?.id]; return n; });
  }

  function handleSubmit() {
    const finalAnswers = { ...answers };
    if (q.type === "calc")    finalAnswers[q.id] = calcInput;
    if (q.type === "ordering") finalAnswers[q.id] = orderSelected;
    if (q.type === "match")   finalAnswers[q.id] = matchState.matched;
    const newDeck = applyResults(deck, questions, finalAnswers);
    setDeck(newDeck);
    setAnswers(finalAnswers);
    setShowResults(true);
    setCurrent(0);
  }

  function startNext() {
    if (allMastered) return;
    const nextQs = buildRound(deck);
    if (!nextQs || nextQs.length === 0) { resetAll(); return; }
    setQuestions(nextQs);
    setCurrent(0); setAnswers({}); setCalcInput(""); setOrderSelected([]);
    setMatchState({ selectedTerm:null, selectedDesc:null, matched:{}, wrong:{ term:null, desc:null }, feedback:"" });
    setShowResults(false); setCopied(false);
  }

  function resetAll() {
    const fresh = initDeck(null);
    setDeck(fresh);
    setQuestions(buildRound(fresh));
    setCurrent(0); setAnswers({}); setCalcInput(""); setOrderSelected([]);
    setMatchState({ selectedTerm:null, selectedDesc:null, matched:{}, wrong:{ term:null, desc:null }, feedback:"" });
    setShowResults(false); setCopied(false);
    saveProgress(fresh);
  }

  const score   = showResults ? questions.reduce((a, q) => a + (checkCorrect(q, answers[q.id]) ? 1 : 0), 0) : 0;
  const pct     = showResults ? Math.round((score / total) * 100) : 0;
  const wrongQs = showResults ? questions.filter(q => !checkCorrect(q, answers[q.id])) : [];
  const ua      = answers[q?.id];

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const s = {
    app:      { minHeight:"100vh", background:T.bg, display:"flex", alignItems:mobile?"flex-start":"center", justifyContent:"center", fontFamily:"'Segoe UI',system-ui,sans-serif", padding:mobile?"12px 10px":"20px 16px" },
    wrap:     { width:"100%", maxWidth:mobile?"100%":620 },
    logo:     { textAlign:"center", marginBottom:14 },
    logoTop:  { fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase", color:T.accent, fontFamily:"monospace", marginBottom:2 },
    logoTitle:{ fontSize:mobile?22:19, fontWeight:700, color:T.text, marginBottom:10 },
    card:     { background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:mobile?"16px 14px 14px":"22px 22px 18px", marginBottom:12 },
    tag:      { display:"inline-block", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:T.neutral, background:lm?"rgba(7,112,209,0.08)":"rgba(88,166,255,0.1)", border:`1px solid ${lm?"rgba(7,112,209,0.2)":"rgba(88,166,255,0.25)"}`, borderRadius:4, padding:"2px 7px", marginBottom:10, fontFamily:"monospace" },
    qText:    { fontSize:mobile?17:15, color:T.text, lineHeight:1.65, marginBottom:16, whiteSpace:"pre-line" },
    progRow:  { display:"flex", gap:8, alignItems:"center", marginBottom:14 },
    progBar:  { flex:1, height:3, background:T.border, borderRadius:2, overflow:"hidden" },
    progFill: (p) => ({ height:"100%", width:`${p}%`, background:T.accent, borderRadius:2, transition:"width 0.3s" }),
    progTxt:  { fontSize:11, color:T.muted, fontFamily:"monospace", whiteSpace:"nowrap" },
    opts:     { display:"flex", flexDirection:"column", gap:mobile?10:7 },
    opt:      (sel,cor,wrg) => ({ padding:mobile?"14px 14px":"11px 14px", borderRadius:8, border:`1px solid ${cor?T.accent:wrg?T.wrong:sel?T.neutral:T.border}`, background:cor?"rgba(63,185,80,0.07)":wrg?"rgba(248,81,73,0.07)":sel?(lm?"rgba(7,112,209,0.07)":"rgba(88,166,255,0.07)"):"transparent", color:cor?T.accent:wrg?T.wrong:sel?T.neutral:T.text, cursor:showResults?"default":"pointer", fontSize:mobile?16:14, display:"flex", alignItems:"flex-start", gap:9, transition:"all 0.12s", textAlign:"left", width:"100%", boxSizing:"border-box" }),
    dot:      (sel,cor,wrg) => ({ width:mobile?16:13, height:mobile?16:13, borderRadius:"50%", border:`2px solid ${cor?T.accent:wrg?T.wrong:sel?T.neutral:T.muted}`, background:cor?T.accent:wrg?T.wrong:sel?T.neutral:"transparent", flexShrink:0, marginTop:2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#000" }),
    tfRow:    { display:"flex", gap:8 },
    tfBtn:    (sel,isT) => {
      const cor=showResults&&q&&isT===q.answer, wrg=showResults&&q&&sel&&isT!==q.answer;
      return { flex:1, padding:mobile?"16px":"12px", borderRadius:7, border:`1px solid ${cor?T.accent:wrg?T.wrong:sel?T.neutral:T.border}`, background:cor?"rgba(63,185,80,0.1)":wrg?"rgba(248,81,73,0.1)":sel?(lm?"rgba(7,112,209,0.08)":"rgba(88,166,255,0.1)"):"transparent", color:cor?T.accent:wrg?T.wrong:sel?T.neutral:T.text, cursor:showResults?"default":"pointer", fontWeight:700, fontSize:mobile?17:14, textAlign:"center", transition:"all 0.12s" };
    },
    calcIn:   { width:"100%", padding:mobile?"14px":"10px 13px", background:lm?"#f9f9f9":"rgba(88,166,255,0.05)", border:`1px solid ${T.border}`, borderRadius:7, color:T.text, fontSize:mobile?18:17, fontFamily:"monospace", outline:"none", boxSizing:"border-box" },
    exp:      { marginTop:12, padding:"9px 13px", borderRadius:7, background:T.yellowBg, border:`1px solid ${T.yellowBorder}`, fontSize:mobile?14:13, color:T.yellow, lineHeight:1.6 },
    navRow:   { display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 },
    btn:      (primary,disabled) => ({ padding:mobile?"12px 20px":"8px 16px", borderRadius:7, border:primary?"none":`1px solid ${T.border}`, background:disabled?(lm?"#f0f0f0":"#21262d"):primary?(lm?CV.btnBg:C.accent):"transparent", color:disabled?T.muted:primary?(lm?CV.btnText:"#0d1117"):T.text, cursor:disabled?"not-allowed":"pointer", fontSize:mobile?15:13, fontWeight:primary?700:400, fontFamily:primary?"monospace":"inherit", transition:"all 0.12s" }),
    dots:     { display:"flex", gap:5, alignItems:"center" },
    navDot:   (cur,ans) => ({ width:cur?16:7, height:7, borderRadius:4, background:cur?T.accent:ans?T.neutral:T.border, transition:"all 0.18s", cursor:"pointer" }),
    resetLink:{ fontSize:11, color:T.muted, fontFamily:"monospace", cursor:"pointer", textDecoration:"underline" },
    orderLabel:{ fontSize:11, color:T.muted, fontFamily:"monospace", marginBottom:6 },
    orderChips:{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14, minHeight:32 },
    orderChip: (cor,wrg) => ({ padding:"5px 11px", borderRadius:20, background:cor?"rgba(63,185,80,0.12)":wrg?"rgba(248,81,73,0.12)":"rgba(88,166,255,0.1)", border:`1px solid ${cor?T.accent:wrg?T.wrong:T.neutral}`, color:cor?T.accent:wrg?T.wrong:T.neutral, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:5 }),
    orderGrid: { display:"flex", flexDirection:"column", gap:7 },
    orderBtn:  (sel,cor,wrg) => ({ padding:"11px 14px", borderRadius:8, border:`1px solid ${cor?T.accent:wrg?T.wrong:sel?T.neutral:T.border}`, background:cor?"rgba(63,185,80,0.07)":wrg?"rgba(248,81,73,0.07)":sel?"rgba(88,166,255,0.07)":"transparent", color:cor?T.accent:wrg?T.wrong:sel?T.neutral:T.text, cursor:showResults?"default":"pointer", fontSize:14, textAlign:"left", fontWeight:sel?600:400, transition:"all 0.12s", display:"flex", alignItems:"center", gap:10, width:"100%", boxSizing:"border-box" }),
    orderBadge:{ width:20, height:20, borderRadius:"50%", background:T.neutral, color:"#0d1117", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
    resultItem:(cor) => ({ padding:"11px 13px", borderRadius:7, border:`1px solid ${cor?"rgba(63,185,80,0.2)":"rgba(248,81,73,0.2)"}`, background:cor?"rgba(63,185,80,0.04)":"rgba(248,81,73,0.04)", marginBottom:7 }),
    wrongItem: { padding:"10px 13px", borderRadius:7, border:"1px solid rgba(248,81,73,0.2)", background:"rgba(248,81,73,0.04)", marginBottom:7 },
  };

  // ── MASTERY BARS ────────────────────────────────────────────────────────────
  const MasteryBars = () => (
    <div style={{ background:lm?"#f7f7f7":C.card, border:`1px solid ${lm?"#e0e0e0":C.border}`, borderRadius:8, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:12 }}>
      <div style={{ fontSize:10, color:lm?"#888":C.muted, fontFamily:"monospace", whiteSpace:"nowrap", minWidth:55 }}>
        <div style={{ marginBottom:4 }}>Correct</div>
        <div>Mastered</div>
      </div>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:5 }}>
        <div style={{ height:5, background:lm?"#d0d0d0":C.border, borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", background:"linear-gradient(90deg,#3fb950,#bc8cff)", borderRadius:3, transition:"width 0.5s ease", width:`${Math.round((deck.correctOnceIds?.length||0)/totalCount*100)}%` }} />
        </div>
        <div style={{ height:5, background:lm?"#d0d0d0":C.border, borderRadius:3, overflow:"hidden" }}>
          <div style={{ height:"100%", background:"linear-gradient(90deg,#e3b341,#d4920a)", borderRadius:3, transition:"width 0.5s ease", width:`${masteryPct}%` }} />
        </div>
      </div>
      <div style={{ fontSize:11, fontFamily:"monospace", minWidth:50, textAlign:"right" }}>
        <div style={{ marginBottom:4, color:lm?"#0770d1":"#3fb950" }}>{deck.correctOnceIds?.length||0}/{totalCount}</div>
        <div style={{ color:"#d4920a" }}>{masteredCount}/{totalCount}</div>
      </div>
    </div>
  );

  // ── ANSWER DISPLAY HELPERS ───────────────────────────────────────────────────
  function getAnswerDisplay(q, a) {
    let ua = "—", ca = "";
    if (q.type==="tf")                    { ua=a===undefined?"—":a?"True":"False"; ca=q.answer?"True":"False"; }
    else if (q.type==="mc"||q.type==="def") { ua=a!==undefined?q.options[a]:"—"; ca=q.options[q.answer]; }
    else if (q.type==="calc")             { ua=a??"—"; ca=q.answerDisplay; }
    else if (q.type==="ordering")         { ua=Array.isArray(a)?a.join(" → "):"—"; ca=q.correctOrder.join(" → "); }
    else if (q.type==="match")            { ua="(matching answer)"; ca="All pairs matched"; }
    return { ua, ca };
  }

  function getWrongAnswerDisplay(q, a) {
    let ua = "No answer", ca = "";
    if (q.type==="tf")                    { ua=a===undefined?"No answer":a?"True":"False"; ca=q.answer?"True":"False"; }
    else if (q.type==="mc"||q.type==="def") { ua=a!==undefined?q.options[a]:"No answer"; ca=q.options[q.answer]; }
    else if (q.type==="calc")             { ua=a??"No answer"; ca=q.answerDisplay; }
    else if (q.type==="ordering")         { ua=Array.isArray(a)?a.join(" → "):"No answer"; ca=q.correctOrder.join(" → "); }
    else if (q.type==="match")            { ua="(matching answer)"; ca=q.pairs.map(p=>p.term+" → "+p.desc).join(" | "); }
    return { ua, ca };
  }

  // ── WIN SCREEN ──────────────────────────────────────────────────────────────
  if (showResults && allMastered && !showBank) {
    const missedQs = Object.entries(deck.missedCounts||{}).sort((a,b)=>b[1]-a[1]).map(([id,count])=>({ q:getQById(id), count })).filter(x=>x.q);
    const isPerfect = missedQs.length === 0;
    return (
      <div style={s.app}><div style={s.wrap}>
        <div style={s.logo}><div style={s.logoTop}>{QUIZ_SUBJECT}</div></div>
        <MasteryBars />
        <div style={s.card}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>{isPerfect?"🌱":"🎉"}</div>
            {isPerfect
              ? <><div style={{ fontSize:22, fontWeight:700, color:T.accent, marginBottom:8 }}>Mastered.</div><div style={{ fontSize:14, color:T.muted }}>Perfect run — zero misses.</div></>
              : <><div style={{ fontSize:22, fontWeight:700, color:T.accent, marginBottom:8 }}>All mastered!</div><div style={{ fontSize:14, color:T.muted }}>Questions that gave you trouble:</div></>
            }
          </div>
          {!isPerfect && missedQs.map(({ q, count }) => {
            const { ca } = getAnswerDisplay(q, null);
            return (
              <div key={q.id} style={{ ...s.resultItem(false), marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10, marginBottom:4 }}>
                  <div style={{ fontSize:13, color:T.text, lineHeight:1.5, flex:1 }}>{q.question.split("\n")[0]}</div>
                  <div style={{ fontSize:10, fontFamily:"monospace", color:T.wrong, flexShrink:0 }}>missed {count}x</div>
                </div>
                <div style={{ fontSize:12, color:T.accent, marginBottom:4 }}>✓ {ca}</div>
                <div style={{ fontSize:12, color:T.yellow, lineHeight:1.5 }}>{q.explanation}</div>
              </div>
            );
          })}
          <button style={{ ...s.btn(true,false), width:"100%", padding:"12px", fontFamily:"monospace" }} onClick={resetAll}>START OVER</button>
        </div>
        <div style={{ textAlign:"center", marginTop:8 }}>
          <span style={s.resetLink} onClick={() => setShowBank(true)}>question bank</span>
        </div>
      </div></div>
    );
  }

  // ── RESULTS VIEW ────────────────────────────────────────────────────────────
  if (showResults && !showBank) {
    function copyWrong() {
      const text = wrongQs.map((q,i) => {
        const { ua, ca } = getWrongAnswerDisplay(q, answers[q.id]);
        return `--- WRONG #${i+1} [${q.topic}] ---\nQ: ${q.question.split("\n")[0]}\nYour answer: ${ua}\nCorrect: ${ca}\nExplanation: ${q.explanation}`;
      }).join("\n\n");
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2500); });
    }
    return (
      <div style={s.app}><div style={s.wrap}>
        <div style={s.logo}><div style={s.logoTop}>{QUIZ_SUBJECT}</div><div style={s.logoTitle}>Results</div></div>
        <MasteryBars />
        <div style={s.card}>
          <div style={{ width:90, height:90, borderRadius:"50%", border:`3px solid ${pct>=70?T.accent:T.wrong}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
            <div style={{ fontSize:24, fontWeight:700, color:pct>=70?T.accent:T.wrong }}>{pct}%</div>
            <div style={{ fontSize:10, color:T.muted, fontFamily:"monospace" }}>{score}/{total}</div>
          </div>
          <div style={{ textAlign:"center", color:T.muted, fontSize:13, marginBottom:16 }}>
            {pct===100?"Perfect! 🌱":pct>=80?"Great work!":pct>=60?"Getting there.":"Keep at it."}
          </div>
          {questions.map((q,i) => {
            const cor = checkCorrect(q, answers[q.id]);
            const { ua, ca } = getAnswerDisplay(q, answers[q.id]);
            return (
              <div key={q.id} style={s.resultItem(cor)}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10, marginBottom:4 }}>
                  <div style={{ fontSize:13, color:T.text, lineHeight:1.5, flex:1 }}><strong>Q{i+1}.</strong> {q.question.split("\n")[0]}</div>
                  <div style={{ fontSize:10, fontFamily:"monospace", color:cor?T.accent:T.wrong, fontWeight:700 }}>{cor?"✓":"✗"}</div>
                </div>
                {!cor && <div style={{ fontSize:12, color:T.muted, marginBottom:2 }}>Your answer: <span style={{ color:T.wrong }}>{ua}</span> · Correct: <span style={{ color:T.accent }}>{ca}</span></div>}
                <div style={{ fontSize:12, color:T.yellow, lineHeight:1.5, marginTop:5, paddingTop:5, borderTop:"1px solid rgba(255,255,255,0.06)" }}>{q.explanation}</div>
              </div>
            );
          })}
          {wrongQs.length > 0 && (
            <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.wrong }}>⚠ {wrongQs.length} wrong</div>
                <button onClick={copyWrong} style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${T.border}`, background:copied?"#238636":"transparent", color:copied?T.text:T.muted, cursor:"pointer", fontSize:12, fontFamily:"monospace" }}>{copied?"✓ Copied!":"Copy all"}</button>
              </div>
              {wrongQs.map((q,i) => {
                const { ua, ca } = getWrongAnswerDisplay(q, answers[q.id]);
                return (
                  <div key={q.id} style={s.wrongItem}>
                    <div style={{ fontSize:13, color:T.text, lineHeight:1.5, marginBottom:4 }}><strong>#{i+1} [{q.topic}]</strong> {q.question.split("\n")[0]}</div>
                    <div style={{ fontSize:12, color:T.muted, marginBottom:2 }}>Your answer: <span style={{ color:T.wrong }}>{ua}</span></div>
                    <div style={{ fontSize:12, color:T.muted, marginBottom:2 }}>Correct: <span style={{ color:T.accent }}>{ca}</span></div>
                    <div style={{ fontSize:12, color:T.yellow, lineHeight:1.5, marginTop:5, paddingTop:5, borderTop:"1px solid rgba(255,255,255,0.06)" }}>{q.explanation}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display:"flex", gap:8, marginTop:12 }}>
            <button style={{ flex:1, padding:"10px", borderRadius:7, border:"none", background:lm?CV.btnBg:C.accent, color:lm?CV.btnText:"#0d1117", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"monospace" }} onClick={startNext}>NEXT ROUND</button>
          </div>
        </div>
        <div style={{ textAlign:"center", marginTop:8 }}>
          <span style={s.resetLink} onClick={resetAll}>reset all progress</span>
          {" · "}
          <span style={s.resetLink} onClick={() => setShowBank(true)}>question bank</span>
        </div>
      </div></div>
    );
  }

  // ── RESPONSIVE ──────────────────────────────────────────────────────────────
  // mobile state is declared above via useState + resize listener

  // ── QUESTION BANK ───────────────────────────────────────────────────────────
  if (showBank) {
    const allQ   = [...ALL_TF, ...ALL_MC, ...ALL_CALC, ...ALL_DEF, ...ALL_SPECIAL];
    const topics = [...new Set(allQ.map(q => q.topic))];
    return (
      <div style={s.app}><div style={{ ...s.wrap, maxWidth:700 }}>
        <div style={s.logo}><div style={s.logoTop}>{QUIZ_SUBJECT}</div><div style={s.logoTitle}>Question Bank</div></div>
        <button style={{ width:"100%", padding:"10px", marginBottom:16, borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.text, cursor:"pointer", fontSize:13 }} onClick={() => { setShowBank(false); setQuestions(buildRound(deck)); }}>Back to quiz</button>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"12px 16px", marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:T.accent, fontFamily:"monospace", marginBottom:4 }}>{PATCH_NOTES.split("\n")[0]}</div>
          <div style={{ fontSize:12, color:T.muted, lineHeight:1.6 }}>{PATCH_NOTES.split("\n").slice(1).join(" ")}</div>
        </div>
        <div style={{ marginBottom:16, fontSize:12, color:T.muted, fontFamily:"monospace" }}>{allQ.length} questions across {topics.length} topics</div>
        {topics.map(topic => {
          const qs = allQ.filter(q => q.topic === topic);
          return (
            <div key={topic} style={{ marginBottom:24 }}>
              <div style={{ fontSize:13, fontWeight:700, color:T.neutral, fontFamily:"monospace", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${T.border}` }}>
                {topic} ({qs.length})
              </div>
              {qs.map(q => {
                const typeLabel = q.type==="tf"?"T/F":q.type==="mc"?"MC":q.type==="calc"?"CALC":q.type==="def"?"DEF":q.type==="match"?"MATCH":"ORDER";
                const correctText = q.type==="tf"?(q.answer?"True":"False"):q.type==="mc"||q.type==="def"?q.options[q.answer]:q.type==="calc"?q.answerDisplay:q.type==="match"?"See pairs below":q.correctOrder?.join(" → ");
                return (
                  <div key={q.id} style={{ padding:"10px 12px", borderRadius:7, border:`1px solid ${T.border}`, background:"rgba(255,255,255,0.02)", marginBottom:7 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:4 }}>
                      <div style={{ fontSize:9, fontFamily:"monospace", color:T.muted, background:T.border, borderRadius:3, padding:"2px 5px", flexShrink:0, marginTop:2 }}>{typeLabel}</div>
                      <div style={{ fontSize:13, color:T.text, lineHeight:1.5, whiteSpace:"pre-line" }}>{q.question}</div>
                    </div>
                    {q.type==="mc"||q.type==="def"
                      ? <div style={{ paddingLeft:28 }}>{q.options.map((opt,j)=><div key={j} style={{ fontSize:12, color:(j===q.answer||opt===q.answer)?T.accent:T.muted, marginBottom:2 }}>{(j===q.answer||opt===q.answer)?"✓ ":"   "}{opt}</div>)}</div>
                      : q.type==="match"
                        ? <div style={{ paddingLeft:28 }}>{q.pairs.map((p,i)=><div key={i} style={{ fontSize:12, color:T.accent, marginBottom:2 }}>✓ {p.term} → {p.desc}</div>)}</div>
                        : <div style={{ paddingLeft:28, fontSize:12, color:T.accent }}>✓ {correctText}</div>
                    }
                    <div style={{ paddingLeft:28, fontSize:11, color:T.yellow, marginTop:4, lineHeight:1.5 }}>{q.explanation}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <button style={{ width:"100%", padding:"11px", marginTop:8, borderRadius:7, border:`1px solid ${T.border}`, background:"transparent", color:T.text, cursor:"pointer", fontSize:13 }} onClick={() => { setShowBank(false); setQuestions(buildRound(deck)); }}>Back to quiz</button>
        <DevTool deck={deck} setDeck={setDeck} setQuestions={setQuestions} setShowResults={setShowResults} totalCount={totalCount} lightMode={lightMode} />
      </div></div>
    );
  }

  // ── QUIZ VIEW ───────────────────────────────────────────────────────────────
  // Guard: if no questions could be built (e.g. after bulk-mastering in dev tool)
  if (!q || questions.length === 0) {
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
      </div>

      <MasteryBars />

      <div style={s.progRow}>
        <div style={s.progBar}><div style={s.progFill((current+1)/total*100)} /></div>
        <div style={s.progTxt}>Q{current+1}/{total}</div>
      </div>

      <div style={s.card}>
        <div style={s.tag}>{q.topic}</div>
        <div style={s.qText}>{q.question}</div>

        {/* TRUE/FALSE */}
        {q.type==="tf" && (
          <div style={s.tfRow}>
            {[true,false].map(v=>(
              <button key={String(v)} style={s.tfBtn(ua===v,v)} onClick={()=>select(v)}>{v?"TRUE":"FALSE"}</button>
            ))}
          </div>
        )}

        {/* MULTIPLE CHOICE / DEFINITION */}
        {(q.type==="mc"||q.type==="def") && (
          <div style={s.opts}>
            {q.options.map((opt,i)=>{
              const sel=ua===i, cor=showResults&&i===q.answer, wrg=showResults&&sel&&i!==q.answer;
              return (
                <button key={i} style={s.opt(sel,cor,wrg)} onClick={()=>select(i)}>
                  <div style={s.dot(sel,cor,wrg)}>{sel&&!showResults?"✓":""}</div>{opt}
                </button>
              );
            })}
          </div>
        )}

        {/* CALCULATION */}
        {q.type==="calc" && (
          <div>
            <input type="text" placeholder="Enter your answer" value={calcInput} onChange={e=>handleCalc(e.target.value)} style={s.calcIn} />
            <div style={{ fontSize:11, color:T.muted, marginTop:5, fontFamily:"monospace" }}>Enter a number</div>
          </div>
        )}

        {/* ORDERING */}
        {q.type==="ordering" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <div style={s.orderLabel}>Your order ({orderSelected.length}/{q.correctOrder.length}):</div>
              {orderSelected.length>0&&!showResults&&<button style={{ padding:"4px 12px", borderRadius:6, border:`1px solid ${T.border}`, background:"transparent", color:T.muted, cursor:"pointer", fontSize:12, fontFamily:"monospace" }} onClick={clearOrdering}>clear</button>}
            </div>
            <div style={s.orderChips}>
              {orderSelected.length===0
                ? <div style={{ fontSize:13, color:T.muted, fontStyle:"italic" }}>Tap items below to build your sequence...</div>
                : orderSelected.map((item,i)=>(
                  <div key={item} style={s.orderChip(false,false)}>
                    <span style={{ fontSize:10, color:T.muted, fontFamily:"monospace" }}>{i+1}.</span>{item}
                  </div>
                ))
              }
            </div>
            <div style={s.orderGrid}>
              {q.options.map(item=>{
                const sel=orderSelected.includes(item);
                return (
                  <button key={item} style={s.orderBtn(sel,false,false)} onClick={()=>pickOrdering(item)}>
                    {sel&&<div style={s.orderBadge}>{orderSelected.indexOf(item)+1}</div>}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MATCHING */}
        {q.type==="match" && (() => {
          const pairs = q.shuffledPairs || q.pairs;
          const { selectedTerm, selectedDesc, matched, wrong, feedback: mFeedback } = matchState;
          const matchCount = Object.keys(matched).length;
          const activeMatchColors = lm ? LIGHT_MATCH_COLORS : MATCH_COLORS;
          const SEL_STYLE  = { background:"rgba(239,159,39,0.15)", borderColor:"#EF9F27", color:lm?"#3d2600":"#fbbf24", borderWidth:1.5 };
          const WRONG_STYLE = { background:"rgba(248,81,73,0.08)", borderColor:T.wrong, color:T.wrong };

          function getMatchedColorIdx(termIdx) { return matched[termIdx] !== undefined ? matched[termIdx] : null; }
          function getDescMatchedColorIdx(descIdx) {
            for (const [tIdx, cIdx] of Object.entries(matched)) {
              if (q.pairs[parseInt(tIdx)].desc === pairs[descIdx].desc) return cIdx;
            }
            return null;
          }

          function handleMatchTerm(idx) {
            if (matched[idx] !== undefined) return;
            if (selectedTerm === idx) { setMatchState(p => ({ ...p, selectedTerm:null })); return; }
            if (selectedDesc !== null) {
              const descPair = pairs[selectedDesc];
              const termPair = q.pairs[idx];
              if (termPair.desc === descPair.desc) {
                const newMatched = { ...matched, [idx]: matchCount };
                setMatchState(p => ({ ...p, selectedTerm:null, selectedDesc:null, matched:newMatched, feedback:"" }));
                setAnswers(prev => ({ ...prev, [q.id]: newMatched }));
              } else {
                setMatchState(p => ({ ...p, selectedTerm:null, selectedDesc:null, wrong:{ term:idx, desc:selectedDesc }, feedback:"Not a match — try again" }));
                setTimeout(() => setMatchState(p => ({ ...p, wrong:{ term:null, desc:null }, feedback:"" })), 900);
              }
            } else {
              setMatchState(p => ({ ...p, selectedTerm:idx }));
            }
          }

          function handleMatchDesc(descIdx) {
            if (getDescMatchedColorIdx(descIdx) !== null) return;
            if (selectedDesc === descIdx) { setMatchState(p => ({ ...p, selectedDesc:null })); return; }
            if (selectedTerm !== null) {
              const descPair = pairs[descIdx];
              const termPair = q.pairs[selectedTerm];
              if (termPair.desc === descPair.desc) {
                const newMatched = { ...matched, [selectedTerm]: matchCount };
                setMatchState(p => ({ ...p, selectedTerm:null, selectedDesc:null, matched:newMatched, feedback:"" }));
                setAnswers(prev => ({ ...prev, [q.id]: newMatched }));
              } else {
                setMatchState(p => ({ ...p, selectedTerm:null, selectedDesc:null, wrong:{ term:selectedTerm, desc:descIdx }, feedback:"Not a match — try again" }));
                setTimeout(() => setMatchState(p => ({ ...p, wrong:{ term:null, desc:null }, feedback:"" })), 900);
              }
            } else {
              setMatchState(p => ({ ...p, selectedDesc:descIdx }));
            }
          }

          const matchBase = { padding:"10px 13px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.text, cursor:"pointer", fontSize:13, lineHeight:1.5, textAlign:"left", transition:"all 0.12s", width:"100%", boxSizing:"border-box", minHeight:42, display:"flex", alignItems:"center" };

          return (
            <div>
              <div style={{ fontSize:11, color:T.muted, fontFamily:"monospace", marginBottom:10 }}>{matchCount} / {q.pairs.length} matched</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ fontSize:10, color:T.muted, fontFamily:"monospace", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>Term</div>
                  {q.pairs.map((p,i) => {
                    const cIdx = getMatchedColorIdx(i);
                    const c    = cIdx !== null ? activeMatchColors[cIdx % activeMatchColors.length] : null;
                    const st   = c ? { background:c.bg, borderColor:c.border, color:c.text, borderWidth:1.5, cursor:"default", fontWeight:600 } : wrong.term===i ? WRONG_STYLE : selectedTerm===i ? SEL_STYLE : {};
                    return <button key={i} style={{ ...matchBase, ...st }} onClick={() => handleMatchTerm(i)}>{p.term}</button>;
                  })}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <div style={{ fontSize:10, color:T.muted, fontFamily:"monospace", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>Description</div>
                  {pairs.map((p,descIdx) => {
                    const cIdx = getDescMatchedColorIdx(descIdx);
                    const c    = cIdx !== null ? activeMatchColors[cIdx % activeMatchColors.length] : null;
                    const st   = c ? { background:c.bg, borderColor:c.border, color:c.text, borderWidth:1.5, cursor:"default", fontWeight:600 } : wrong.desc===descIdx ? WRONG_STYLE : selectedDesc===descIdx ? SEL_STYLE : {};
                    return <button key={descIdx} style={{ ...matchBase, ...st }} onClick={() => handleMatchDesc(descIdx)}>{p.desc}</button>;
                  })}
                </div>
              </div>
              {mFeedback && <div style={{ textAlign:"center", marginTop:10, fontSize:13, color:T.wrong }}>{mFeedback}</div>}
              {matchCount === q.pairs.length && <div style={{ textAlign:"center", marginTop:10, fontSize:13, color:T.accent, fontFamily:"monospace" }}>All matched!</div>}
            </div>
          );
        })()}

        {/* EXPLANATION (shown after submit) */}
        {showResults && q.explanation && (
          <div style={s.exp}>{q.explanation}</div>
        )}
      </div>

      <div style={s.navRow}>
        <button style={s.btn(false, current===0)} onClick={()=>current>0&&setCurrent(c=>c-1)} disabled={current===0}>← Back</button>
        <div style={s.dots}>
          {questions.map((_,i)=>(
            <div key={i} style={s.navDot(i===current, answers[questions[i].id]!==undefined)} onClick={()=>setCurrent(i)} />
          ))}
        </div>
        {current<total-1
          ? <button style={s.btn(false,false)} onClick={()=>setCurrent(c=>c+1)}>Next →</button>
          : <button style={s.btn(true, Object.keys(answers).length<1)} onClick={handleSubmit} disabled={Object.keys(answers).length<1}>SUBMIT</button>
        }
      </div>

      <div style={{ textAlign:"center", marginTop:8, fontSize:11, color:T.muted, fontFamily:"monospace", display:"flex", justifyContent:"center", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <span style={s.resetLink} onClick={resetAll}>reset progress</span>
        <span style={s.resetLink} onClick={() => setShowBank(true)}>question bank</span>
        <label style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>
          <input type="checkbox" checked={lightMode} onChange={toggleLight} style={{ cursor:"pointer" }} />
          light mode
        </label>
      </div>
    </div></div>
  );
}

/**
 * netlify.toml (place in project root, same level as package.json):
 *
 * [[headers]]
 *   for = "/index.html"
 *   [headers.values]
 *     Cache-Control = "no-cache, no-store, must-revalidate"
 *     Pragma = "no-cache"
 *     Expires = "0"
 *
 * [[headers]]
 *   for = "/assets/*"
 *   [headers.values]
 *     Cache-Control = "public, max-age=31536000, immutable"
 */
