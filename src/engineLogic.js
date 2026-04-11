// src/engine/logic/engineLogic.js
import deckData from "./questions.yaml";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const config = deckData.config || {};
export const STORAGE_KEY          = config.STORAGE_KEY          || "quiz_v1";
export const DECK_VERSION         = config.DECK_VERSION         || 1;
export const QUIZ_TITLE           = config.QUIZ_TITLE           || "Study Quiz";
export const QUIZ_SUBJECT         = config.QUIZ_SUBJECT         || "";
export const QUIZ_EMOJI           = config.QUIZ_EMOJI           || "🧠";
export const QUIZ_DESCRIPTION     = config.DESCRIPTION          || "";
export const WIN_EMOJI            = config.WIN_EMOJI            || "🌱";
export const WIN_PERFECT_TITLE    = config.WIN_PERFECT_TITLE    || "Mastered.";
export const WIN_PERFECT_SUBTITLE = config.WIN_PERFECT_SUBTITLE || "Perfect run — zero misses.";
export const WIN_TITLE            = config.WIN_TITLE            || "All mastered!";
export const WIN_SUBTITLE         = config.WIN_SUBTITLE         || "Questions that gave you trouble:";
export const SESSION_1_END        = config.SESSION_1_END        || "Good work. Come back tomorrow after a good night's sleep for Session 2.";
export const SESSION_2_END_WEAK   = config.SESSION_2_END_WEAK   || "Session 2 complete. You have {n} questions to review in Session 3. Sleep on it.";
export const SESSION_2_END_PERFECT= config.SESSION_2_END_PERFECT || "Perfect prep. You're ready.";
export const SESSION_3_END        = config.SESSION_3_END        || "All done. Here's how you improved:";

export const ALL_Q       = deckData.questions || [];
export const ALL_TF      = ALL_Q.filter(q => q.type === "tf");
export const ALL_MC      = ALL_Q.filter(q => q.type === "mc");
export const ALL_CALC    = ALL_Q.filter(q => q.type === "calc");
export const ALL_DEF     = ALL_Q.filter(q => q.type === "def");
export const ALL_SPECIAL = ALL_Q.filter(q => q.type === "ordering" || q.type === "match");
export const ALL_FITB    = ALL_Q.filter(q => q.type === "fitb");

export function isAllMastered(deck, mode) {
  if (!deck) return false;
  if (mode === "practice") {
    return (deck.correctOnceIds?.length || 0) >= ALL_Q.length;
  }
  return deck.tf.length === 0 &&
         deck.mc.length === 0 &&
         deck.calc.length === 0 &&
         deck.def.length === 0 &&
         deck.special.length === 0 &&
         deck.fitb.length === 0;
}

export function getQById(id) { return ALL_Q.find(q => q.id === id); }

export const MATCH_COLORS = [
  { bg:"rgba(29,158,117,0.18)",  border:"#1D9E75", text:"#5DCAA5" },
  { bg:"rgba(55,138,221,0.18)",  border:"#378ADD", text:"#85B7EB" },
  { bg:"rgba(99,153,34,0.18)",   border:"#639922", text:"#97C459" },
  { bg:"rgba(186,140,23,0.18)",  border:"#BA8C17", text:"#FAC775" },
  { bg:"rgba(83,74,183,0.18)",   border:"#534AB7", text:"#AFA9EC" },
  { bg:"rgba(0,168,150,0.18)",   border:"#00A896", text:"#5DCAA5" },
  { bg:"rgba(137,106,196,0.18)", border:"#896AC4", text:"#C9B8F0" },
];

export const LIGHT_MATCH_COLORS = [
  { bg:"#f0f0f0",   border:"#888888", text:"#333333" },
  { bg:"#e3f0fb",   border:"#378ADD", text:"#0C447C" },
  { bg:"#c3e6cb",   border:"#1a4d1c", text:"#0d2b0e" },
  { bg:"#fdf3dc",   border:"#BA8C17", text:"#633806" },
  { bg:"#f5ede3",   border:"#8B5E3C", text:"#4a2e1a" },
  { bg:"#e8eaf6",   border:"#3949AB", text:"#1a237e" },
  { bg:"#edfaf8",   border:"#5dcaa5", text:"#085041" },
];

