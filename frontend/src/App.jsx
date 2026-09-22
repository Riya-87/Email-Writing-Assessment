import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import FallingColorBackground from './components/FallingColorBackground.jsx';
import LandingPage from './pages/LandingPage.jsx';
import AssessmentPage from './pages/AssessmentPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import { getSessionHistory, getAttemptResult } from './services/api.js';
import { getSessionId } from './utils/session.js';
import './styles/glass.css';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [totalPoints, setTotalPoints] = useState(0);
  const [latestResult, setLatestResult] = useState(null);

  useEffect(() => {
    refreshSessionPoints();
  }, []);

  async function refreshSessionPoints() {
    try {
      const sessionId = getSessionId();
      const history = await getSessionHistory(sessionId);
      if (history && typeof history.totalPoints === 'number') {
        setTotalPoints(history.totalPoints);
      }
    } catch {
      // Backend may be starting or offline initially, fail gracefully
    }
  }

  function handleSubmissionSuccess(result) {
    setLatestResult(result);
    if (typeof result.totalPoints === 'number') {
      setTotalPoints(result.totalPoints);
    }
    setCurrentView('result');
  }

  async function handleSelectAttempt(attemptId) {
    try {
      const sessionId = getSessionId();
      const result = await getAttemptResult(attemptId, sessionId);
      setLatestResult(result);
      setCurrentView('result');
    } catch (err) {
      console.error('Failed to load attempt details:', err);
    }
  }

  return (
    <>
      {/* Background colors and falling color particles animation */}
      <FallingColorBackground />

      {/* Main Glassmorphism Application Canvas */}
      <div className="app-window">
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => setCurrentView(view)}
        />

        <main className="app-content">
          <Header
            totalPoints={totalPoints}
            currentView={currentView}
            onViewChange={(view) => setCurrentView(view)}
          />

          {currentView === 'landing' && (
            <LandingPage
              onStartAssessment={() => setCurrentView('assessment')}
              onViewHistory={() => setCurrentView('history')}
              totalPoints={totalPoints}
            />
          )}

          {currentView === 'assessment' && (
            <AssessmentPage
              onSubmitSuccess={handleSubmissionSuccess}
            />
          )}

          {currentView === 'result' && (
            <ResultPage
              result={latestResult}
              onTryAgain={() => setCurrentView('assessment')}
              onViewHistory={() => setCurrentView('history')}
            />
          )}

          {currentView === 'history' && (
            <HistoryPage
              onStartAssessment={() => setCurrentView('assessment')}
              onSelectAttempt={handleSelectAttempt}
            />
          )}
        </main>
      </div>
    </>
  );
}
