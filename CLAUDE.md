# Lisana — Claude Code Guide

## Project Overview

Lisana is an AI language learning app. The AI tutor is named **Maya**. Users learn German, Spanish, French, Italian, or English through daily conversations, pronunciation drills, vocabulary practice, and CEFR-adapted news with quizzes.

## Architecture

**Monorepo layout:**
```
lingua-tutor/
├── app/                  # FastAPI backend
│   ├── api/routes/       # Route handlers (auth, collection, conversation, news, onboarding, session, speaking, demo, user)
│   ├── core/             # Config, Sentry init
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   └── services/         # AI service (OpenAI), business logic
├── frontend/             # Next.js 14 App Router
│   └── src/app/
│       ├── (app)/        # Authenticated app routes (dashboard, conversation, speaking, collection, etc.)
│       ├── (auth)/       # Login, signup
│       ├── demo/         # Public demo + /demo/setup onboarding
│       ├── landing/      # Public landing page
│       ├── onboarding/   # Post-signup onboarding (7 steps)
│       ├── learn/[language]/  # SEO pages per language
│       └── for/          # SEO audience pages (expats, students)
├── migrations/           # Alembic DB migrations
└── main.py               # FastAPI app entry point
```

## Tech Stack

**Backend:**
- Python, FastAPI, SQLAlchemy (async), PostgreSQL (asyncpg)
- Alembic for migrations (planned removal when Supabase DB migration is complete)
- OpenAI (GPT-4o-mini) for AI responses and content generation
- ElevenLabs for TTS audio
- NewsAPI for daily news content
- Langfuse for LLM observability
- Sentry for error tracking
- Deployed on Railway

**Frontend:**
- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase for auth (`@supabase/ssr`, `@supabase/supabase-js`)
- Custom CSS variables design system (tokens: `primary`, `secondary`, `tertiary`, `on-surface`, `surface-low`, etc.)
- Fonts: Lexend (headings), Manrope (body)
- Icons: Material Symbols (`material-symbols-outlined ms-filled`)

## Key Concepts

**CEFR levels:** A1, A2, B1, B2, C1, C2 — used throughout for level tracking and content adaptation.

**User data flow:**
- Auth: Supabase (JWT). `user.user_metadata.onboarding_completed` controls onboarding redirect.
- Language profile: `UserLanguageProfile` — one row per language per user.
- Onboarding data: `UserProfile.onboarding_data` (JSONB) stores `language`, `level`, `focus`, `city`, `interests`, `about`, `daily_goal`.

**Session state machine:** `IDLE → ENTRY → CORE → WRAP_UP_SIGNAL → WRAP_UP → ENDED`

**Daily news:** Cached per `(language, level, city, for_date)`. City-aware: uses NewsAPI `/everything?q=city` when city is set, falls back to `/top-headlines`. City `""` means no location. News article text is wrapped in `<SelectableText>` so users can highlight words/phrases.

**Quiz questions:** Each question has `question`, `options[]`, `correct`, `reasoning[]` (one reasoning string per option).

**Save to Collection:** Users select text in the daily news (or conversation) to open a popover with: See meaning, Example sentence, Synonyms, Pronunciation (OpenAI TTS on-demand), and Save. Saved items go to `saved_items` table (per-user). Enrichment (definition/example/part_of_speech) runs as a FastAPI `BackgroundTask` after save, using a shared `vocab_cache` table keyed by `(text, language)`. Collection page: `/collection`.
- Backend: `app/api/routes/collection.py`, router prefix `/api/collection`
- Frontend component: `frontend/src/components/collection/SelectableText.tsx`
- Collection page: `frontend/src/app/(app)/collection/page.tsx`

**SelectableText popover pattern:** Uses `createPortal(element, document.body)` with a `position:fixed; inset:0; pointer-events:none` outer overlay and `position:absolute` inner div. Scroll tracking uses direct DOM manipulation (`element.style.left/top`) instead of React state to avoid re-render lag. The `e.detail === 0` guard on `mouseup` prevents scroll-generated synthetic events from repositioning the popover.

**WordFlipCard (`frontend/src/components/ui/WordFlipCard.tsx`):** CSS 3D flip card for Word of the Day. Front shows word + phonetic; back shows translation, example, and action buttons. Click-to-flip disabled when `knownState !== "idle"`.
- States: `"idle" | "input" | "checking" | "result"`
- "Know It" → shows sentence input field. User writes a sentence using the word.
- Submit → calls `POST /api/collection/check-sentence` → shows correction popover (portal, same scroll-tracking pattern as SelectableText).
- "Still Learning" → flips back to front.

**Sentence checker (`POST /api/collection/check-sentence`):** Two-pass LLM check.
- Pass 1: thorough per-mistake check (case, articles, conjugation, word order, tense, spelling, etc.). Returns `correct`, `corrected`, `feedback`, `mistakes: [{location, explanation}]`, `xp` (20 if correct, 10 if not).
- Pass 2 (only when pass 1 finds errors): holistic validator checks the corrected sentence for coherence errors pass 1 missed (e.g. subject–pronoun agreement, gender agreement across the whole sentence). Merges any additional mistakes and updates `corrected`.
- `temperature=0.2` (pass 1), `temperature=0.1` (pass 2), `response_format: json_object`.

## Middleware & Auth (frontend)

`frontend/src/middleware.ts` protects routes:
- Not logged in → `/landing` (except `/login`, `/signup`, `/landing`, `/demo/*`, `/learn/*`, `/for/*`)
- Logged in, onboarding not done → `/onboarding`
- Logged in, onboarding done, on `/onboarding` → `/`

SEO pages (`/learn/*`, `/for/*`) are public — no auth required.

## Onboarding Flow (7 steps)

1. Language selection
2. Level selection (CEFR)
3. Focus / goal (`local_life`, `relocate`, `work`, `travel`, `connect`, `culture`, `exam`)
4. Daily goal (minutes)
5. Interests (multi-select)
6. City quick-pick + free text, "About you" textarea
7. Welcome message (generated by Maya)

## SEO Pages

- `/learn/[language]` — static pages for german, spanish, french, italian, english
- `/for/expats` — expat audience page
- `/for/students` — student audience page

All CTA buttons: "Try Maya Free" / "Start Free" → `/demo/setup`. "Create Free Account" → `/signup`.

## Running Locally

**Backend:**
```bash
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend && npm run dev
```

## Environment Variables

Backend (`.env`):
- `DATABASE_URL` — PostgreSQL connection string
- `OPENAI_API_KEY`
- `SUPABASE_JWT_SECRET`, `SUPABASE_URL`
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`
- `NEWS_API_KEY`
- `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`
- `SENTRY_DSN`
- `FRONTEND_URL`

Frontend (`.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Pending / Known TODOs

- **DB migration needed:** Add `city` column to `daily_news` and update unique constraint:
  ```sql
  ALTER TABLE daily_news ADD COLUMN IF NOT EXISTS city VARCHAR NOT NULL DEFAULT '';
  ALTER TABLE daily_news DROP CONSTRAINT IF EXISTS uq_daily_news;
  ALTER TABLE daily_news ADD CONSTRAINT uq_daily_news UNIQUE (language, level, city, for_date);
  ```
- **Supabase migration:** Plan to move DB to Supabase and remove Alembic (see memory).
- **OG images:** `/public/og-default.png`, `/public/og-german.png`, etc. (1200×630) not yet created.
