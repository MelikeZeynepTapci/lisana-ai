# LinguaTutor

**AI-powered language learning platform for real conversational fluency.**

LinguaTutor helps expats, immigrants, and international students build genuine spoken fluency through natural AI conversation, live peer practice rooms, and intelligent progress tracking, available 24/7 at a fraction of the cost of a private tutor.

---

## What Makes LinguaTutor Different?

Most language apps teach vocabulary. LinguaTutor teaches you to **speak**.

| Feature                                             | LinguaTutor | Competitors |
|-----------------------------------------------------|-------------|-------------|
| AI coach with long-term memory                      | ✓           | ✗           |
| Live peer chat rooms                                | ✓           | ✗           |
| Pronunciation assessment                            | ✓           | ✗           |
| Personalised reports and study plans (PDF/PNG)      | ✓           | ✗           |
| Level-matched community                             | ✓           | ✗           |
---

## Core Features

### 🎤 Speaking — Maya AI Tutor
Practice real-life scenarios with Maya, your personal AI language coach. Maya remembers your past sessions, tracks your recurring mistakes, and adapts every conversation to your level, goals, and interests. Choose from 10 scenario categories: office conversations, job interviews, shopping, travel, restaurants, and more.

### 👥 LinguaRooms
10-minute live group chat sessions with 2–3 other learners matched by language level and shared interests. AI initiates the topic and fills any missing seats so the feature works from day one. At the end of each session, every participant receives individual performance feedback and XP.


### 📰 Daily Content
- **Daily Word** — one new word every morning with pronunciation, example sentences, and a quick quiz
- **Daily News** — a short article at your CEFR level, followed by a 3-question comprehension quiz

Both are generated once per day and shared across all users at the same level, not generated per user.


### 🗣 Pronunciation Exercises
Daily pronunciation drill using Azure Speech Assessment. Each day, all users at the same level practice the same curated sentences. Complete your daily set to maintain your streak and earn XP.


### 🎮 Gamification
- **XP** — earned from every activity, never expires
- **Streaks** — maintain your daily goal to keep your streak alive
- **Leaderboard** — weekly ranking against users learning the same language at the same level
- **Badges** — 30+ permanent badges across skill, streak, and community categories


### 📄 Personal Report Generation
Generate a personalised weekly or monthly PDF study plan and report of the user's weekly/monthly progress, built from your actual session history, mistake patterns, and vocabulary gaps. Available twice per month on Pro. Download and follow offline.


---

## Supported Languages

| Language | Speaking | Pronunciation | LinguaRooms |
|---|---|---|---|
| 🇩🇪 German | ✓ | ✓ | ✓ |
| 🇬🇧 English | ✓ | ✓ | ✓ |
| 🇪🇸 Spanish | ✓ | ✓ | ✓ |
| 🇫🇷 French | ✓ | ✓ | ✓ |
| 🇮🇹 Italian | ✓ | ✓ | ✓ |

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

### Backend
- **Framework:** FastAPI (Python 3.12)
- **ORM:** SQLAlchemy (async) + `create_tables.py` for schema management
- **Validation:** Pydantic v2
- **Deployment:** Railway

### Database & Auth
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth with ES256 JWT (JWKS-based verification in FastAPI middleware)
- **Storage:** Local filesystem (`audio_files/`) served as static files

### AI & Speech
- **LLM:** OpenAI GPT-4o (Maya tutor conversation)
- **LLM (lightweight):** OpenAI GPT-4o Mini (onboarding welcome message)
- **Speech-to-Text:** GPT-4o Mini Transcribe 
- **Text-to-Speech:** ElevenLabs API
- **Audio Processing:** ffmpeg (speed control for beginner pacing)

### Observability & Payments
- **LLM Observability:** Langfuse
- **Error Tracking:** Sentry
- **Payments:** Stripe

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│                    Next.js 14 — Vercel                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                      BACKEND (FastAPI)                          │
│                        Railway                                  │
│                                                                 │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐  │
│  │  Auth       │  │  API Routes                              │  │
│  │  Middleware │  │  /api/auth      (sync, check, lookup)    │  │
│  │  (Supabase  │  │  /api/user      (me)                     │  │
│  │   ES256 JWT │  │  /api/onboarding (welcome, complete)     │  │
│  │   + JWKS)   │  │  /api/sessions  (create, list)           │  │
│  └─────────────┘  │  /api/conversation (turn)                │  │
│                   └──────────────────────────────────────────┘  │
└────────┬──────────────┬─────────────────────────────────────────┘
         │              │
┌────────▼───┐  ┌───────▼───────────────────────────────────────┐
│ Supabase   │  │  OpenAI API                                   │
│ PostgreSQL │  │  - GPT-4o (conversation)                      │
│ Auth       │  │  - GPT-4o Mini (onboarding welcome)           │
└────────────┘  │  - GPT-4o Mini Transcribe (transcription)     │
                │  - ElevenLabs API (speech synthesis)          │
                └───────────────────────────────────────────────┘
                                  ┌──────────────────────────────┐
                                  │  Langfuse (LLM Observability)│
                                  │  Sentry (Error Tracking)     │
                                  └──────────────────────────────┘
