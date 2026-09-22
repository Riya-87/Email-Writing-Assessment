# Email Writing Assessment System

An AI-powered web application that assesses candidates' professional email writing abilities against a 5-pillar rubric using **Google Gemini Structured Outputs**, persists evaluations and cumulative points in **MongoDB Atlas**, and provides an interactive frosted-glass UI built with **React** and **Vite**.

---

## 📁 Repository Structure

```text
├── backend/                       # Node.js & Express REST API
│   ├── src/
│   │   ├── config/               # MongoDB Atlas connection & indexing
│   │   ├── controllers/          # Request handling (Scenarios, Submissions, History)
│   │   ├── middleware/           # Centralized error handler & route guards
│   │   ├── routes/               # API route definitions
│   │   ├── seed/                 # Database scenario seeding script
│   │   ├── services/             # Gemini AI evaluator, scoring engine, concurrency queue
│   │   ├── app.js                # Express app, Helmet, CORS, Rate limiting
│   │   └── server.js             # Server startup & graceful shutdown
│   ├── tests/                    # Unit, concurrency, and integration tests
│   └── package.json
│
├── frontend/                      # React 19 + Vite Single Page Application
│   ├── public/                   # Static assets & icons
│   ├── src/
│   │   ├── assets/               # Branding & illustration assets
│   │   ├── components/           # Reusable UI (Header, Sidebar, Background animations)
│   │   ├── pages/                # Views (Landing, Assessment, Results, History)
│   │   ├── services/             # API client service
│   │   ├── styles/               # Glassmorphism & layout stylesheets
│   │   └── utils/                # Session & state management
│   ├── index.html
│   └── package.json
│
└── README.md
```

---

## 🌟 Key Features

1. **Frictionless Anonymous Access**: Automatic UUID session identification without login or passwords.
2. **Dynamic Workplace Scenarios**: Randomly served from a curated collection in MongoDB Atlas.
3. **5-Pillar Evaluation Rubric (100 Points Total)**:
   - **Subject Line Quality**: 0 – 20 points
   - **Email Structure & Formatting**: 0 – 15 points
   - **Content Relevance**: 0 – 20 points
   - **Tone & Professionalism**: 0 – 25 points
   - **Grammar, Spelling & Punctuation**: 0 – 20 points
4. **Actionable Constructive Feedback**: Specific strengths and areas for improvement.
5. **Cumulative Points Tracking**: Submissions accumulate points across candidate attempts.
6. **High-Concurrency Protection**: In-memory bounded concurrency queue with FIFO backpressure.
7. **Production Security**: Helmet headers, IP rate limiting, 100kb payload caps, and zero-trust input validation.

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd backend
npm install
```

Configure your `.env` in `backend/`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=email_writing_assessment
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
FRONTEND_URL=http://localhost:5173
```

Seed initial workplace scenarios:
```bash
npm run seed
```

Run tests & start backend:
```bash
npm test
npm start
```

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

---

## 🌐 Live Deployments

- **Frontend**: Deployed on Firebase Hosting
- **Backend**: Deployed on Render
- **Database**: MongoDB Atlas
- **AI Engine**: Google Gemini API
