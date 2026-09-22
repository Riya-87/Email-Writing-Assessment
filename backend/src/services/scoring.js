/**
 * Scoring rubric and validation configuration for Email Writing Assessment.
 *
 * NOTE: The original assignment Task2-email_writing.pdf requires an auto-marking
 * score out of 100 based on five criteria: subject line, structure, content, tone, and grammar.
 * It does not mandate the exact distribution among these five categories.
 * As an implementation choice (proposed in the secondary reference document),
 * the 100 points are allocated across the 5 categories as configured below.
 */

export const SCORING_RUBRIC = {
  subject: {
    max: 20,
    label: 'Subject Line Quality',
    description: 'Clarity, conciseness, relevance, and formatting of the subject line.'
  },
  structure: {
    max: 15,
    label: 'Email Structure',
    description: 'Proper salutation, logical paragraph progression, and professional closing.'
  },
  content: {
    max: 20,
    label: 'Content Relevance & Completeness',
    description: 'Addresses the scenario context directly with required details and clear intent.'
  },
  tone: {
    max: 25,
    label: 'Tone & Professionalism',
    description: 'Appropriate level of formality, courtesy, empathy, and professional etiquette.'
  },
  grammar: {
    max: 20,
    label: 'Grammar, Spelling & Punctuation',
    description: 'Syntactic accuracy, spelling correctness, and proper punctuation usage.'
  }
};

export const MAX_TOTAL_SCORE = Object.values(SCORING_RUBRIC).reduce((sum, item) => sum + item.max, 0); // 100

/**
 * Validates and sanitizes individual criterion score against rubric bounds.
 *
 * @param {number} value
 * @param {number} max
 * @returns {number}
 */
function clampScore(value, max) {
  const numeric = Number(value);
  if (Number.isNaN(numeric) || numeric < 0) {
    return 0;
  }
  if (numeric > max) {
    return max;
  }
  return Math.round(numeric);
}

/**
 * Calculates and validates category scores and final score out of 100.
 * Guarantees a deterministic integer score between 0 and 100.
 *
 * @param {Object} rawScores
 * @param {number} rawScores.subject
 * @param {number} rawScores.structure
 * @param {number} rawScores.content
 * @param {number} rawScores.tone
 * @param {number} rawScores.grammar
 * @returns {{ scores: { subject: number, structure: number, content: number, tone: number, grammar: number }, totalScore: number }}
 */
export function calculateScores(rawScores = {}) {
  const scores = {
    subject: clampScore(rawScores.subject, SCORING_RUBRIC.subject.max),
    structure: clampScore(rawScores.structure, SCORING_RUBRIC.structure.max),
    content: clampScore(rawScores.content, SCORING_RUBRIC.content.max),
    tone: clampScore(rawScores.tone, SCORING_RUBRIC.tone.max),
    grammar: clampScore(rawScores.grammar, SCORING_RUBRIC.grammar.max)
  };

  const totalScore = scores.subject + scores.structure + scores.content + scores.tone + scores.grammar;

  return {
    scores,
    totalScore: Math.min(Math.max(totalScore, 0), MAX_TOTAL_SCORE)
  };
}

/**
 * Sanitizes and validates feedback arrays for strengths and improvements.
 *
 * @param {Object} feedback
 * @param {string[]} feedback.strengths
 * @param {string[]} feedback.improvements
 * @returns {{ strengths: string[], improvements: string[] }}
 */
export function sanitizeFeedback(feedback = {}) {
  const cleanList = (list, defaultItem) => {
    if (!Array.isArray(list)) return [defaultItem];
    const filtered = list
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(item => item.length > 0);
    return filtered.length > 0 ? filtered.slice(0, 3) : [defaultItem];
  };

  return {
    strengths: cleanList(feedback.strengths, 'Demonstrated clear intent in the communication.'),
    improvements: cleanList(feedback.improvements, 'Ensure all details of the scenario are addressed thoroughly.')
  };
}
