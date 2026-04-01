import { useState, useEffect, useRef, useCallback } from "react";

import {
  STORAGE_KEY,
  ALL_Q,
  loadProgress, saveProgress, initDeck, buildSessionPools, advanceSession, isAllMastered,
  computeTopicResults, checkCorrect, buildRound, applyResults
} from "../../engineLogic.js";

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

  const resetRoundState = useCallback(() => {
    setCurrent(0);
    setAnswers({});
    setCalcInput("");
    setFitbInput("");
    setOrderSelected([]);
    setConfidence({});
    setMatchState({ selectedTerm:null, selectedDesc:null, matched:{}, wrong:{ term:null, desc:null }, feedback:"" });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("quiz_mode");
    const fresh = initDeck(null);
    saveProgress(fresh);
    latestDeckRef.current = fresh;
    setDeck(fresh);
    setQuestions([]);
    resetRoundState();
    setMode(null);
    setCurrentView("MENU");
  }, [resetRoundState]);

  useEffect(() => {
    const savedDeck = initDeck(loadProgress());
    if (savedDeck.sessionPools && savedDeck.sessionIndex < 3) {
      resumeRef.current = true;
    }
    setDeck(savedDeck);
    setCurrentView("MENU");
  }, []);

  useEffect(() => { if (deck) saveProgress(deck); }, [deck]);

  const q  = questions[current];

  useEffect(() => {
    const savedAnswer = answers[q?.id];
    setFitbInput(savedAnswer !== undefined && q?.type === "fitb" ? savedAnswer : "");
    setCalcInput(savedAnswer !== undefined && q?.type === "calc" ? savedAnswer : "");
  }, [current, q, answers]);

  const allMastered = isAllMastered(deck, mode);
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

    if (isAllMastered(newDeck, mode)) {
      setCurrentView("WIN");
    } else {
      setCurrentView("RESULTS");
    }
    setCurrent(0);
  }

  function startNext() {
    const freshDeck = latestDeckRef.current || deck;

    if (isAllMastered(freshDeck, mode)) return;

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
    resetRoundState();
    setCurrentView("QUIZ");
  }
  
  function selectMode(m) {
    try { localStorage.setItem("quiz_mode", m); } catch {}
    setMode(m);

    let deckForRound = deck;

    if (m === 'study') {
      if (resumeRef.current) {
        resumeRef.current = false;
        deckForRound = latestDeckRef.current || deck;
      } else {
        const freshDeck = initDeck(null);
        freshDeck.sessionPools = buildSessionPools();
        deckForRound = freshDeck;
      }
    }

    setDeck(deckForRound);
    setQuestions(buildRound(deckForRound, m));
    resetRoundState();
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
    resetRoundState();
    saveProgress(nextDeck);
    setCurrentView("QUIZ");
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
    startNext, selectMode, continueToNextSession,
  };
}