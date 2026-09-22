import React from 'react';
import { Award, ChevronDown, Sparkles } from 'lucide-react';
import { getSessionId } from '../utils/session.js';

export default function Header({ totalPoints = 0, currentView = 'landing', onViewChange }) {
  const sessionId = getSessionId();
  const shortId = sessionId.slice(0, 6).toUpperCase();

  const getPageTitle = () => {
    switch (currentView) {
      case 'assessment':
        return 'Email Writing Assessment';
      case 'result':
        return 'Evaluation Report';
      case 'history':
        return 'Candidate Attempts';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="top-nav">
      <h1 className="page-title">{getPageTitle()}</h1>

      <div className="header-user-profile">
        {/* Cumulative Points Badge */}
        <div className="points-badge-pill" title="Total accumulated points">
          <Award size={15} color="#f59e0b" />
          <span>{totalPoints} pts</span>
        </div>

        {/* User / Session Profile Pill (Matching reference Carla Sanford) */}
        <div className="user-profile-pill">
          <div className="user-avatar">
            <span>CA</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Candidate #{shortId}
          </span>
          <ChevronDown size={14} color="#9ca3af" />
        </div>

        {currentView !== 'assessment' && (
          <button
            className="btn-primary"
            onClick={() => onViewChange('assessment')}
            style={{ padding: '9px 18px', fontSize: '13px' }}
          >
            <Sparkles size={14} color="#f59e0b" />
            <span>New Test</span>
          </button>
        )}
      </div>
    </header>
  );
}
