const SESSION_STORAGE_KEY = 'email_assessment_session_id';

/**
 * Retrieves the anonymous session ID from localStorage or creates a new UUID if none exists.
 * Does not require or store authentication, passwords, or personal user data.
 *
 * @returns {string} The active browser session UUID.
 */
export function getSessionId() {
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Clears the session ID to start a fresh candidate profile if desired.
 */
export function resetSessionId() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  return getSessionId();
}
