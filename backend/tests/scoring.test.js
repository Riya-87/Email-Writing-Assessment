import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateScores, sanitizeFeedback, SCORING_RUBRIC, MAX_TOTAL_SCORE } from '../src/services/scoring.js';

describe('Scoring Service', () => {
  it('should verify rubric total sums to 100', () => {
    assert.strictEqual(MAX_TOTAL_SCORE, 100);
    assert.strictEqual(SCORING_RUBRIC.subject.max, 20);
    assert.strictEqual(SCORING_RUBRIC.structure.max, 15);
    assert.strictEqual(SCORING_RUBRIC.content.max, 20);
    assert.strictEqual(SCORING_RUBRIC.tone.max, 25);
    assert.strictEqual(SCORING_RUBRIC.grammar.max, 20);
  });

  it('should calculate perfect score when all maximums are achieved', () => {
    const raw = {
      subject: 20,
      structure: 15,
      content: 20,
      tone: 25,
      grammar: 20
    };
    const result = calculateScores(raw);
    assert.strictEqual(result.totalScore, 100);
    assert.deepStrictEqual(result.scores, raw);
  });

  it('should return 0 when all scores are 0', () => {
    const raw = {
      subject: 0,
      structure: 0,
      content: 0,
      tone: 0,
      grammar: 0
    };
    const result = calculateScores(raw);
    assert.strictEqual(result.totalScore, 0);
    assert.deepStrictEqual(result.scores, raw);
  });

  it('should correctly calculate realistic valid score', () => {
    const raw = {
      subject: 18,
      structure: 13,
      content: 17,
      tone: 22,
      grammar: 18
    };
    const result = calculateScores(raw);
    assert.strictEqual(result.totalScore, 88);
    assert.deepStrictEqual(result.scores, raw);
  });

  it('should clamp scores that exceed maximum allowed rubric limits', () => {
    const raw = {
      subject: 50, // max is 20
      structure: 30, // max is 15
      content: 99, // max is 20
      tone: 100, // max is 25
      grammar: 80 // max is 20
    };
    const result = calculateScores(raw);
    assert.strictEqual(result.scores.subject, 20);
    assert.strictEqual(result.scores.structure, 15);
    assert.strictEqual(result.scores.content, 20);
    assert.strictEqual(result.scores.tone, 25);
    assert.strictEqual(result.scores.grammar, 20);
    assert.strictEqual(result.totalScore, 100);
  });

  it('should clamp negative values and non-numeric values to 0', () => {
    const raw = {
      subject: -5,
      structure: 'invalid',
      content: null,
      tone: undefined,
      grammar: NaN
    };
    const result = calculateScores(raw);
    assert.strictEqual(result.scores.subject, 0);
    assert.strictEqual(result.scores.structure, 0);
    assert.strictEqual(result.scores.content, 0);
    assert.strictEqual(result.scores.tone, 0);
    assert.strictEqual(result.scores.grammar, 0);
    assert.strictEqual(result.totalScore, 0);
  });

  it('should sanitize feedback arrays and keep 1 to 3 items', () => {
    const rawFeedback = {
      strengths: ['Great opening', 'Clear closing', 'Appropriate tone', 'Extra item beyond 3'],
      improvements: ['  Fix comma splice  ', '']
    };
    const sanitized = sanitizeFeedback(rawFeedback);
    assert.strictEqual(sanitized.strengths.length, 3);
    assert.strictEqual(sanitized.strengths[0], 'Great opening');
    assert.strictEqual(sanitized.improvements.length, 1);
    assert.strictEqual(sanitized.improvements[0], 'Fix comma splice');
  });

  it('should provide sensible fallback feedback when empty or invalid', () => {
    const sanitized = sanitizeFeedback({});
    assert.strictEqual(sanitized.strengths.length, 1);
    assert.strictEqual(sanitized.improvements.length, 1);
  });
});
