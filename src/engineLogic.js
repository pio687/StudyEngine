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
  } catch { return null; }
}

export function saveProgress(s) {
  try { 
    const mode = (typeof s.mode === "string" && s.mode) ? s.mode : "study";
    localStorage.setItem(`${STORAGE_KEY}_${mode}`, JSON.stringify({ ...s, version: DECK_VERSION })); 
  } catch {}
}

export function initDeck(saved) {
  const defaultDeck = {
    tf: ALL_TF.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    mc: ALL_MC.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    calc: ALL_CALC.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    def: ALL_DEF.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    special: ALL_SPECIAL.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    fitb: ALL_FITB.map((q, i) => ({ id: q.id, pos: i, streak: 0, misses: 0 })),
    masteredIds: [],
    missedCounts: {},
    correctOnceIds: [],
    hcwIds: [],
    roundIndex: 0,
    sessionIndex: 0,
    sessionPools: null,
    sessionTopicResults: {},
    mode: "study", // Default mode
  };

  if (!saved) {
    defaultDeck.sessionPools = buildSessionPools();
    return defaultDeck;
  };

  // Self-healing: if the cached pool doesn't match the active question bank size,
  // it means the user swapped the questions.yaml file. Rebuild completely to avoid 0/0 ghost pools.
  const totalActive = (saved.tf?.length || 0) + (saved.mc?.length || 0) + (saved.calc?.length || 0) + (saved.def?.length || 0) + (saved.special?.length || 0) + (saved.fitb?.length || 0);
  const totalMastered = saved.masteredIds?.length || 0;
  if (totalActive + totalMastered !== ALL_Q.length) {
    defaultDeck.sessionPools = buildSessionPools();
    defaultDeck.mode = (typeof saved.mode === "string" && saved.mode) ? saved.mode : "study";
    return defaultDeck;
  }

  // Merge saved properties with defaults, ensuring all arrays are initialized if missing
  const merged = {
    ...defaultDeck, // Start with all defaults
    ...saved,       // Overlay saved values
    // Ensure arrays are always arrays, even if saved had them as null/undefined
    tf: saved.tf || defaultDeck.tf,
    mc: saved.mc || defaultDeck.mc,
    calc: saved.calc || defaultDeck.calc,
    def: saved.def || defaultDeck.def,
    special: saved.special || defaultDeck.special,
    fitb: saved.fitb || defaultDeck.fitb,
    masteredIds: saved.masteredIds || defaultDeck.masteredIds,
    missedCounts: saved.missedCounts || defaultDeck.missedCounts,
    correctOnceIds: saved.correctOnceIds || defaultDeck.correctOnceIds,
    hcwIds: saved.hcwIds || defaultDeck.hcwIds,
    sessionPools: saved.sessionPools || defaultDeck.sessionPools,
    sessionTopicResults: saved.sessionTopicResults || defaultDeck.sessionTopicResults,
    mode: (typeof saved.mode === "string" && saved.mode) ? saved.mode : defaultDeck.mode,
  };

  // Final safety net for study mode session pools
  if (merged.mode === "study") {
    const p = merged.sessionPools;
    const isInvalid = !p || !p["1"] || !p["2"] || (p["1"].length + p["2"].length !== ALL_Q.length);
    if (isInvalid) {
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
      const entry = { id: q.id, pos: Math.random() * 100, streak: 0, misses: deck.missedCounts[q.id] || 0 };
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

export function buildSlotRotation() {
  const rotation = [];
  if (ALL_CALC.length > 0)    rotation.push("calc");
  if (ALL_FITB.length > 0)    rotation.push("fitb");
  if (ALL_DEF.length > 0 || ALL_SPECIAL.filter(q => q.type === "ordering" || q.type === "match").length > 0)
    rotation.push("special");
  if (ALL_MC.some(q => q.topic === "Integrative")) rotation.push("integrative");
  if (rotation.length === 0)  rotation.push("extra");
  return rotation;
}

export const SLOT_ROTATION = buildSlotRotation();

export function checkCorrect(q, answer) {
  if (answer === undefined || answer === null || answer === "") return false;
  if (q.type === "tf")  return answer === q.answer;
  if (q.type === "mc" || q.type === "def") return answer === q.answer;
  if (q.type === "calc") {
    if (typeof q.answer === 'number') {
      const num = parseFloat(String(answer).replace(/[^0-9.-]/g, ""));
      return Math.abs(num - q.answer) <= (q.tolerance ?? 0);
    }
    // Assumes string answer for hex, etc.
    return String(answer).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
  }
  if (q.type === "ordering") return JSON.stringify(answer) === JSON.stringify(q.correctOrder);
  if (q.type === "match") {
    if (!answer || typeof answer !== "object" || Object.keys(answer).length !== q.pairs.length) return false;
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

  let slotType = SLOT_ROTATION[deck.roundIndex % SLOT_ROTATION.length];

  const excludeIds = mode === "practice" ? (deck.correctOnceIds || []) : deck.masteredIds;

  const activeCalc    = deck.calc.filter(d => !excludeIds.includes(d.id) && inPool(d.id));
  const activeDef     = deck.def.filter(d => !excludeIds.includes(d.id) && inPool(d.id));
  const activeSpecial = deck.special.filter(d => !excludeIds.includes(d.id) && inPool(d.id));
  const activeFitb    = deck.fitb.filter(d => !excludeIds.includes(d.id) && inPool(d.id));
  const activeMC      = deck.mc.filter(d => !excludeIds.includes(d.id) && qMap(d.id)?.topic !== "Integrative" && inPool(d.id));
  const activeInteg   = deck.mc.filter(d => !excludeIds.includes(d.id) && qMap(d.id)?.topic === "Integrative" && inPool(d.id));
  const activeTF      = deck.tf.filter(d => !excludeIds.includes(d.id) && inPool(d.id));

  const hasCalc    = activeCalc.length > 0;
  const hasSpecial = activeSpecial.length > 0 || activeDef.length > 0;
  const hasInteg   = activeInteg.length > 0;
  const hasFitb    = activeFitb.length > 0;

  if (slotType === "calc"        && !hasCalc)    slotType = hasFitb ? "fitb" : hasSpecial ? "special" : hasInteg ? "integrative" : "extra";
  if (slotType === "fitb"        && !hasFitb)    slotType = hasCalc ? "calc" : hasSpecial ? "special" : hasInteg ? "integrative" : "extra";
  if (slotType === "special"     && !hasSpecial)  slotType = hasCalc ? "calc" : hasFitb ? "fitb" : hasInteg ? "integrative" : "extra";
  if (slotType === "integrative" && !hasInteg)    slotType = hasCalc ? "calc" : hasFitb ? "fitb" : hasSpecial ? "special" : "extra";

  let specialQ = null;
  if (slotType === "calc") {
    const sorted = shuffle([...activeCalc]);
    if (sorted.length > 0) specialQ = qMap(sorted[0].id);
  } else if (slotType === "fitb") {
    const sorted = shuffle([...activeFitb]);
    if (sorted.length > 0) specialQ = qMap(sorted[0].id);
  } else if (slotType === "special") {
    const specialEntry = shuffle([...activeSpecial])[0];
    const defEntry     = shuffle([...activeDef])[0];
    if (specialEntry && (!defEntry || deck.roundIndex % 2 === 0)) {
      const sq = qMap(specialEntry.id);
      if (sq) {
        if (sq.type === "ordering")    specialQ = { ...sq, options: shuffle([...sq.correctOrder]) };
        else if (sq.type === "match")  specialQ = { ...sq, shuffledPairs: shuffle([...sq.pairs]) };
        else                           specialQ = shuffleMCOptions(sq);
      }
    } else if (defEntry) {
      const dq = qMap(defEntry.id);
      if (dq) specialQ = shuffleMCOptions(dq);
    } else if (specialEntry) {
      const sq = qMap(specialEntry.id);
      if (sq) {
        if (sq.type === "ordering")    specialQ = { ...sq, options: shuffle([...sq.correctOrder]) };
        else if (sq.type === "match")  specialQ = { ...sq, shuffledPairs: shuffle([...sq.pairs]) };
      }
    }
  } else if (slotType === "integrative") {
    const sorted = shuffle([...activeInteg]);
    if (sorted.length > 0) specialQ = shuffleMCOptions(qMap(sorted[0].id));
  }

  const totalActiveInPool = activeTF.length + activeMC.length + activeCalc.length + activeDef.length + activeSpecial.length + activeFitb.length + activeInteg.length;
  const roundMax = Math.min(10, totalActiveInPool);

  const trueTF   = shuffle(activeTF.filter(d => qMap(d.id)?.answer === true));
  const falseTF  = shuffle(activeTF.filter(d => qMap(d.id)?.answer === false));
  const pickedTF = [...trueTF.slice(0, 2), ...falseTF.slice(0, 2)];

  const needed = roundMax - pickedTF.length - (specialQ ? 1 : 0);
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

  const allPicked  = [...pickedTF, ...pickedMC];
  const targetMain = specialQ ? roundMax - 1 : roundMax;
  if (allPicked.length < targetMain) {
    const usedIds = new Set(allPicked.map(d => d.id));
    if (specialQ) usedIds.add(specialQ.id);
    const pools = [activeTF, activeMC, activeCalc, activeFitb, activeDef, activeSpecial, activeInteg];
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

    const maxPos = pool.reduce((m, d) => Math.max(m, d.pos), 0);
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
      pool[idx].pos = maxPos + Math.random() * 100;
    } else {
      pool[idx].streak = 0;
      pool[idx].misses  = (pool[idx].misses || 0) + 1;
      pool[idx].pos     = Math.max(0, pool[idx].pos - 50);
      newDeck.missedCounts = { ...newDeck.missedCounts, [q.id]: (newDeck.missedCounts[q.id] || 0) + 1 };
    }
  });

  modifiedPools.forEach(pool => {
    pool.sort((a, b) => a.pos - b.pos);
    const midpoint = Math.floor(pool.length / 2);
    pool.forEach((d, i) => { if (i < midpoint) d.pos = i; });
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