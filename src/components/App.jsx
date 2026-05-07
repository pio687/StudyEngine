import { useState, useEffect, useMemo } from 'react'
import yaml from 'js-yaml'
import { validateBank } from '../engine/validator'
import { initPractice, initStudy, answerQuestion, nextRound, nextSession, getCurrentQuestion, getProgress } from '../engine/sessionManager'
import { shuffleArray } from '../engine/questionSelector'
import { saveState, loadState, hasState, clearState } from '../engine/storage'
import StartScreen from './StartScreen'
import SessionScreen from './SessionScreen'
import QuestionBank from './QuestionBank'

export default function App() {
  const [bankConfig, setBankConfig] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [screen, setScreen] = useState('start')
  const [questionBankReturn, setQuestionBankReturn] = useState('start')
  const [sessionState, setSessionState] = useState(null)
  // Track which saved states exist so StartScreen can show resume options
  const [savedKeys, setSavedKeys] = useState({ practice: null, study: null })
  const [roundHistory, setRoundHistory] = useState([])
  const [theme, setTheme] = useState(() => {
    const saved = loadState('theme')
    return saved === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveState('theme', theme)
  }, [theme])

  function handleToggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}questions.yaml`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch questions.yaml: ${res.status}`)
        return res.text()
      })
      .then(text => {
        const parsed = yaml.load(text)
        const result = validateBank(parsed)
        if (!result.valid) {
          setLoadError(result.errors)
          return
        }
        setBankConfig(parsed.config)
        setQuestions(result.questions)

        const base = parsed.config.storage_key
        setSavedKeys({
          practice: hasState(base + '_practice') ? base + '_practice' : null,
          study: hasState(base + '_study') ? base + '_study' : null,
        })
      })
      .catch(err => setLoadError([err.message]))
  }, [])

  const currentQuestion = useMemo(() => {
    if (!sessionState) return null
    const q = getCurrentQuestion(sessionState)
    if (!q) return null
    if (q.type === 'ordering') return { ...q, initialOrder: shuffleArray(q.correctOrder.map((_, i) => i)) }
    if (q.type === 'match') return { ...q, initialDescOrder: shuffleArray(q.pairs.map((_, i) => i)) }
    return q
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState?.currentQuestionIndex, sessionState?.currentRound])

  const progress = useMemo(() => {
    if (!sessionState) return null
    return getProgress(sessionState)
  }, [sessionState])

  const savedSessionData = useMemo(() => ({
    practice: savedKeys.practice ? loadState(practiceKey()) : null,
    study: savedKeys.study ? loadState(studyKey()) : null,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [savedKeys.practice, savedKeys.study, bankConfig])

  const masteryStats = useMemo(() => {
    if (!sessionState || !questions.length) return null

    const allTrackers = [
      sessionState.sessionTrackers[1],
      sessionState.sessionTrackers[2],
      sessionState.sessionTrackers[3],
      sessionState.tracker,
    ].filter(Boolean)

    const masteredSet = new Set()
    const missedSet   = new Set()

    allTrackers.forEach(t => {
      t.mastered.forEach(id => masteredSet.add(id))
      t.missed.forEach(id => missedSet.add(id))
    })

    // missed = wrong and not yet corrected (red side shrinks as S3 corrects questions)
    const trulyMissed = new Set([...missedSet].filter(id => !masteredSet.has(id)))

    return {
      mastered: masteredSet.size,
      missed:   trulyMissed.size,
      total:    questions.length,
    }
  }, [sessionState, questions])

  function practiceKey() { return bankConfig.storage_key + '_practice' }
  function studyKey() { return bankConfig.storage_key + '_study' }

  function handleStartPractice() {
    if (savedKeys.practice) clearState(practiceKey())
    const state = initPractice(questions)
    saveState(practiceKey(), state)
    setSessionState(state)
    setSavedKeys(k => ({ ...k, practice: practiceKey() }))
    setRoundHistory([])
    setScreen('session')
  }

  function handleStartStudy() {
    if (savedKeys.study) clearState(studyKey())
    const state = initStudy(questions)
    saveState(studyKey(), state)
    setSessionState(state)
    setSavedKeys(k => ({ ...k, study: studyKey() }))
    setRoundHistory([])
    setScreen('session')
  }

  function handleResumePractice() {
    const saved = loadState(practiceKey())
    if (saved) {
      setSessionState(saved)
      setRoundHistory([])
      setScreen('session')
    }
  }

  function handleResumeStudy() {
    const saved = loadState(studyKey())
    if (saved) {
      setSessionState(saved)
      setRoundHistory([])
      setScreen('session')
    }
  }

  function handleAnswer(isCorrect, confidence, roundResult) {
    setSessionState(prev => {
      const next = answerQuestion(prev, isCorrect, confidence, roundResult)
      const key = next.mode === 'study' ? studyKey() : practiceKey()
      // Clear persistence when practice completes
      if (next.mode === 'practice' && next.phase === 'complete') {
        clearState(key)
        setSavedKeys(k => ({ ...k, practice: null }))
      } else {
        saveState(key, next)
      }
      return next
    })
  }

  function handleNextRound() {
    // Capture round results before state update clears them
    const results = sessionState?.roundResults ?? []
    if (results.length > 0) {
      const correct = results.filter(r => r.isCorrect).length
      setRoundHistory(prev => [...prev, { correct, total: results.length }])
    }
    setSessionState(prev => {
      const next = nextRound(prev)
      const key = next.mode === 'study' ? studyKey() : practiceKey()
      if (next.mode === 'practice' && next.phase === 'complete') {
        clearState(key)
        setSavedKeys(k => ({ ...k, practice: null }))
      } else {
        saveState(key, next)
      }
      return next
    })
  }

  function handleResetProgress() {
    const key = sessionState.mode === 'study' ? studyKey() : practiceKey()
    clearState(key)
    setSavedKeys(k => ({
      ...k,
      [sessionState.mode === 'study' ? 'study' : 'practice']: null,
    }))
    setSessionState(null)
    setScreen('start')
  }

  function handleNextSession() {
    const next = nextSession(sessionState)
    const key = studyKey()
    if (next.phase === 'complete') {
      clearState(key)
      setSavedKeys(k => ({ ...k, study: null }))
      setSessionState(null)
      setScreen('start')
    } else {
      const withIntro = { ...next, phase: 'session_intro' }
      saveState(key, withIntro)
      setSessionState(withIntro)
    }
  }

  function handleBeginSession() {
    setSessionState(prev => {
      const next = { ...prev, phase: 'active' }
      saveState(studyKey(), next)
      return next
    })
  }

  function handleStudyComplete() {
    clearState(studyKey())
    setSavedKeys(k => ({ ...k, study: null }))
    setSessionState(null)
    setScreen('start')
  }

  function handleBackToStart() {
    setScreen('start')
  }

  function handleOpenQuestionBank() {
    setQuestionBankReturn(screen)
    setScreen('questionbank')
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center p-8">
        <div>
          <h1 className="text-xl font-bold text-wrong mb-4">Failed to load question bank</h1>
          <ul className="text-sm text-muted list-none p-0 m-0 flex flex-col gap-1">
            {loadError.map((e, i) => <li key={i}>• {e}</li>)}
          </ul>
        </div>
      </div>
    )
  }

  if (!bankConfig) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    )
  }

  if (screen === 'start') {
    return (
      <StartScreen
        config={bankConfig}
        questionCount={questions.length}
        savedPracticeSession={savedSessionData.practice}
        savedStudySession={savedSessionData.study}
        onStartPractice={handleStartPractice}
        onStartStudy={handleStartStudy}
        onResumePractice={handleResumePractice}
        onResumeStudy={handleResumeStudy}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    )
  }

  if (screen === 'session') {
    return (
      <SessionScreen
        config={bankConfig}
        sessionState={sessionState}
        currentQuestion={currentQuestion}
        progress={progress}
        masteryStats={masteryStats}
        roundHistory={roundHistory}
        onAnswer={handleAnswer}
        onNextRound={handleNextRound}
        onNextSession={handleNextSession}
        onBeginSession={handleBeginSession}
        onStudyComplete={handleStudyComplete}
        onResetProgress={handleResetProgress}
        onBack={handleBackToStart}
        onOpenQuestionBank={handleOpenQuestionBank}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    )
  }

  if (screen === 'questionbank') {
    return (
      <QuestionBank
        config={bankConfig}
        questions={questions}
        onBack={() => setScreen(questionBankReturn)}
      />
    )
  }

  return null
}
