import React, { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle, Cpu, ArrowRight, RefreshCw, Sparkles, Send, Clock } from 'lucide-react';
import { getRandomScenario, getSessionHistory } from '../services/api.js';
import { getSessionId } from '../utils/session.js';

export default function LandingPage({ onStartAssessment, onViewHistory, totalPoints = 0 }) {
  const [scenario, setScenario] = useState(null);
  const [loadingScenario, setLoadingScenario] = useState(true);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoadingScenario(true);
    try {
      const sessionId = getSessionId();
      const [scenData, histData] = await Promise.allSettled([
        getRandomScenario(),
        getSessionHistory(sessionId)
      ]);

      if (scenData.status === 'fulfilled') setScenario(scenData.value);
      if (histData.status === 'fulfilled') setHistory(histData.value);
    } finally {
      setLoadingScenario(false);
    }
  }

  async function refreshScenario() {
    try {
      const data = await getRandomScenario();
      setScenario(data);
    } catch (err) {
      console.error('Failed to load new scenario:', err);
    }
  }

  const totalAttempts = history?.totalAttempts || 0;
  const avgScore = totalAttempts > 0 ? Math.round((history?.totalPoints || 0) / totalAttempts) : 0;
  const recentAttempts = history?.attempts?.slice(0, 4) || [];

  return (
    <div>
      {/* Top 4 KPI Summary Cards (Matching reference top row) */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#fef3c7', color: '#d97706' }}>
            <Award size={22} />
          </div>
          <div>
            <div className="kpi-label">Cumulative Points</div>
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
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="kpi-label">Average KPI Score</div>
            <div className="kpi-value">{avgScore}%</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
            <Cpu size={22} />
          </div>
          <div>
            <div className="kpi-label">Evaluation Engine</div>
            <div className="kpi-value" style={{ fontSize: '20px', fontWeight: 900 }}>Gemini 3.5</div>
          </div>
        </div>
      </div>

      {/* Middle Grid: Active Scenario + Dark Contrast Card */}
      <div className="dashboard-grid-2col">
        {/* Left: Active Scenario Card */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="category-badge">
                {scenario?.category || 'Workplace Scenario'}
              </span>
              <button
                className="btn-glass"
                onClick={refreshScenario}
                style={{ padding: '6px 14px', fontSize: '12.5px', fontWeight: 700 }}
                title="Shuffle scenario"
              >
                <RefreshCw size={13} />
                <span>Shuffle</span>
              </button>
            </div>

            <h2 style={{ fontSize: '23px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.3px', lineHeight: '1.3' }}>
              {scenario ? scenario.scenario : 'Loading scenario...'}
            </h2>
            <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '22px' }}>
              {scenario ? scenario.context : 'Fetching the assigned workplace scenario from MongoDB database...'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '18px', borderTop: '1px solid rgba(228, 233, 246, 0.8)' }}>
            <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Evaluation criteria: <strong style={{ color: 'var(--text-primary)', fontWeight: 800 }}>5 Pillars (100 pts)</strong>
            </div>
            <button className="btn-primary" onClick={onStartAssessment}>
              <span>Start Assessment</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Right: Dark Frosted Glass Card (Matching reference "Upcoming Meeting" card) */}
        <div className="dark-glass-card">
          <div>
            <div className="dark-card-title">
              <Sparkles size={18} color="#f59e0b" />
              <span>Auto-Marking Rubric</span>
            </div>

            <div className="rubric-pill-list">
              <div className="rubric-item-row">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="rubric-dot" style={{ background: '#3b82f6' }} />
                  <span>Subject Line Quality</span>
                </div>
                <strong style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>20 pts</strong>
              </div>

              <div className="rubric-item-row">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="rubric-dot" style={{ background: '#10b981' }} />
                  <span>Email Structure</span>
                </div>
                <strong style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>15 pts</strong>
              </div>

              <div className="rubric-item-row">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="rubric-dot" style={{ background: '#f59e0b' }} />
                  <span>Content Relevance</span>
                </div>
                <strong style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>20 pts</strong>
              </div>

              <div className="rubric-item-row">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="rubric-dot" style={{ background: '#8b5cf6' }} />
                  <span>Tone & Etiquette</span>
                </div>
                <strong style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>25 pts</strong>
              </div>

              <div className="rubric-item-row">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="rubric-dot" style={{ background: '#ec4899' }} />
                  <span>Grammar & Spelling</span>
                </div>
                <strong style={{ fontSize: '14px', fontWeight: 800, color: '#f59e0b' }}>20 pts</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '16px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#9ca3af' }}>AI Powered</span>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              Ready to Grade
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Attempts (Matching reference "Employees" table) */}
      <div className="glass-table-wrap">
        <div className="table-header-row">
          <div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
              Recent Attempts & Scores
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>
              Stored attempts from your current anonymous session
            </p>
          </div>
          <button className="btn-glass" onClick={onViewHistory} style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 700 }}>
            <span>View All ({totalAttempts})</span>
          </button>
        </div>

        {recentAttempts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '14px' }}>
            No submissions recorded yet. Click <strong>Start Assessment</strong> above to take your first test!
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
              </tr>
            </thead>
            <tbody>
              {recentAttempts.map((att, index) => {
                const pct = att.totalScore || 0;
                const formattedDate = new Date(att.submittedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={att.attemptId || index}>
                    <td style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      #{att.attemptId?.slice(-6).toUpperCase()}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{att.scenario}</td>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13.5px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {att.subject}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div className="progress-track">
                          <div className="progress-fill-gradient" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          {att.totalScore}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
                      {formattedDate}
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
