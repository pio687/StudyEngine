/**
 * STUDYENGINE.JSX — Study Engine v3
 * ─────────────────────────────────────────────────────────────────────────────
 * Conceived and shamelessly vibe coded by pio687 with the help of Claude and friends
 * Question data lives in questions.js — swap that file to change quizzes.
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

import { useState, useEffect } from "react";

import {
  QUIZ_TITLE, QUIZ_SUBJECT, QUIZ_EMOJI, QUIZ_DESCRIPTION,
  ALL_Q, getQById,
  saveProgress, advanceSession,
  checkCorrect,
} from "./engineLogic.js";

import { useQuizEngine } from './components/hooks/useQuizEngine.js';
import MenuScreen from './components/MenuScreen.jsx';
import WinScreen from './components/WinScreen.jsx';
import ResultsScreen from './components/ResultsScreen.jsx';
import SessionEndScreen from './components/SessionEndScreen.jsx';
import BankScreen from './components/BankScreen.jsx';
import QuizScreen from './components/QuizScreen.jsx';
import DevTool from './components/DevTool.jsx';
import './App.css';

const PATCH_NOTES = `v3 Engine — April 1, 2026`;


// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StudyEngine() {
  const [lightMode, setLightMode] = useState(() => {
    try { return localStorage.getItem("quiz_lightmode") === "true"; } catch { return false; }
  });

  const engine = useQuizEngine();

  // EFFECTS
  useEffect(() => {
    document.body.dataset.theme = lightMode ? "light" : "dark";
    document.body.style.backgroundColor = "var(--bg)";
  }, [lightMode]);

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

  function toggleLight() {
    setLightMode(prev => {
      const next = !prev;
      try { localStorage.setItem("quiz_lightmode", String(next)); } catch {}
      return next;
    });
  }


  const totalCount = ALL_Q.length;
  const masteredCount = engine.deck.masteredIds.length;
  const weakSpotIds = ALL_Q.filter(q => (engine.deck.missedCounts[q.id] || 0) > 0 || engine.deck.hcwIds.includes(q.id)).map(q => q.id);

  if (engine.currentView === "MENU") {
    const resumeSession = engine.resumeRef.current;
    const resumeSessionNum = resumeSession ? engine.deck.sessionIndex + 1 : null;
    return <MenuScreen {...{ QUIZ_SUBJECT, QUIZ_TITLE, resumeSession, resumeSessionNum, selectMode: engine.selectMode, lightMode, toggleLight, goToBank: engine.goToBank }} />;
  }

  if (engine.currentView === "WIN") {
    const missedQs = Object.entries(engine.deck.missedCounts||{}).sort((a,b)=>b[1]-a[1]).map(([id,count])=>({ q:getQById(id), count })).filter(x=>x.q);
    const isPerfect = missedQs.length === 0;
    return <WinScreen {...{ QUIZ_SUBJECT, isPerfect, missedQs, resetAll: engine.resetAll, goToBank: engine.goToBank, mode: engine.mode, deck: engine.deck, currentView: engine.currentView, totalCount, masteredCount }} />;
  }

  if (engine.currentView === "RESULTS") {
    return <ResultsScreen {...{ QUIZ_SUBJECT, pct: engine.pct, score: engine.score, total: engine.total, questions: engine.questions, answers: engine.answers, checkCorrect, confidence: engine.confidence, wrongQs: engine.wrongQs, startNext: engine.startNext, resetAll: engine.resetAll, goToBank: engine.goToBank, mode: engine.mode, deck: engine.deck, currentView: engine.currentView, totalCount, masteredCount }} />;
  }

  if (engine.currentView === "SESSION_END") {
    return <SessionEndScreen {...{ QUIZ_SUBJECT, QUIZ_TITLE, deck: engine.deck, setDeck: engine.setDeck, weakSpotIds, resetAll: engine.resetAll, continueToNextSession: engine.continueToNextSession, setCurrentView: engine.setCurrentView, latestDeckRef: engine.latestDeckRef, resumeRef: engine.resumeRef, saveProgress, advanceSession, goToBank: engine.goToBank, mode: engine.mode, currentView: engine.currentView, totalCount, masteredCount }} />;
  }

  if (engine.currentView === "BANK") {
    return <BankScreen {...{ QUIZ_SUBJECT, leaveBank: engine.leaveBank, patchNotes: PATCH_NOTES, description: QUIZ_DESCRIPTION, deck: engine.deck, setDeck: engine.setDeck, questions: engine.questions, setQuestions: engine.setQuestions, setCurrentView: engine.setCurrentView, totalCount, lightMode, mode: engine.mode, setConfidence: engine.setConfidence }} />;
  }

  return <QuizScreen {...{ ...engine, lightMode, toggleLight, weakSpotIds, currentView: engine.currentView, totalCount, masteredCount }} />;
}
