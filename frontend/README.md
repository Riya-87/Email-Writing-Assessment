# Email Writing Assessment — Frontend Application

A modern, responsive React web application designed with a premium frosted glassmorphism visual language. Connects to the Email Writing Assessment REST backend to present random workplace scenarios, collect candidate email compositions (To, Subject, Body), provide instant auto-marking feedback across 5 evaluation pillars, and track historical attempts and points.

---

## Visual Design & Aesthetics

Inspired by modern SaaS interfaces:
- **Atmospheric Palette**: Soft lavender and periwinkle ambient gradients with delicate diffuse glows.
- **Glassmorphism**: Translucent frosted glass canvas (`backdrop-filter: blur(24px)`), low-contrast white borders, and soft layered shadows.
- **Micro-Interactions**: Rounded pill navigation bar, interactive scenario cards, live character/word counters, and visual progress meters for individual rubric criteria.

---

## Core Application Flow

1. **Landing Page**:
   - Hero presentation with 3 core pillars (Dynamic Scenarios, Auto-Marking, Cumulative Points).
   - "Start Assessment" and "History" quick navigation.
2. **Assessment Workspace**:
   - Dynamic random scenario presentation with category badge and scenario context.
   - Form fields for `To`, `Subject` (with character counter), and `Body` (with word counter).
   - Client-side validation for email syntax and required content.
   - Disabled states and animated loading indicators during AI evaluation.
3. **Evaluation Result**:
   - Overall score out of 100 with dynamic performance badge.
   - Criteria breakdown across Subject (20), Structure (15), Content (20), Tone (25), and Grammar (20).
   - Actionable feedback cards for strengths and areas for improvement.
   - Cumulative points indicator reflecting total session score.
4. **History Dashboard**:
   - Cumulative stats: Total attempts, Total session points, Average score.
   - Chronological list of past submissions with scores and timestamps.
   - Ability to review past attempt results.

---

## Technology Stack

- **Framework**: React 19 + Vite 8
- **Icons**: Lucide React
- **Styling**: Custom Glassmorphism CSS design system (`src/styles/glass.css`)
- **State & Session**: Pure React state + anonymous browser `localStorage` UUID session tracking (no login required)

---

## Setup & Running Locally

### 1. Installation

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Configure `VITE_API_URL` to point to your backend:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Server

```bash
npm run dev
```

The app will start on `http://localhost:5173`.

### 4. Build for Production

```bash
npm run build
```

Production-ready static files are generated in the `dist/` directory.