```

---

## Database Schema

The database is organised around `user_language_profiles` as the central pivot, all learning data (sessions, vocabulary, streaks, XP) is scoped per language, not per user. One user can learn multiple languages independently.

### Core Tables

```
users                     — Supabase Auth mirror: email, username, full_name
user_profiles             — onboarding data (JSONB)
user_language_profiles    — per-language progress hub
                            (UniqueConstraint: user_id + language)
sessions                  — speaking session records
messages                  — individual turns within a session
evaluations               — AI-generated per-turn scores and feedback
```

### Content Tables

```
vocabulary_items          — spaced repetition (SM-2 algorithm)
listening_exercises       — generated audio with TTL; listening_attempts
grammar_exercises         — AI-generated grammar sets; grammar_attempts
daily_words               — cached daily word per language × date
daily_news                — cached daily article per language × level × date
```

### Gamification & Billing

```
streaks                   — per language profile, not per user
xp_events                 — immutable log of all XP earned
badges                    — earned badges with timestamp (UniqueConstraint: user_id + badge_key)
exam_sessions             — exam practice sessions with per-criterion feedback (JSONB)
subscriptions             — Stripe subscription state
```

---

## AI Model Routing

| Feature | Model | Reasoning |
|---|---|---|
| Maya conversation | GPT-4o | Quality for real-time dialogue |
| Onboarding welcome | GPT-4o Mini | Short generation, cost efficient |
| Transcription | GPT-4o Mini Transcribe  | OpenAI speech-to-text |
| Text-to-Speech | Elevenlabs API | Low latency voice synthesis |

---

## Onboarding Flow

7-step onboarding, approximately 50 seconds to complete.

```
Step 1: Language selection     (tap — auto advance)
Step 2: Current level          (tap — auto advance)
Step 3: Learning reason        (tap — auto advance)
Step 4: Daily goal             (tap — auto advance)
Step 5: Interests              (multi-select + continue button)
Step 6: Introduce yourself     (optional free text, skippable)
Step 7: Maya welcome           (GPT-generated personal message)
```

Onboarding data is saved to `user_profiles.onboarding_data` (JSONB) only when the user taps "Start talking to Maya" on step 7. Completion is tracked via `supabase.auth.updateUser({ onboarding_completed: true })` so that Next.js middleware can gate access without an extra API call.

---

## Pricing

| | Free | Pro |
|---|---|---|
| Price | €0 | €15/month |
| AI sessions/day | 3 | Unlimited |
| Maya long-term memory | ✗ | ✓ |
| LinguaRooms | 3×/week | Unlimited |
| Pronunciation exercise | ✓ | ✓ |
| Daily word + news | ✓ | ✓ |
| Printables | 1×/month | 2×/month |
| Streak freeze tokens | 0 | 3/month |
| Daily XP cap | 150 | None |
| Leaderboard | Daily refresh | Real-time |

**Test Drive:** New visitors can have one free conversation with Maya — no account, no credit card required.

---

## Project Structure

```
lingua-tutor/
├── frontend/                    # Next.js 14 application
│   └── src/
│       ├── app/
│       │   ├── (auth)/          # Login, signup
│       │   ├── onboarding/      # 7-step onboarding wizard
│       │   ├── conversation/    # Speaking session UI
│       │   ├── speaking/
│       │   ├── grammar/
│       │   ├── listening/
│       │   ├── vocabulary/
│       │   ├── progress/
│       │   └── page.tsx         # Dashboard
│       ├── components/
│       │   ├── layout/          # Sidebar, Header
│       │   └── ui/
│       └── lib/
│           ├── api.ts           # Backend fetch helpers
│           └── supabase.ts      # Supabase client
│
├── app/                         # FastAPI application
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py          # sync, check, lookup
│   │       ├── user.py          # /api/user/me
│   │       ├── onboarding.py    # welcome, complete
│   │       ├── session.py       # session CRUD
│   │       └── conversation.py  # conversation turns
│   ├── models/
│   │   └── models.py            # SQLAlchemy models
│   ├── schemas/                 # Pydantic schemas
│   ├── services/
│   │   ├── ai_service.py        # GPT-4o tutor + welcome message
│   │   ├── speech_service.py    # Whisper + TTS
│   │   └── langfuse_service.py  # LLM observability
│   └── core/
│       ├── auth.py              # ES256 JWKS JWT verification
│       ├── config.py
│       ├── database.py
│       └── sentry.py
│
├── main.py                      # FastAPI entry point
├── create_tables.py             # DB schema creation
├── requirements.txt
├── railway.toml
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- PostgreSQL (or Supabase account)
- OpenAI API key

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Fill in your environment variables
npm run dev
```

### Backend

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your environment variables
python create_tables.py
uvicorn main:app --reload
```

## About

Built by [Melike Zeynep Tapcı](https://linkedin.com/in/mztapci) — Prompt Engineer

---

*LinguaTutor is currently in active development.*
