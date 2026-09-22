import React from 'react';
import { Award, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

export default function ResultPage({ result, onTryAgain, onViewHistory }) {
  if (!result) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'var(--text-muted)' }}>No recent assessment result found.</p>
        <button className="btn-primary" onClick={onTryAgain} style={{ marginTop: '16px' }}>
          Take Assessment
        </button>
      </div>
    );
  }

  const { totalScore = 0, scores = {}, feedback = {}, pointsAdded = 0, totalPoints = 0 } = result;

  const getBadgeStyle = (score) => {
    if (score >= 85) return { text: 'Outstanding Communication', color: '#059669', bg: '#ecfdf5' };
    if (score >= 70) return { text: 'Proficient & Clear', color: '#4f46e5', bg: '#eef2ff' };
    if (score >= 50) return { text: 'Developing / Adequate', color: '#d97706', bg: '#fffbeb' };
    return { text: 'Needs Improvement', color: '#dc2626', bg: '#fef2f2' };
  };

  const badge = getBadgeStyle(totalScore);

  const criteria = [
    { key: 'subject', label: 'Subject Line', score: scores.subject || 0, max: 20 },
    { key: 'structure', label: 'Email Structure', score: scores.structure || 0, max: 15 },
    { key: 'content', label: 'Content Relevance', score: scores.content || 0, max: 20 },
    { key: 'tone', label: 'Tone & Etiquette', score: scores.tone || 0, max: 25 },
    { key: 'grammar', label: 'Grammar & Mechanics', score: scores.grammar || 0, max: 20 },
  ];

  return (
    <div>
      {/* Top Score Banner */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: '98px',
            height: '98px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 25px -4px rgba(15, 23, 42, 0.35)',
            border: '2.5px solid rgba(245, 158, 11, 0.5)'
          }}>
            <span style={{ fontSize: '38px', fontWeight: 900, lineHeight: 1, color: '#f59e0b', letterSpacing: '-0.8px' }}>{totalScore}</span>
            <span style={{ fontSize: '10.5px', opacity: 0.9, fontWeight: 800, letterSpacing: '0.8px', marginTop: '2px' }}>OUT OF 100</span>
          </div>

          <div>
            <span style={{
              display: 'inline-block',
              padding: '5px 14px',
              borderRadius: '99px',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.4px',
              color: badge.color,
              background: badge.bg,
              marginBottom: '6px'
            }}>
              {badge.text}
            </span>
            <h2 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Evaluation Scorecard
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>
              +{pointsAdded} points added to your candidate profile
            </p>
          </div>
        </div>

        <div style={{
          background: 'var(--glass-card-bg)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-card-border)',
          borderRadius: '16px',
          padding: '18px 26px',
          textAlign: 'right',
          boxShadow: 'var(--shadow-card)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 800, display: 'block', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total Cumulative Points
          </span>
          <span style={{ fontSize: '30px', fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.5px' }}>
            {totalPoints} <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>pts</span>
          </span>
        </div>
      </div>

      {/* 5-Criteria Cards Grid */}
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Pillars Breakdown
      </h3>
      <div className="scores-grid">
        {criteria.map((item) => {
          const pct = Math.round((item.score / item.max) * 100);
          return (
            <div key={item.key} className="score-card">
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                {item.label}
              </span>
              <div className="score-num">
                {item.score} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 700 }}>/ {item.max}</span>
              </div>
              <div className="progress-track" style={{ width: '100%', marginTop: '10px' }}>
                <div className="progress-fill-gradient" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actionable Feedback Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', marginBottom: '12px' }}>
            <CheckCircle2 size={19} />
            <h4 style={{ fontSize: '16px', fontWeight: 800 }}>What You Did Well</h4>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {feedback.strengths?.map((str, idx) => (
              <li key={idx} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', gap: '8px', lineHeight: '1.5' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', marginBottom: '12px' }}>
            <AlertTriangle size={19} />
            <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Areas for Improvement</h4>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {feedback.improvements?.map((imp, idx) => (
              <li key={idx} style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', gap: '8px', lineHeight: '1.5' }}>
                <span style={{ color: '#f59e0b', fontWeight: 800 }}>•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn-glass" onClick={onViewHistory}>
          <Award size={15} />
          <span>View All Attempts</span>
        </button>

        <button className="btn-primary" onClick={onTryAgain} style={{ padding: '11px 26px' }}>
          <RotateCcw size={15} />
          <span>Practice Another Scenario</span>
        </button>
      </div>
    </div>
  );
}
