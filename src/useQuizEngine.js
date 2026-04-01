import { useState, useEffect, useRef, useCallback } from "react";

import {
  STORAGE_KEY,
  ALL_Q,
  loadProgress, saveProgress, initDeck, buildSessionPools, advanceSession,
  computeTopicResults, checkCorrect, buildRound, applyResults,
} from "../engineLogic.js";

export function useQuizEngine() {
  const [deck, setDeck]           = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState({});
  const [calcInput, setCalcInput] = useState("");
  const [fitbInput, setFitbInput] = useState("");
  const [orderSelected, setOrderSelected] = useState([]);
  const [matchState, setMatchState] = useState({ selectedTerm:null, selectedDesc:null, matched:{}, wrong:{ term:null, desc:null }, feedback:"" });
  const [confidence, setConfidence] = useState({});
  const [switchModeConfirm, setSwitchModeConfirm] = useState(false);
  const [mode, setMode] = useState(null);
  const [currentView, setCurrentView] = useState("LOADING");
  const [previousView, setPreviousView] = useState("MENU");

  const latestDeckRef = useRef(null);
  const resumeRef = useRef(false);
  const sessionScoreRef = useRef(null);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_study`);
    localStorage.removeItem(`${STORAGE_KEY}_practice`);
    localStorage.removeItem("quiz_mode");
    const fresh = initDeck(null);
    fresh.mode = "study";
    saveProgress(fresh);
    latestDeckRef.current = fresh;
    setDeck(fresh);
    setQuestions([]);
    setCurrent(0); setAnswers({}); setCalcInput(""); setFitbInput(""); setOrderSelected([]);
    setConfidence({});
    setMatchState({ selectedTerm:null, selectedDesc:null, matched:{}, wrong:{ term:null, desc:null }, feedback:"" });
    setMode(null);
    setCurrentView("MENU");
  }, []);

  useEffect(() => {
    const savedDeck = initDeck(loadProgress("study"));
    savedDeck.mode = "study";
    if (savedDeck.sessionPools && savedDeck.sessionIndex < 3) {
      resumeRef.current = true;
    }
    latestDeckRef.current = savedDeck;
    setDeck(savedDeck);
    setCurrentView("MENU");
  }, []);

  const getStudySessionNum = useCallback(() => {
    const data = loadProgress("study");
    return data && data.sessionPools ? data.sessionIndex + 1 : 1;
  }, []);

  const hasStudyProgress = useCallback(() => {
    const data = loadProgress("study");
    return !!(data && data.sessionPools);
  }, []);

  useEffect(() => { if (deck) saveProgress(deck); }, [deck]);

  const q  = questions[current];

  useEffect(() => {
    const savedAnswer = answers[q?.id];
    setFitbInput(savedAnswer !== undefined && q?.type === "fitb" ? savedAnswer : "");
    setCalcInput(savedAnswer !== undefined && q?.type === "calc" ? savedAnswer : "");
  }, [current, q, answers]);

  const allMastered = deck ? (mode === "practice" ? (deck.correctOnceIds?.length || 0) >= ALL_Q.length : deck.tf.length === 0 && deck.mc.length === 0 && deck.calc.length === 0 && deck.def.length === 0 && deck.special.length === 0 && deck.fitb.length === 0) : false;
  const currentSessionPool = deck && mode === "study" && deck.sessionPools ? (deck.sessionPools[String(deck.sessionIndex + 1)] || []) : [];
  const sessionComplete = deck && mode === "study" && currentSessionPool.length > 0 && currentSessionPool.every(id => deck.masteredIds.includes(id));

  useEffect(() => {
    if (!q && currentView === "QUIZ") {
      if (mode === "study" && sessionComplete) {
        setCurrentView("SESSION_END");
      } else if (allMastered) {
        setCurrentView("WIN");
      }
    }
  }, [q, currentView, sessionComplete, allMastered, mode, resetAll]);

  function goToBank() {
    setPreviousView(currentView);
    setCurrentView("BANK");
  }

  function leaveBank() {
    setCurrentView(previousView);
  }

  function select(val) { if (currentView === "QUIZ") setAnswers(p => ({ ...p, [q.id]: val })); }
  function handleCalc(val) { setCalcInput(val); setAnswers(p => ({ ...p, [q.id]: val })); }
  function handleFitb(val) { setFitbInput(val); setAnswers(p => ({ ...p, [q.id]: val })); }

  function pickOrdering(item) {
    if (currentView !== "QUIZ") return;
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
    if (q.type === "calc")     finalAnswers[q.id] = calcInput;
    if (q.type === "fitb")     finalAnswers[q.id] = fitbInput;
    if (q.type === "ordering") finalAnswers[q.id] = orderSelected;
    if (q.type === "match")    finalAnswers[q.id] = matchState.matched;
    const newDeck = applyResults(deck, questions, finalAnswers, confidence, mode);
    latestDeckRef.current = newDeck;
    const snapScore = questions.reduce((a, q) => a + (checkCorrect(q, finalAnswers[q.id]) ? 1 : 0), 0);
    const snapTotal = questions.length;
    sessionScoreRef.current = {
      score: snapScore,
      total: snapTotal,
      pct: snapTotal > 0 ? Math.round((snapScore / snapTotal) * 100) : 0,
      wrongQs: questions.filter(q => !checkCorrect(q, finalAnswers[q.id])),
      answers: finalAnswers,
      questions: [...questions],
    };
    setDeck(newDeck);
    setAnswers(finalAnswers);

    const freshAllMastered = mode === "practice"
      ? (newDeck.correctOnceIds?.length || 0) >= ALL_Q.length
      : newDeck.tf.length === 0 && newDeck.mc.length === 0 && newDeck.calc.length === 0 && newDeck.def.length === 0 && newDeck.special.length === 0 && newDeck.fitb.length === 0;

    if (freshAllMastered) {
      setCurrentView("WIN");
    } else {
      setCurrentView("RESULTS");
    }
    setCurrent(0);
  }

  function startNext() {
    const freshDeck = latestDeckRef.current || deck;

    if (allMastered) return;

    const freshSessionPool = mode === "study" && freshDeck.sessionPools
      ? (freshDeck.sessionPools[String(freshDeck.sessionIndex + 1)] || [])
      : [];
    const freshSessionComplete = mode === "study" && freshSessionPool.length > 0
      && freshSessionPool.every(id => freshDeck.masteredIds.includes(id));

    if (mode === "study" && freshSessionComplete) {
      setCurrentView("SESSION_END");
      return;
    }

    const nextQs = buildRound(freshDeck, mode);
    if (!nextQs || nextQs.length === 0) {
      if (mode === "study") { setCurrentView("SESSION_END"); return; }
      resetAll(); return;
    }
    setQuestions(nextQs);
    setCurrent(0); setAnswers({}); setCalcInput(""); setFitbInput(""); setOrderSelected([]);
    setConfidence({});
    setMatchState({ selectedTerm:null, selectedDesc:null, matched:{}, wrong:{ term:null, desc:null }, feedback:"" });
    setCurrentView("QUIZ");
  }
  
  function selectMode(m) {
    const safeMode = typeof m === "string" ? m : "study";
    try { localStorage.setItem("quiz_mode", safeMode); } catch {}
    setMode(safeMode);

    const savedDeck = loadProgress(safeMode);
    let deckForRound = initDeck(savedDeck);
    deckForRound.mode = safeMode;

    if (safeMode === 'study' && !deckForRound.sessionPools) {
      deckForRound.sessionPools = buildSessionPools();
    }

    latestDeckRef.current = deckForRound;
    setDeck(deckForRound);
    setQuestions(buildRound(deckForRound, safeMode));
    setCurrent(0); setAnswers({}); setCalcInput(""); setFitbInput(""); setOrderSelected([]);
    setConfidence({});
    setMatchState({ selectedTerm:null, selectedDesc:null, matched:{}, wrong:{ term:null, desc:null }, feedback:"" });
    saveProgress(deckForRound);
    setCurrentView("QUIZ");
  }

  function continueToNextSession() {
    const freshDeck = latestDeckRef.current || deck;
    const topicResults = computeTopicResults(questions, answers);
    const deckWithResults = {
      ...freshDeck,
      sessionTopicResults: {
        ...(freshDeck.sessionTopicResults || {}),
        [freshDeck.sessionIndex]: topicResults,
      },
    };
    const nextDeck = advanceSession(deckWithResults);
    latestDeckRef.current = nextDeck;
    setDeck(nextDeck);
    setQuestions(buildRound(nextDeck, mode));
    setCurrent(0); setAnswers({}); setCalcInput(""); setFitbInput(""); setOrderSelected([]);
    setConfidence({});
    setMatchState({ selectedTerm:null, selectedDesc:null, matched:{}, wrong:{ term:null, desc:null }, feedback:"" });
    saveProgress(nextDeck);
    setCurrentView("QUIZ");
  }

  function devAdvanceSession() {
    const freshDeck = latestDeckRef.current || deck;
    const nextDeck = advanceSession(freshDeck);
    latestDeckRef.current = nextDeck;
    setDeck(nextDeck);
    setQuestions(buildRound(nextDeck, mode));
    setCurrent(0); setAnswers({}); setCalcInput(""); setFitbInput(""); setOrderSelected([]);
    setConfidence({});
    setMatchState({ selectedTerm:null, selectedDesc:null, matched:{}, wrong:{ term:null, desc:null }, feedback:"" });
    saveProgress(nextDeck);
  }

  const total = questions.length;
  const ua = answers[q?.id];
  const score   = (currentView === "RESULTS" || currentView === "WIN") ? questions.reduce((a, q) => a + (checkCorrect(q, answers[q.id]) ? 1 : 0), 0) : 0;
  const pct     = (currentView === "RESULTS" || currentView === "WIN") ? Math.round((score / total) * 100) : 0;
  const wrongQs = (currentView === "RESULTS" || currentView === "WIN") ? questions.filter(q => !checkCorrect(q, answers[q.id])) : [];

  return {
    deck, setDeck, questions, setQuestions, current, setCurrent, answers, setAnswers, calcInput, setCalcInput,
    fitbInput, setFitbInput, orderSelected, setOrderSelected, matchState, setMatchState, confidence, setConfidence,
    switchModeConfirm, setSwitchModeConfirm, mode, setMode, currentView, setCurrentView, latestDeckRef, resumeRef,
    sessionScoreRef, q, ua, total, allMastered, sessionComplete, score, pct, wrongQs,
    resetAll, goToBank, leaveBank, select, handleCalc, handleFitb, pickOrdering, clearOrdering, handleSubmit,
    startNext, selectMode, continueToNextSession, devAdvanceSession, getStudySessionNum, hasStudyProgress
  };
}