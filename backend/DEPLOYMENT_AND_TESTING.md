# Backend Deployment & Production Verification Guide

## 1. Architecture Summary

The backend is built with **Node.js**, **Express**, **MongoDB Atlas**, and **Google Gemini Structured Outputs** (`@google/genai`).

- **Authentication**: Stateless, anonymous sessions via `sessionId` (UUID). No user logins or passwords.
- **Auto-Marking Engine**: Google Gemini model (`gemini-3.5-flash-lite`) with strict JSON response schema and system instructions defending against prompt injection.
- **Scoring Rubric**: Deterministic 5-pillar calculation enforced and clamped strictly on the backend:
  - Subject Line Quality: 0–20
  - Email Structure & Formatting: 0–15
  - Content Relevance: 0–20
  - Tone & Professionalism: 0–25
  - Grammar, Spelling & Punctuation: 0–20
  - **Total**: 0–100 points
- **Points Accumulation**: `submissions` collection in MongoDB serves as the single source of truth. Every successful attempt sums into `totalPoints`.

---

## 2. Production Security Hardening

| Layer | Configuration | Purpose |
| :--- | :--- | :--- |
| **HTTP Security Headers** | `helmet` middleware | Mitigates XSS, clickjacking, MIME-sniffing, and cross-origin leaks. |
| **Proxy Trust** | `app.set('trust proxy', 1)` | Ensures correct client IP identification behind Render / reverse proxies. |
| **Payload Size Limit** | `express.json({ limit: '100kb' })` | Rejects payload flooding (`413 PAYLOAD_TOO_LARGE`). |
| **Rate Limiting (General)** | 100 requests / 15 min per IP | Protects general API endpoints against scraping/DoS. |
| **Rate Limiting (Submissions)** | 15 submissions / 15 min per IP | Prevents Gemini API cost exhaustion and abuse (`429 SUBMISSION_RATE_LIMIT_EXCEEDED`). |
| **CORS Allowlist** | Multi-origin parsing from `FRONTEND_URL` | Allows local development (`localhost:5173`, `3000`) and deployed frontend. |
| **Input Sanitization** | Regex email validation, length caps, string trimming | Blocks malformed or malicious payloads. |
| **Secret Redaction** | Error interceptors mask sensitive keys and tokens | Prevents API key leakage in logs or client responses. |

---

## 3. High-Concurrency & Resiliency Controls

To support bursts of up to **1,000 concurrent candidate submissions** without external queue infrastructure (e.g. Redis, Kafka):

1. **In-Memory Concurrency Limiter (`src/services/concurrencyQueue.js`)**:
   - Limits simultaneous Gemini calls to **8 concurrent workers**.
   - Maintains a FIFO waiting queue (up to 250 requests).
   - Tasks waiting over 35 seconds time out gracefully with HTTP `504 QUEUE_TIMEOUT`.
   - Overflow requests receive immediate HTTP `429 QUEUE_CAPACITY_EXCEEDED`.

2. **Gemini Exponential Backoff & Jitter (`src/services/evaluator.js`)**:
   - Retries transient failures (HTTP 429 rate limits, 503 service unavailable, timeouts) up to 3 times.
   - Applies exponential delay with randomized jitter (800ms base delay up to 4000ms).

3. **Client Idempotency (`clientSubmissionId`)**:
   - Clients can supply `clientSubmissionId` in the body or `Idempotency-Key` header.
   - If a submission was already completed, the backend returns the cached result without re-calling Gemini or duplicating points.
   - Enforced by a sparse, unique MongoDB index on `{ clientSubmissionId: 1 }`.

---

## 4. Local Testing Commands

### A. Run Automated Unit and Integration Tests
```bash
cd backend
npm test
```
*Expected: 18 passing tests across 3 test suites (App routes, ConcurrencyQueue, Scoring Service).*

### B. Run End-to-End Database and Gemini Verification
```bash
cd backend
node tests/local_e2e_check.js
```
*Expected: Verifies MongoDB Atlas connectivity, random scenario retrieval, and live Gemini structured scoring.*

### C. Seed Database Scenarios
```bash
cd backend
npm run seed
```
*Expected: Seeds 12 standard workplace scenarios idempotently.*

### D. Start the Local Server
```bash
cd backend
npm start
```
*Server binds to `http://0.0.0.0:5000`.*

---

## 5. Endpoints Verification with cURL

### 1. Root Service Info
```bash
curl -i http://localhost:5000/
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Email Writing Assessment API is running"
}
```

### 2. Health Check
```bash
curl -i http://localhost:5000/api/health
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Backend is running"
}
```

### 3. Fetch Random Scenario
```bash
curl -i http://localhost:5000/api/scenarios/random
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "<scenario_id>",
    "scenario": "Ask your manager for a day off",
    "context": "You need to request personal time off for next Friday...",
    "category": "Workplace Request"
  }
}
```

### 4. Submit Email for Evaluation
```bash
curl -i -X POST http://localhost:5000/api/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-001",
    "scenarioId": "<scenario_id_from_above>",
    "to": "manager@company.com",
    "subject": "Request for Time Off - Next Friday",
    "body": "Dear Sarah,\n\nI am writing to formally request a day off next Friday for a family event. All current tasks are ahead of schedule and Alex is covering urgent inquiries.\n\nBest regards,\nCandidate",
    "clientSubmissionId": "sub-uuid-001"
  }'
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "attemptId": "<attempt_id>",
    "scores": {
      "subject": 20,
      "structure": 15,
      "content": 20,
      "tone": 25,
      "grammar": 20
    },
    "totalScore": 100,
    "feedback": {
      "strengths": ["..."],
      "improvements": ["..."]
    },
    "pointsAdded": 100,
    "totalPoints": 100,
    "submittedAt": "2026-09-22T..."
  }
}
```

### 5. Fetch Attempt Result
```bash
curl -i "http://localhost:5000/api/results/<attempt_id>?sessionId=test-session-001"
```

### 6. Fetch Session History
```bash
curl -i "http://localhost:5000/api/history/test-session-001"
```

---

## 6. Render Deployment Details

- **Deployed URL**: `https://e-mail-writing-assessment-db.onrender.com`
- **Health Check Path**: `/api/health`
- **Environment Variables Configured on Render**:
  - `PORT`: (Managed dynamically by Render)
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: Atlas connection string
  - `DATABASE_NAME`: `email_writing_assessment`
  - `GEMINI_API_KEY`: Google Gemini API Key
  - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
  - `FRONTEND_URL`: Allowed frontend origin(s)
