import React, { useState, useEffect } from 'react';
import { getSessionHistory } from '../services/api.js';
import { getSessionId } from '../utils/session.js';
import { Award, Clock, ArrowRight, RefreshCw, FileText } from 'lucide-react';

export default function HistoryPage({ onStartAssessment, onSelectAttempt }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    setError(null);
    try {
      const sessionId = getSessionId();
      const data = await getSessionHistory(sessionId);
      setHistory(data);
    } catch (err) {
      setError(err.message || 'Failed to load assessment history.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <RefreshCw size={32} className="animate-spin" color="#f59e0b" style={{ margin: '0 auto 16px' }} />
        <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Loading assessment history from MongoDB...</p>
      </div>
    );
  }

  const { totalAttempts = 0, totalPoints = 0, attempts = [] } = history || {};
  const avgScore = totalAttempts > 0 ? Math.round(totalPoints / totalAttempts) : 0;

  return (
    <div>
      {/* 3 KPI Summary Cards */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '22px' }}>
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Award size={22} />
          </div>
          <div>
            <div className="kpi-label">Total Points</div>
            <div className="kpi-value">{totalPoints} <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>pts</span></div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className="kpi-label">Total Attempts</div>
            <div className="kpi-value">{totalAttempts}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="kpi-label">Average Score</div>
            <div className="kpi-value">{avgScore}%</div>
          </div>
        </div>
      </div>

      {/* Main Table Container (Matching reference Employees table) */}
      <div className="glass-table-wrap">
        <div className="table-header-row">
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Assessment Submission Records
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>
              Historical performance data associated with your session
            </p>
          </div>
          <button className="btn-primary" onClick={onStartAssessment} style={{ padding: '9px 20px', fontSize: '13.5px', fontWeight: 800 }}>
            <span>New Test</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {attempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <FileText size={36} color="#9ca3af" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '16px' }}>
              No attempts yet in this browser session.
            </p>
            <button className="btn-primary" onClick={onStartAssessment}>
              Start Your First Assessment
            </button>
          </div>
        ) : (
          <table className="glass-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Scenario</th>
                <th>Subject Line</th>
                <th>Performance Meter</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const formattedDate = new Date(attempt.submittedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={attempt.attemptId}>
                    <td style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      #{attempt.attemptId?.slice(-6).toUpperCase()}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{attempt.scenario}</td>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13.5px', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {attempt.subject}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="progress-track">
                          <div className="progress-fill-gradient" style={{ width: `${attempt.totalScore}%` }} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          {attempt.totalScore}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                      {formattedDate}
                    </td>
                    <td>
                      <button
                        className="btn-glass"
                        onClick={() => onSelectAttempt && onSelectAttempt(attempt.attemptId)}
                        style={{ padding: '5px 12px', fontSize: '12.5px', fontWeight: 700 }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
