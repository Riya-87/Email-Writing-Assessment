import React from 'react';
import { LayoutDashboard, PenTool, History, CheckCircle, ShieldCheck, Mail, Sparkles } from 'lucide-react';
import { getSessionId } from '../utils/session.js';

export default function Sidebar({ currentView, onViewChange }) {
  const sessionId = getSessionId();
  const shortId = sessionId.slice(0, 8);

  return (
    <aside className="app-sidebar">
      <div>
        {/* Brand Header */}
        <div className="brand-header" onClick={() => onViewChange('landing')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon-badge">
            <Mail size={20} />
          </div>
          <div>
            <div className="brand-title">AssessAI</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>Email Writing Test</div>
          </div>
        </div>

        {/* Main Navigation Section */}
        <div className="sidebar-section-title">Main Menu</div>
        <div className="sidebar-nav-list">
          <button
            className={`sidebar-nav-item ${currentView === 'landing' ? 'active' : ''}`}
            onClick={() => onViewChange('landing')}
          >
            <LayoutDashboard size={17} color={currentView === 'landing' ? '#f59e0b' : '#6b7280'} />
            <span>Dashboard</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentView === 'assessment' ? 'active' : ''}`}
            onClick={() => onViewChange('assessment')}
          >
            <PenTool size={17} color={currentView === 'assessment' ? '#f59e0b' : '#6b7280'} />
            <span>Take Test</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => onViewChange('history')}
          >
            <History size={17} color={currentView === 'history' ? '#f59e0b' : '#6b7280'} />
            <span>History</span>
          </button>
        </div>

        {/* Evaluation Pillars Section */}
        <div className="sidebar-section-title">Scoring Pillars</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px', paddingRight: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Subject Line</span>
            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>20%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Structure</span>
            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>15%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Content</span>
            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>20%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Tone</span>
            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>25%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Grammar</span>
            <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>20%</span>
          </div>
        </div>
      </div>

      {/* Bottom Session Info Card */}
      <div className="sidebar-footer-card">
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#fef3c7',
          color: '#d97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={16} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>SESSION ACTIVE</div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            #{shortId}
          </div>
        </div>
      </div>
    </aside>
  );
}
