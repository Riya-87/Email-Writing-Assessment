# Email Writing Assessment — Backend API

A lightweight, robust Node.js and Express backend powering the **Email Writing Assessment** web application. Evaluates candidate email submissions using Google Gemini Structured Outputs against a professional 5-pillar rubric, accumulates assessment points, and persists attempt history via MongoDB Atlas.

---

## Table of Contents

1. [Backend Purpose](#1-backend-purpose)
2. [Assignment Scope & Source Priority](#2-assignment-scope--source-priority)
3. [Architecture (MongoDB + Google Gemini)](#3-architecture-mongodb--google-gemini)
4. [Folder Structure](#4-folder-structure)
5. [Installation](#5-installation)
6. [Environment Variables](#6-environment-variables)
7. [MongoDB Atlas Setup](#7-mongodb-atlas-setup)
8. [Google Gemini Configuration](#8-google-gemini-configuration)
9. [Seed Command](#9-seed-command)
10. [Development Server](#10-development-server)
11. [Production Start](#11-production-start)
12. [API Endpoints Reference](#12-api-endpoints-reference)
    - [GET /api/health](#get-apihealth)
    - [GET /api/scenarios/random](#get-apiscenariosrandom)
    - [POST /api/submissions](#post-apisubmissions)
    - [GET /api/results/:attemptId](#get-apiresultsattemptid)
    - [GET /api/history/:sessionId](#get-apihistorysessionid)
13. [Frontend Integration Contract](#13-frontend-integration-contract)
14. [Testing](#14-testing)
15. [AWS Deployment Notes](#15-aws-deployment-notes)

---

## 1. Backend Purpose

The backend provides a secure REST API for assessing candidates' professional email writing abilities.

Key functionalities:
- **No Login / Frictionless Access**: Evaluates anonymous sessions identified by a client-generated `sessionId` (UUID).
- **Random Scenario Generation**: Retrieves workplace communication scenarios randomly using MongoDB aggregation.
- **Automated Marking (Auto-marking)**: Scores emails on a 0–100 scale using Google Gemini Structured Outputs (`@google/genai` strict schema).
- **5-Criterion Evaluation**: Evaluates Subject line, Structure, Content relevance, Tone/Professionalism, and Grammar.
- **Points Accumulation**: Dynamically sums assessment scores to calculate a candidate's cumulative points.
- **Actionable Feedback**: Delivers specific strengths and improvement recommendations.
- **Attempt History**: Stores past submissions in MongoDB for historical review.

---

## 2. Assignment Scope & Source Priority

### Authoritative Document (Priority 1: `Task2-email_writing.pdf`)
The authoritative assignment requires:
1. No login (instant start).
2. Random email-writing situations (e.g., asking a manager for a day off, replying to a customer with a damaged product, follow-up after an interview).
3. Email composition: `To`, `Subject`, `Body`.
4. Auto-marking giving a score out of 100 based on Subject line, Structure, Content, Tone, and Grammar.
5. Points: every attempt adds its score to the candidate's total points.
6. Feedback: score, strengths ("what they did well"), and improvements ("what to improve").
7. Saved results: scores and past attempts are stored in MongoDB.

### Secondary Reference (Priority 2: `Email_Writing_Assessment_Project.pdf`)
Used only where it helps implement the core assignment:
- **Scoring Rubric Breakdown**: The original assignment mandates a total score of 100 across five criteria but does not dictate individual category weights. As an implementation choice drawn from the secondary document:
  - **Subject Line Quality**: 20 points
  - **Email Structure**: 15 points
  - **Content Relevance**: 20 points
  - **Tone & Professionalism**: 25 points
  - **Grammar, Spelling & Punctuation**: 20 points
  - **Total**: 100 points

### Intentionally Omitted Out-of-Scope Features
To keep the backend minimal, clean, and avoid over-engineering, the following items from the secondary document were intentionally excluded:
- User accounts, passwords, JWT auth, and admin panels.
- Microservices, Redis, Kafka, WebSockets, background queues, and container orchestration (Kubernetes/ECS).
- Separate NLTK, LanguageTool, or multi-stage sentiment pipelines (Gemini Structured Outputs performs deterministic evaluation directly).
- Sentry, DataDog, or heavy monitoring frameworks.

---

## 3. Architecture (MongoDB + Google Gemini)

MongoDB Atlas and Google Gemini are two distinct, decoupled services:

```
React Frontend (SPA / Firebase Hosting / AWS)
           │
           │  HTTPS REST API (JSON)
           ▼
Node.js + Express Backend (AWS EC2 / Server)
      ├── Reusable MongoClient Connection Pool
      │         │
      │         ▼
      │    MongoDB Atlas (email_writing_assessment)
      │         ├── scenarios   (writing prompts)
      │         └── submissions (single source of truth for attempts & points)
      │
      └── Evaluator Service (@google/genai SDK)
                │
                ▼
           Google Gemini API (gemini-2.5-flash-lite)
```

---

## 4. Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js              # Reusable MongoClient, Atlas connection & index management
│   ├── controllers/
│   │   ├── scenarioController.js    # Random scenario retrieval
│   │   ├── submissionController.js  # Validation, AI evaluation & submission persistence
│   │   ├── resultController.js      # Individual attempt lookup & session authorization
│   │   └── historyController.js     # User attempt history & cumulative points calculation
│   ├── routes/
│   │   ├── scenarioRoutes.js        # /api/scenarios
│   │   ├── submissionRoutes.js      # /api/submissions
│   │   ├── resultRoutes.js          # /api/results
│   │   └── historyRoutes.js         # /api/history
│   ├── services/
│   │   ├── evaluator.js             # Google Gemini integration with strict schema & prompt injection protection
│   │   └── scoring.js               # Centralized scoring rubric, clamping, and feedback sanitation
│   ├── middleware/
│   │   └── errorHandler.js          # Centralized error and 404 response handlers
│   ├── seed/
│   │   └── scenarios.js             # Idempotent scenario seed script (12 realistic scenarios)
│   ├── app.js                       # Express app setup, CORS, JSON limit, routing
│   └── server.js                    # Server bootstrap, DB initialization, graceful shutdown
├── tests/
│   └── scoring.test.js              # Deterministic scoring unit tests (Node.js test runner)
├── .env.example                     # Sample configuration template
├── .gitignore                       # Git ignore file
├── package.json                     # Node.js project manifest (ES Modules)
└── README.md                        # Documentation
```

---

## 5. Installation

Ensure Node.js (v20+ recommended) and npm are installed.

```bash
cd backend
npm install
```

---

## 6. Environment Variables

Create a `.env` file in `backend/` based on `.env.example`:

```bash
cp .env.example .env
```

Configuration variables:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string (Atlas or local) | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `DATABASE_NAME` | MongoDB database name | `email_writing_assessment` |
| `GEMINI_API_KEY` | Google Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini Model for evaluation | `gemini-2.5-flash-lite` |
| `FRONTEND_URL` | Allowed CORS origin (supports `*` for broad access) | `http://localhost:5173` |

> **Security Note**: Never commit `.env` or expose `GEMINI_API_KEY` or `MONGODB_URI` to the client.

---

## 7. MongoDB Atlas Setup

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. In Network Access, allow your server IP (or `0.0.0.0/0` during development).
3. Set your connection string into `MONGODB_URI` in `.env`.
4. The application will automatically create the database `email_writing_assessment` and the required collections:
   - `scenarios`: Stores available writing prompts.
   - `submissions`: Stores candidate attempts, scores, and feedback.

---

## 8. Google Gemini Configuration

1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Set `GEMINI_API_KEY` in `backend/.env`.
3. Set `GEMINI_MODEL=gemini-3.5-flash-lite` (default budget-oriented model with high-speed structured output).
4. The backend uses the official `@google/genai` SDK with strict JSON schema Structured Outputs.

---

## 9. Seed Command

Populate the database with 12 realistic workplace scenarios (including the 3 required assignment prompts):

```bash
npm run seed
```

This operation is **idempotent**: running it multiple times will not create duplicates.

---

## 10. Development Server

Start the server with hot reloading via `nodemon`:

```bash
npm run dev
```

---

## 11. Production Start

Start the server directly with Node.js:

```bash
npm start
```

---

## 12. API Endpoints Reference

All endpoints return uniform JSON formats.

### Response Format Convention

**Success (`200 OK` / `201 Created`):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error (`400`, `403`, `404`, `429`, `500`, `503`):**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable explanation"
  }
}
```

---

### GET /api/health
Checks backend health and service readiness.

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Backend is running"
}
```

---

### GET /api/scenarios/random
Fetches a random email writing scenario from MongoDB for the candidate to solve.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "673f1a2b8e3914a24c5e6001",
    "scenario": "Ask your manager for a day off",
    "context": "You need to request personal time off for next Friday due to a family commitment. Ensure your current projects are handed over or up to date.",
    "category": "Workplace Request"
  }
}
```

---

### POST /api/submissions
Submits an email for Gemini evaluation, backend score calculation, and persistence in MongoDB.

**Request Body:**
```json
{
  "sessionId": "a8f5c32e-1b4d-4972-881a-6d6543b12345",
  "scenarioId": "673f1a2b8e3914a24c5e6001",
  "to": "manager@company.com",
  "subject": "Request for Time Off - Friday, Oct 24",
  "body": "Dear Sarah,\n\nI am writing to formally request a day off next Friday, October 24th, to attend a family commitment. I have made sure all my tasks for the sprint are ahead of schedule, and Alex has agreed to cover any urgent client requests.\n\nThank you for considering my request.\n\nBest regards,\nCandidate"
}
```

**Validation Rules:**
- `sessionId`: String, non-empty, max 100 characters.
- `scenarioId`: Valid MongoDB 24-character hex ObjectId.
- `to`: Valid email address string.
- `subject`: String, 1–200 characters.
- `body`: String, 1–10,000 characters.

**Response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "attemptId": "673f1b5c8e3914a24c5e6099",
    "scores": {
      "subject": 19,
      "structure": 15,
      "content": 19,
      "tone": 24,
      "grammar": 19
    },
    "totalScore": 96,
    "feedback": {
      "strengths": [
        "Concise, informative subject line with specific date.",
        "Proactively outlined task coverage and handover plan.",
        "Professional salutation and closing."
      ],
      "improvements": [
        "Could specify emergency contact channel if urgent matter arises."
      ]
    },
    "pointsAdded": 96,
    "totalPoints": 278,
    "submittedAt": "2026-09-21T11:30:00.000Z"
  }
}
```

---

### GET /api/results/:attemptId?sessionId=<uuid>
Retrieves the detailed results of a specific submission. Requires matching `sessionId` for session isolation.

**Query Parameter:**
- `sessionId`: The candidate's browser session UUID.

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "attemptId": "673f1b5c8e3914a24c5e6099",
    "scores": {
      "subject": 19,
      "structure": 15,
      "content": 19,
      "tone": 24,
      "grammar": 19
    },
    "totalScore": 96,
    "feedback": {
      "strengths": [
        "Concise, informative subject line with specific date."
      ],
      "improvements": [
        "Could specify emergency contact channel if urgent matter arises."
      ]
    },
    "pointsAdded": 96,
    "totalPoints": 278,
    "submittedAt": "2026-09-21T11:30:00.000Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR`: Missing or invalid `attemptId` / `sessionId`.
- `403 FORBIDDEN`: Attempt belongs to another session.
- `404 NOT_FOUND`: Attempt ID not found.

---

### GET /api/history/:sessionId
Fetches the session's overall stats and chronological list of previous attempts (newest first, up to 50).

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "sessionId": "a8f5c32e-1b4d-4972-881a-6d6543b12345",
    "totalAttempts": 3,
    "totalPoints": 278,
    "attempts": [
      {
        "attemptId": "673f1b5c8e3914a24c5e6099",
        "scenario": "Ask your manager for a day off",
        "subject": "Request for Time Off - Friday, Oct 24",
        "totalScore": 96,
        "submittedAt": "2026-09-21T11:30:00.000Z"
      },
      {
        "attemptId": "673f1a998e3914a24c5e6042",
        "scenario": "Reply to a customer who received a damaged product",
        "subject": "Apology regarding damaged shipment",
        "totalScore": 92,
        "submittedAt": "2026-09-21T11:15:00.000Z"
      }
    ]
  }
}
```

---

## 13. Frontend Integration Contract

For the frontend developer building the React UI:

1. **Session Management**:
   - On initial page load, check `localStorage` for `sessionId`. If absent, generate a standard UUID (`crypto.randomUUID()`) and store it.
   - Attach `sessionId` to `POST /api/submissions`, `GET /api/results/:attemptId?sessionId=...`, and `GET /api/history/:sessionId`.

2. **Assessment Flow**:
   - **Start**: Call `GET /api/scenarios/random` to fetch scenario prompt (`scenario`, `context`, `category`, `id`).
   - **Form**: Render input fields for `To`, `Subject`, and `Body`.
   - **Submit**: Post to `/api/submissions` with the payload `{ sessionId, scenarioId, to, subject, body }`.
   - **Result Screen**: Display `totalScore` (/100), criterion breakdown (`scores`), `feedback.strengths`, and `feedback.improvements`.
   - **Scoreboard / History**: Fetch `GET /api/history/:sessionId` to show cumulative `totalPoints`, total attempts, and past attempt list.

---

## 14. Testing

Automated unit tests cover deterministic scoring logic, bound clamping, and feedback sanitation.

Run tests using the native Node.js test runner:
```bash
npm test
```

---

## 15. AWS Deployment Notes

The backend is configured for cloud deployment (e.g. AWS EC2 / Lightsail):

- **Port Binding**: Respects `process.env.PORT` (defaults to 5000).
- **Process Management**: Can be managed in production using `pm2`:
  ```bash
  npm install -g pm2
  pm2 start src/server.js --name "email-assessment-backend"
  ```
- **Reverse Proxy**: Place behind Nginx with SSL termination via Certbot.
- **Environment Isolation**: Inject production environment variables via AWS system environment or `.env` file without committing secrets.
- **Health Check**: Configure AWS health checks targeting `GET /api/health`.