// ─────────────────────────────────────────────────────────────────────────────
// DATA & PROGRESS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffleMCOptions(q) {
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

export function loadProgress(mode = "study") {
  try {
    let saved;
    if (mode === "practice") {
      saved = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_practice`));
    } else {
      saved = JSON.parse(localStorage.getItem(`${STORAGE_KEY}_study`)) || JSON.parse(localStorage.getItem(STORAGE_KEY));
    }
    if (!saved || saved.version !== DECK_VERSION) return null;
    return saved;
  } catch (error) {
    console.error("Failed to load quiz progress from localStorage:", error);
    return null;
  }
}

export function saveProgress(s) {
  try {
    const mode = (typeof s.mode === "string" && s.mode) ? s.mode : "study";
    // Extract only non-zero streaks (sparse — typically <10 entries at any time)
    const streaks = {};
    [...(s.tf||[]), ...(s.mc||[]), ...(s.calc||[]), ...(s.def||[]), ...(s.special||[]), ...(s.fitb||[])]
      .forEach(d => { if (d.streak > 0) streaks[d.id] = d.streak; });
    // Save minimal format — pool arrays are reconstructed on load
    const minimal = {
      version: DECK_VERSION, mode,
      masteredIds: s.masteredIds || [],
      correctOnceIds: s.correctOnceIds || [],
      missedCounts: s.missedCounts || {},
      hcwIds: s.hcwIds || [],
      streaks,
      roundIndex: s.roundIndex || 0,
      sessionIndex: s.sessionIndex || 0,
      sessionPools: s.sessionPools,
      sessionTopicResults: s.sessionTopicResults || {},
    };
    localStorage.setItem(`${STORAGE_KEY}_${mode}`, JSON.stringify(minimal));
  } catch (error) {
    console.error("Failed to save quiz progress to localStorage. You may have exceeded the storage quota.", error);
  }
}

export function saveInFlight(data) {
  try { localStorage.setItem(`${STORAGE_KEY}_inflight`, JSON.stringify(data)); }
  catch (error) { console.error("Failed to save in-flight round state:", error); }
}

export function loadInFlight() {
  try { return JSON.parse(localStorage.getItem(`${STORAGE_KEY}_inflight`)); }
  catch { return null; }
}

export function clearInFlight() {
  try { localStorage.removeItem(`${STORAGE_KEY}_inflight`); } catch {}
}

function buildDefaultDeck(mode = "study") {
  return {
    tf: ALL_TF.map((q, i) => ({ id: q.id, streak: 0, misses: 0 })),
    mc: ALL_MC.map((q, i) => ({ id: q.id, streak: 0, misses: 0 })),
    calc: ALL_CALC.map((q, i) => ({ id: q.id, streak: 0, misses: 0 })),
    def: ALL_DEF.map((q, i) => ({ id: q.id, streak: 0, misses: 0 })),
    special: ALL_SPECIAL.map((q, i) => ({ id: q.id, streak: 0, misses: 0 })),
    fitb: ALL_FITB.map((q, i) => ({ id: q.id, streak: 0, misses: 0 })),
    masteredIds: [], missedCounts: {}, correctOnceIds: [], hcwIds: [],
    roundIndex: 0, sessionIndex: 0, sessionPools: null, sessionTopicResults: {}, mode,
  };
}

function reconstructDeck(minimal) {
  const masteredIds = minimal.masteredIds || [];
  const missedCounts = minimal.missedCounts || {};
  const streaks = minimal.streaks || {};
  const buildPool = (allQ) => allQ
    .filter(q => !masteredIds.includes(q.id))
    .map((q, i) => ({ id: q.id, streak: streaks[q.id] || 0, misses: missedCounts[q.id] || 0 }));
  const mode = (typeof minimal.mode === "string" && minimal.mode) ? minimal.mode : "study";
  const deck = {
    tf: buildPool(ALL_TF), mc: buildPool(ALL_MC), calc: buildPool(ALL_CALC),
    def: buildPool(ALL_DEF), special: buildPool(ALL_SPECIAL), fitb: buildPool(ALL_FITB),
    masteredIds, missedCounts,
    correctOnceIds: minimal.correctOnceIds || [],
    hcwIds: minimal.hcwIds || [],
    roundIndex: minimal.roundIndex || 0,
    sessionIndex: minimal.sessionIndex || 0,
    sessionPools: minimal.sessionPools || null,
    sessionTopicResults: minimal.sessionTopicResults || {},
    mode,
  };
  if (mode === "study") {
    const p = deck.sessionPools;
    if (!p || !p["1"] || !p["2"] || (p["1"].length + p["2"].length !== ALL_Q.length)) {
      deck.sessionPools = buildSessionPools();
      deck.sessionIndex = 0;
    }
  }
  return deck;
}

export function initDeck(saved) {
  if (!saved) {
    const d = buildDefaultDeck();
    d.sessionPools = buildSessionPools();
    return d;
  }

  // New minimal format: no pool arrays saved, reconstruct from tracking data
  if (!saved.tf) return reconstructDeck(saved);

  // Old format: validate invariant before merging.
  // Fix: practice mode removes from pools into correctOnceIds (not masteredIds),
  // so check whichever is larger to avoid false self-healing resets.
  const totalActive = (saved.tf?.length || 0) + (saved.mc?.length || 0) + (saved.calc?.length || 0) +
    (saved.def?.length || 0) + (saved.special?.length || 0) + (saved.fitb?.length || 0);
  const totalMastered = saved.masteredIds?.length || 0;
  const totalCorrectOnce = saved.correctOnceIds?.length || 0;
  const totalCompleted = Math.max(totalMastered, totalCorrectOnce);
  if (totalActive + totalCompleted !== ALL_Q.length) {
    const d = buildDefaultDeck((typeof saved.mode === "string" && saved.mode) ? saved.mode : "study");
    d.sessionPools = buildSessionPools();
    return d;
  }

  const defaultDeck = buildDefaultDeck();
  const merged = {
    ...defaultDeck, ...saved,
    tf: saved.tf || defaultDeck.tf, mc: saved.mc || defaultDeck.mc,
    calc: saved.calc || defaultDeck.calc, def: saved.def || defaultDeck.def,
    special: saved.special || defaultDeck.special, fitb: saved.fitb || defaultDeck.fitb,
    masteredIds: saved.masteredIds || [], missedCounts: saved.missedCounts || {},
    correctOnceIds: saved.correctOnceIds || [], hcwIds: saved.hcwIds || [],
    sessionPools: saved.sessionPools || null,
    sessionTopicResults: saved.sessionTopicResults || {},
    mode: (typeof saved.mode === "string" && saved.mode) ? saved.mode : "study",
  };
  if (merged.mode === "study") {
    const p = merged.sessionPools;
    if (!p || !p["1"] || !p["2"] || (p["1"].length + p["2"].length !== ALL_Q.length)) {
      merged.sessionPools = buildSessionPools();
      merged.sessionIndex = 0;
    }
  }
  return merged;
}

export function buildSessionPools() {
  let oddFlip = false;
  function splitType(arr) {
    const shuffled = shuffle([...arr]);
    let mid = Math.floor(shuffled.length / 2);
    if (shuffled.length % 2 !== 0) {
      mid += oddFlip ? 1 : 0;
      oddFlip = !oddFlip;
    }
    return [shuffled.slice(0, mid).map(q => q.id), shuffled.slice(mid).map(q => q.id)];
  }
  const [tf1, tf2]       = splitType(ALL_TF);
  const [mc1, mc2]       = splitType(ALL_MC);
  const [calc1, calc2]   = splitType(ALL_CALC);
  const [def1, def2]     = splitType(ALL_DEF);
  const [spec1, spec2]   = splitType(ALL_SPECIAL);
  const [fitb1, fitb2]   = splitType(ALL_FITB);
  return {
    "1": [...tf1, ...mc1, ...calc1, ...def1, ...spec1, ...fitb1],
    "2": [...tf2, ...mc2, ...calc2, ...def2, ...spec2, ...fitb2],
  };
}

export function advanceSession(deck) {
  const nextSessionIndex = deck.sessionIndex + 1;
  let sessionPools = { ...deck.sessionPools };
  let nextDeck = { ...deck };
  
  if (nextSessionIndex === 2) {
    const weakSpotIds = ALL_Q
      .filter(q => (deck.missedCounts[q.id] || 0) > 0 || deck.hcwIds.includes(q.id))
      .sort((a, b) => {
        const scoreA = (deck.missedCounts[a.id] || 0) * 2 + (deck.hcwIds.includes(a.id) ? 3 : 0);
        const scoreB = (deck.missedCounts[b.id] || 0) * 2 + (deck.hcwIds.includes(b.id) ? 3 : 0);
        return scoreB - scoreA;
      })
      .map(q => q.id);
    sessionPools["3"] = weakSpotIds;

    // Re-activate weak spots so they aren't skipped by the engine
    nextDeck.masteredIds = (nextDeck.masteredIds || []).filter(id => !weakSpotIds.includes(id));
    
    const tf = [...nextDeck.tf];
    const mc = [...nextDeck.mc];
    const calc = [...nextDeck.calc];
    const def = [...nextDeck.def];
    const special = [...nextDeck.special];
    const fitb = [...nextDeck.fitb];

    weakSpotIds.forEach(id => {
      const q = getQById(id);
      if (!q) return;
      const entry = { id: q.id, streak: 0, misses: deck.missedCounts[q.id] || 0 };
      if (q.type === "tf") tf.push(entry);
      else if (q.type === "mc") mc.push(entry);
      else if (q.type === "calc") calc.push(entry);
      else if (q.type === "def") def.push(entry);
      else if (q.type === "ordering" || q.type === "match") special.push(entry);
      else if (q.type === "fitb") fitb.push(entry);
    });

    nextDeck.tf = tf;
    nextDeck.mc = mc;
    nextDeck.calc = calc;
    nextDeck.def = def;
    nextDeck.special = special;
    nextDeck.fitb = fitb;
  }

  return {
    ...nextDeck,
    roundIndex:     0,
    sessionIndex:   nextSessionIndex,
    sessionPools,
    sessionTopicResults: { ...(deck.sessionTopicResults || {}) },
  };
}

export function computeTopicResults(questions, answers) {
  const topicMap = {};
  questions.forEach(q => {
    const topic = q.topic || "Other";
    if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
    topicMap[topic].total += 1;
    if (checkCorrect(q, answers[q.id])) topicMap[topic].correct += 1;
  });
  return topicMap;
}


export function checkCorrect(q, answer) {
  if (answer === undefined || answer === null || answer === "") return false;
  if (q.type === "tf")  return answer === q.answer;
  if (q.type === "mc" || q.type === "def") return answer === q.answer;
  if (q.type === "calc") {
    if (typeof q.answer === 'number') {
      const num = parseFloat(String(answer).replace(/[^0-9.-]/g, ""));
      // Use a tiny epsilon as fallback to prevent floating-point precision errors (e.g. 0.1 + 0.2)
      return Math.abs(num - q.answer) <= (q.tolerance ?? 1e-9);
    }
    // Assumes string answer for hex, etc.
    return String(answer).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
  }
  if (q.type === "ordering") return JSON.stringify(answer) === JSON.stringify(q.correctOrder);
  if (q.type === "match") {
    if (!answer || typeof answer !== "object" || Object.keys(answer).length !== q.pairs.length) return false;
    // Check if answer uses index-based format {termIndex: colorIndex}
    const isIndexBased = Object.keys(answer).every(key => !isNaN(key));
    if (isIndexBased) {
      // Validate that all pairs are matched with correct descriptions
      return Object.entries(answer).every(([termIdx]) => {
        const ti = parseInt(termIdx);
        return q.pairs[ti] && q.pairs[ti].desc !== undefined;
      });
    }
    // Otherwise check term-based format {term: description}
    return q.pairs.every(p => answer[p.term] === p.desc);
  }
  if (q.type === "fitb") {
    const normalize = str => String(str).trim().toLowerCase().replace(/\s+/g, " ");
    const input = normalize(answer);
    return q.accepted.some(a => normalize(a) === input);
  }
  return false;
}

export function buildRound(deck, mode) {
  const qMap = id => getQById(id);

  const sessionPoolIds = (mode === "study" && deck.sessionPools)
    ? (deck.sessionPools[String(deck.sessionIndex + 1)] || null)
    : null;
  const inPool = id => !sessionPoolIds || sessionPoolIds.includes(id);

  const excludeIds = mode === "practice" ? (deck.correctOnceIds || []) : deck.masteredIds;

  const activeCalc    = deck.calc.filter(d => !excludeIds.includes(d.id) && inPool(d.id));
  const activeDef     = deck.def.filter(d => !excludeIds.includes(d.id) && inPool(d.id));
  const activeSpecial = deck.special.filter(d => !excludeIds.includes(d.id) && inPool(d.id));
  const activeFitb    = deck.fitb.filter(d => !excludeIds.includes(d.id) && inPool(d.id));
  const activeMC      = deck.mc.filter(d => !excludeIds.includes(d.id) && qMap(d.id)?.topic !== "Integrative" && inPool(d.id));
  const activeInteg   = deck.mc.filter(d => !excludeIds.includes(d.id) && qMap(d.id)?.topic === "Integrative" && inPool(d.id));
  const activeTF      = deck.tf.filter(d => !excludeIds.includes(d.id) && inPool(d.id));

  const totalActiveInPool = activeTF.length + activeMC.length + activeInteg.length + activeCalc.length + activeDef.length + activeSpecial.length + activeFitb.length;
  const roundMax = Math.min(10, totalActiveInPool);

  // Pick T/F: always 2 true and 2 false (balanced)
  const trueTF   = shuffle(activeTF.filter(d => qMap(d.id)?.answer === true));
  const falseTF  = shuffle(activeTF.filter(d => qMap(d.id)?.answer === false));
  const pickedTF = [...trueTF.slice(0, 2), ...falseTF.slice(0, 2)];

  // Pick MC: rotate through topics for coverage
  const needed = roundMax - pickedTF.length;
  const mcTopicMap = {};
  shuffle(activeMC).forEach(d => {
    const t = qMap(d.id)?.topic || "Other";
    if (!mcTopicMap[t]) mcTopicMap[t] = [];
    mcTopicMap[t].push(d);
  });
  const mcTopics  = shuffle(Object.keys(mcTopicMap));
  const pickedMC  = [];
  let r = 0;
  while (pickedMC.length < Math.min(3, needed)) {
    let added = false;
    for (const t of mcTopics) {
      if (pickedMC.length >= Math.min(3, needed)) break;
      if (mcTopicMap[t][r]) { pickedMC.push(mcTopicMap[t][r]); added = true; }
    }
    r++;
    if (!added) break;
  }

  // Fill remaining slots with truly random questions from all other types
  const allPicked = [...pickedTF, ...pickedMC];
  const usedIds = new Set(allPicked.map(d => d.id));

  const remainingNeeded = roundMax - allPicked.length;
  if (remainingNeeded > 0) {
    const otherPools = [activeCalc, activeFitb, activeDef, activeSpecial, activeInteg];
    const allOther = [];
    for (const pool of otherPools) {
      for (const entry of pool) {
        if (!usedIds.has(entry.id)) {
          allOther.push(entry);
        }
      }
    }

    const shuffledOther = shuffle(allOther);
    const take = shuffledOther.slice(0, remainingNeeded);
    allPicked.push(...take);
    take.forEach(d => usedIds.add(d.id));
  }

  // Transform to question objects with shuffled options/pairs
  const main = shuffle(allPicked.map(d => {
    const q = qMap(d.id);
    if (!q) return null;
    if (q.type === "ordering") return { ...q, options: shuffle([...q.correctOrder]) };
    if (q.type === "match") return { ...q, shuffledPairs: shuffle([...q.pairs]) };
    return shuffleMCOptions(q);
  }).filter(Boolean));

  return main.filter(Boolean);
}

export function applyResults(deck, questions, answers, confidence, mode) {
  const threshold = 2;
  let newDeck = {
    ...deck,
    tf:      deck.tf.map(d => ({ ...d })),
    mc:      deck.mc.map(d => ({ ...d })),
    calc:    deck.calc.map(d => ({ ...d })),
    def:     deck.def.map(d => ({ ...d })),
    special: deck.special.map(d => ({ ...d })),
    fitb:    deck.fitb.map(d => ({ ...d })),
    masteredIds:    [...deck.masteredIds],
    missedCounts:   { ...deck.missedCounts },
    correctOnceIds: [...(deck.correctOnceIds || [])],
    hcwIds:         [...(deck.hcwIds || [])],
    roundIndex: deck.roundIndex + 1,
  };

  const modifiedPools = new Set();

  questions.forEach(q => {
    const correct = checkCorrect(q, answers[q.id]);
    const conf = confidence?.[q.id];
    if (!correct && conf === "know" && !newDeck.hcwIds.includes(q.id)) {
      newDeck.hcwIds = [...newDeck.hcwIds, q.id];
    }
    const pool =
      q.type === "tf"                                    ? newDeck.tf      :
      q.type === "mc"                                    ? newDeck.mc      :
      q.type === "calc"                                  ? newDeck.calc    :
      q.type === "def"                                   ? newDeck.def     :
      q.type === "fitb"                                  ? newDeck.fitb    :
      (q.type === "ordering" || q.type === "match")      ? newDeck.special : null;

    if (!pool) return;
    const idx = pool.findIndex(d => d.id === q.id);
    if (idx === -1) return;

    modifiedPools.add(pool);

    if (correct) {
      pool[idx].streak += 1;
      if (!newDeck.correctOnceIds.includes(q.id)) newDeck.correctOnceIds = [...newDeck.correctOnceIds, q.id];
      
      const thresholdMet = mode === "practice" ? true : pool[idx].streak >= threshold;
      if (thresholdMet) {
        if (mode !== "practice" && !newDeck.masteredIds.includes(q.id)) {
          newDeck.masteredIds.push(q.id);
        }
        pool.splice(idx, 1);
        return;
      }
    } else {
      pool[idx].streak = 0;
      pool[idx].misses  = (pool[idx].misses || 0) + 1;
      newDeck.missedCounts = { ...newDeck.missedCounts, [q.id]: (newDeck.missedCounts[q.id] || 0) + 1 };
    }
  });

  // Accumulate topic results for the session
  if (mode === "study") {
    const roundTopics = computeTopicResults(questions, answers);
    const sIdx = String(newDeck.sessionIndex);
    const currentSessionTopics = newDeck.sessionTopicResults[sIdx] ? JSON.parse(JSON.stringify(newDeck.sessionTopicResults[sIdx])) : {};
    
    Object.keys(roundTopics).forEach(topic => {
      if (!currentSessionTopics[topic]) currentSessionTopics[topic] = { correct: 0, total: 0 };
      currentSessionTopics[topic].correct += roundTopics[topic].correct;
      currentSessionTopics[topic].total += roundTopics[topic].total;
    });
    newDeck.sessionTopicResults = { ...newDeck.sessionTopicResults, [sIdx]: currentSessionTopics };
  }

  return newDeck;
}