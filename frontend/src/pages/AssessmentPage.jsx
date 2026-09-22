import React, { useState, useEffect } from 'react';
import { getRandomScenario, submitAssessment } from '../services/api.js';
import { getSessionId } from '../utils/session.js';
import { RefreshCw, Send, AlertCircle, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AssessmentPage({ onSubmitSuccess }) {
  const [scenario, setScenario] = useState(null);
  const [loadingScenario, setLoadingScenario] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    loadScenario();
  }, []);

  async function loadScenario() {
    setLoadingScenario(true);
    setError(null);
    try {
      const data = await getRandomScenario();
      setScenario(data);
      if (data?.category === 'Customer Support') {
        setTo('customer@clientdomain.com');
      } else if (data?.category === 'Workplace Request' || data?.category === 'Status Update') {
        setTo('manager@company.com');
      } else if (data?.category === 'Job Application') {
        setTo('interviewer@company.com');
      } else {
        setTo('recipient@organization.com');
      }
    } catch (err) {
      setError(err.message || 'Failed to load scenario. Please check backend connection.');
    } finally {
      setLoadingScenario(false);
    }
  }

  function validate() {
    const errs = {};
    if (!to.trim()) {
      errs.to = 'Recipient email (To) is required.';
    } else if (!EMAIL_REGEX.test(to.trim())) {
      errs.to = 'Please enter a valid email address.';
    }

    if (!subject.trim()) {
      errs.subject = 'Subject line is required.';
    } else if (subject.trim().length > 200) {
      errs.subject = 'Subject cannot exceed 200 characters.';
    }

    if (!body.trim()) {
      errs.body = 'Email body cannot be empty.';
    } else if (body.trim().length < 15) {
      errs.body = 'Please compose a more complete email (at least 15 characters).';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (!scenario?.id) {
      setError('No scenario loaded. Please refresh scenario.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const sessionId = getSessionId();
      const result = await submitAssessment({
        sessionId,
        scenarioId: scenario.id,
        to: to.trim(),
        subject: subject.trim(),
        body: body.trim()
      });

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }
    } catch (err) {
      setError(err.message || 'Evaluation failed. Please try again.');
      setSubmitting(false);
    }
  }

  if (loadingScenario) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <RefreshCw size={32} className="animate-spin" color="#f59e0b" style={{ margin: '0 auto 16px' }} />
        <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Retrieving your email scenario from MongoDB...</p>
      </div>
    );
  }

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div>
      {/* Scenario Header Panel */}
      {scenario && (
        <div className="glass-panel" style={{ marginBottom: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <span className="category-badge">{scenario.category}</span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                {scenario.scenario}
              </h2>
              <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {scenario.context}
              </p>
            </div>

            <button
              type="button"
              className="btn-glass"
              onClick={loadScenario}
              disabled={submitting}
              style={{ flexShrink: 0, padding: '7px 16px', fontSize: '12.5px', fontWeight: 700 }}
            >
              <RefreshCw size={13} />
              <span>New Scenario</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '14px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--color-danger)',
          fontSize: '14px',
          fontWeight: 600
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Workspace Split: Editor + Checklist Rail */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Email Editor Form */}
        <form onSubmit={handleSubmit} className="glass-panel">
          <div className="form-group">
            <label className="form-label" htmlFor="email-to">
              Recipient Email (To)
            </label>
            <input
              id="email-to"
              type="email"
              className="glass-input"
              placeholder="e.g. manager@company.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              disabled={submitting}
            />
            {validationErrors.to && (
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-danger)', marginTop: '5px', display: 'block' }}>
                {validationErrors.to}
              </span>
            )}
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" htmlFor="email-subject" style={{ margin: 0 }}>
                Subject Line
              </label>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {subject.length} / 200 chars
              </span>
            </div>
            <input
              id="email-subject"
              type="text"
              className="glass-input"
              placeholder="e.g. Request for a day off next Friday"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              disabled={submitting}
            />
            {validationErrors.subject && (
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-danger)', marginTop: '5px', display: 'block' }}>
                {validationErrors.subject}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" htmlFor="email-body" style={{ margin: 0 }}>
                Email Body
              </label>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {wordCount} words
              </span>
            </div>
            <textarea
              id="email-body"
              className="glass-input glass-textarea"
              placeholder="Write your email here... Remember to include greeting, structured paragraphs, and sign-off."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={submitting}
            />
            {validationErrors.body && (
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-danger)', marginTop: '5px', display: 'block' }}>
                {validationErrors.body}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '14px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
              style={{ padding: '13px 30px', fontSize: '15px', fontWeight: 800, opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? (
                <>
                  <Sparkles size={17} className="animate-spin" color="#f59e0b" />
                  <span>Evaluating with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit for Evaluation</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Rail: Tips & Evaluation Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--text-primary)' }}>
              <HelpCircle size={18} color="#f59e0b" />
              <h4 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.2px' }}>Evaluation Criteria</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Subject Line (20%)</strong>: Concise, clear, and relevant.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Structure (15%)</strong>: Salutation, clean paragraphs, professional sign-off.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Content (20%)</strong>: Addresses the exact scenario prompt.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Tone (25%)</strong>: Courteous, respectful, and appropriate.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><strong style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Grammar (20%)</strong>: Accurate spelling, syntax, and punctuation.</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', background: '#fef3c7', borderColor: '#fde68a' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              PRO TIP
            </span>
            <p style={{ fontSize: '13.5px', fontWeight: 600, color: '#92400e', lineHeight: '1.5', marginTop: '6px' }}>
              Always state the specific call-to-action or expected next step in the closing paragraph.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
