/**
 * Centralized API client for communicating with the Email Writing Assessment backend.
 * Reads API base URL from VITE_API_URL environment variable with fallback to local development URL.
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE = RAW_API_URL.replace(/\/+$/, '');

/**
 * Generic request wrapper with comprehensive error handling and JSON parsing.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = data?.error?.code || 'API_ERROR';
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Cannot connect to backend server. Please verify the backend is running.');
      networkError.code = 'NETWORK_ERROR';
      networkError.status = 0;
      throw networkError;
    }
    throw error;
  }
}

/**
 * Check backend health
 */
export async function checkHealth() {
  return request('/health');
}

/**
 * Fetch a random scenario from the backend
 */
export async function getRandomScenario() {
  const result = await request('/scenarios/random');
  return result.data;
}

/**
 * Submit an email for AI evaluation and database persistence
 */
export async function submitAssessment({ sessionId, scenarioId, to, subject, body }) {
  const result = await request('/submissions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      scenarioId,
      to,
      subject,
      body
    })
  });
  return result.data;
}

/**
 * Retrieve results for a specific attempt
 */
export async function getAttemptResult(attemptId, sessionId) {
  const result = await request(`/results/${encodeURIComponent(attemptId)}?sessionId=${encodeURIComponent(sessionId)}`);
  return result.data;
}

/**
 * Fetch all previous attempts and cumulative points for a session
 */
export async function getSessionHistory(sessionId) {
  const result = await request(`/history/${encodeURIComponent(sessionId)}`);
  return result.data;
}
