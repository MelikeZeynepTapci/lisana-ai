# Session Engine
## Lisana — Voice Speaking Sessions · Implementation Reference

This document is the authoritative reference for how speaking sessions work in Lisana.
Read this before touching any code in the speaking pipeline, session routes, Maya prompts, or feedback generation.

---

## Core Rules — Non-Negotiable

- Sessions are ended by the **backend**. Never by the user. Never arbitrarily by Maya.
- Maya **never breaks character** during a session. No "As your AI tutor..." ever.
- Coaching is **invisible during the session**. It appears only in the feedback card.
- Every twist must be **resolvable** with level-appropriate language.
- Feedback is **generated from the actual transcript** — never templated.
- Hard caps are **server-enforced**. No exceptions.

---

## Session Definition

A session is a short, structured, goal-directed voice conversation between the user and Maya.

- One scenario
- One communication goal
- A fixed turn budget
- A clear beginning, middle, and ending

It is not a free chat. It is not a scripted roleplay. It sits deliberately between those two extremes.

---

## Session State Machine

```
IDLE → ENTRY → CORE → WRAP_UP_SIGNAL → WRAP_UP → ENDED → FEEDBACK
```

State is tracked **server-side only**. Maya never decides state transitions.
The backend fires events. Maya responds to them naturally in her next turn.

### State descriptions

| State | Description |
|---|---|
| `IDLE` | No active session |
| `ENTRY` | Scenario card shown, Maya opens in character |
| `CORE` | Main conversation, waypoints being traversed |
| `WRAP_UP_SIGNAL` | Backend has triggered soft close, injected into Maya's context |
| `WRAP_UP` | Maya is steering toward natural closure (max 2 turns) |
| `ENDED` | Voice has ended, session saved |
| `FEEDBACK` | Feedback card shown to user |

---

## Session Parameters

### Defaults by CEFR level

| Level | Expected turns | Soft cap | Hard cap | TTS speed | Max twists |
|---|---|---|---|---|---|
| A1 | 8 | 8 | 12 | 0.82× | 1 |
| A2 | 9 | 9 | 13 | 0.88× | 1 |
| B1 | 11 | 10 | 14 | 1.0× | 1 |
| B2 | 12 | 11 | 15 | 1.0× | 2 |
| C1 | 13 | 12 | 16 | 1.05× | 2 |

### Time caps (server-enforced, absolute)

| Cap | Value | Type |
|---|---|---|
| Soft voice time | 9 minutes | Triggers wrap-up signal |
| Hard voice time | 12 minutes | Forces immediate session end |
| User silence timeout | 45 seconds | Soft prompt → if no response in 15s more → end |

---

## Ending Triggers — Priority Order

When any of these fire, the backend transitions to `WRAP_UP_SIGNAL` state and injects the wrap-up instruction into Maya's next context.

| Priority | Trigger | Condition | Type |
|---|---|---|---|
| 1 | Scenario complete | All waypoints covered + goal achieved | Soft |
| 2 | Turn budget | User turn count ≥ soft cap | Soft |
| 3 | Evidence collected | ≥ 6 evaluatable utterances logged | Soft |
| 4 | Repetitive loop | Same error pattern 3× in 4 turns | Soft |
| 5 | Voice time cap | Total voice time ≥ 9 minutes | Soft |
| 6 | Hard voice cap | Total voice time ≥ 12 minutes | Hard → immediate |
| 7 | Hard turn cap | User turn count ≥ hard cap | Hard → immediate |
| 8 | User silence | No input for 60 seconds total | Soft prompt → end |

**Hard triggers skip WRAP_UP and go directly to ENDED.**
Soft triggers give Maya 2 turns to close naturally.

---

## Wrap-Up Signal Injection

When a soft trigger fires, inject this into Maya's system context on her next turn:

```
[SYSTEM: Wrap-up signal received. Close this scenario naturally within the next 2 turns.
Do not announce that the session is ending. Do not say "our time is up" or anything
that breaks the fourth wall. Guide the conversation to its natural conclusion —
complete the task, say goodbye, finish the exchange.]
```

Maya should steer toward the natural end of the scenario. Example for café:
- "Here's your total — that's €4.50. Card or cash?"
- "Perfect, enjoy your coffee! Have a great afternoon."
- [Voice ends. ENDED state. Feedback appears.]

---

## Waypoint System

Each scenario has 4–6 waypoints. A waypoint is a **conversational milestone**, not a script line.

Waypoints are tracked server-side. After each Maya turn, the backend classifies whether a waypoint has been reached using GPT intent classification on the last 2 turns.

### Waypoint object schema

```python
{
  "id": "cafe_order_v1_wp3",
  "name": "order_placed",
  "description": "User has placed a specific drink order",
  "detection_prompt": "Has the user placed a specific drink order? Answer yes or no.",
  "required_for_completion": True,
  "unlocks_twist": ["item_unavailable", "order_misheard"]
}
```

### Waypoint completion rule

A session is considered complete when:
- All `required_for_completion` waypoints are marked `True`
- OR soft/hard caps are reached (whichever comes first)

---

## Scenario Schema

```python
{
  "id": "cafe_order_v1",
  "title": "Ordering at a Café",
  "description": "Practice ordering a drink, handling a small issue, and paying.",
  "communication_goal": "Order a drink, handle one complication, and pay politely.",
  "domain": "café",
  "languages": ["de", "en", "es", "fr", "it"],
  "waypoints": [...],  # ordered list
  "difficulty_profiles": {
    "A1": { "maya_vocab": "simple", "complications": 0, "expected_turns": 8 },
    "A2": { "maya_vocab": "simple", "complications": 1, "expected_turns": 9 },
    "B1": { "maya_vocab": "natural", "complications": 1, "expected_turns": 11 },
    "B2": { "maya_vocab": "natural", "complications": 2, "expected_turns": 12 },
    "C1": { "maya_vocab": "idiomatic", "complications": 2, "expected_turns": 13 }
  },
  "possible_twists": ["item_unavailable", "order_misheard", "payment_issue"],
  "wrap_conditions": ["all_waypoints_complete", "soft_cap_reached"],
  "visual_aid": "cafe_menu_v1",  # or null
  "maya_persona": "Sofia, a friendly barista"
}
```

---

## Adaptive Difficulty

The scenario skeleton is identical at every level. These parameters change:

| Parameter | A1/A2 | B1/B2 | C1 |
|---|---|---|---|
| Maya vocabulary | Simple, high-frequency | Natural everyday | Idiomatic, colloquial |
| Sentence length | One idea per sentence | Normal compound | Complex with subordinates |
| TTS speed | 0.82–0.88× | 1.0× | 1.05× |
| Repetition | Maya recasts key words | Occasional clarification | No repetition |
| Complications | 0–1 simple | 1 mild | 2 + ambiguity |
| In-session correction | Gentle immediate recast | After-turn recast | Logged for feedback only |
| Turn count | 8–9 | 11–12 | 13 |

### Level detection

- Onboarding self-report → mapped to initial CEFR level
- After 3+ sessions: evaluation scores recalibrate level per language
- Per-session: after turn 3, backend evaluates fluency → can silently downgrade parameters
- Level is stored **per language** — user can be B1 German and A2 Italian simultaneously

---

## Twist System

Twists make sessions feel alive and replayable.

### Twist object schema

```python
{
  "id": "item_unavailable",
  "description": "The item the user ordered is not available today",
  "example": "Sorry, we're out of oat milk today — we have regular or soy.",
  "min_level": "A2",
  "fires_after_waypoint": "order_placed",
  "fires_before_waypoint": "payment",
  "resolution_expected": "User changes order or asks for alternative"
}
```

### Twist firing rules

```python
# Pseudo-logic for twist selection
def should_fire_twist(session):
    if session.turn_count < 2: return False          # too early
    if session.turns_remaining < 2: return False      # too late
    if session.twists_fired >= max_twists[level]: return False
    if session.turns_since_last_twist < 3: return False
    if session.recent_error_rate > 0.5: return False  # user struggling
    if not current_waypoint.unlocks_twist: return False
    return True
```

### Twist injection

When a twist should fire, inject into Maya's next context:

```
[SYSTEM: Introduce this complication naturally in your next response: item_unavailable.
Stay in character. Do not announce it as a complication. Example: "Oh, I'm sorry —
we're actually out of oat milk today. We have regular or soy, would either work?"]
```

---

## Maya's 3-Layer Behavior Model

Maya operates in 3 simultaneous layers. The user only sees Layer 1.

### Layer 1 — Roleplay (always visible)

- Maya plays her scenario persona (e.g. "Sofia the barista")
- She stays fully in character at all times
- She has personality: warm, patient, slightly playful
- She never says "As your AI tutor", "Let me correct that", or anything meta

### Layer 2 — Coaching (partially visible)

- When user makes a grammar error, Maya **recasts** it naturally in her reply
- Example: User says "I want coffee with milk" → Maya replies "Of course! One coffee with milk — would you like that hot or iced?" (modelling the more natural phrasing)
- Corrections are **logged silently** for the feedback card
- Maya never delivers verbal corrections during the session
- If user is below expected level, Maya simplifies — invisibly

### Layer 3 — Director (never visible)

- Maya's system prompt includes current waypoint state
- Backend injects hidden signals: `[WRAP_UP]`, `[TWIST: item_unavailable]`, `[WAYPOINT_COMPLETE: order_placed]`
- Maya responds to these naturally — never acknowledges them
- Maya steers toward waypoints without making it feel scripted

### System prompt structure (per turn)

```
[SCENARIO: cafe_order_v1]
[PERSONA: Sofia, friendly barista, Café Mozart, Vienna]
[LEVEL: B1]
[LANGUAGE: German]
[CURRENT_WAYPOINT: order_placed — completed]
[NEXT_WAYPOINT: payment — pending]
[TURN: 7 of 12]
[WRAP_UP_SIGNAL: false]
[TWIST_ACTIVE: none]

Keep responses under 35 words. End with a question or prompt when appropriate.
Stay in character. Do not correct the user directly.
```

---

## Session Feedback

### When it appears

Immediately after voice ends (ENDED state). Single scrollable card.

### Feedback generation

Feed the full session transcript to GPT with this prompt structure:

```
You are generating feedback for a language learning session.
Language: {language}
Level: {level}
Scenario: {scenario_title}
Goal: {communication_goal}

Here is the full transcript: {transcript}

Generate feedback in this exact JSON structure:
{
  "what_went_well": ["...", "..."],        // 2-3 specific observations
  "watch_out_for": [                        // 1-2 errors max
    { "said": "...", "better": "..." }
  ],
  "useful_phrases": ["...", "...", "..."], // 3-4 phrases from this session
  "one_tip": "...",                         // single actionable tip
  "next_session": "..."                     // recommended next scenario
}

Rules:
- Always start with something positive
- Errors framed as "next time try" not "you said wrong"
- No scores, no grades, no percentages
- Be specific — reference what they actually said
- Keep each item to 1-2 sentences max
```

### Feedback display order

1. What went well ✓
2. Watch out for (with correction shown side by side)
3. Useful phrases
4. One tip
5. Next session recommendation
6. [XP earned and streak update — shown below card, not mixed in]

---

## UX Rules

### Pre-session card shows:
- Scenario title
- One-line description
- Turn estimate: "~12 turns · ~10 minutes"
- Level badge: "Adapted for your B1 level"
- Optional small visual aid (e.g. illustrated menu)
- Single CTA: "Start Session"

### During session:
- Maya avatar with 3 states: listening / speaking / thinking
- Push-to-talk button (large)
- Turn counter: subtle, corner position — "7 / 12"
- No transcript during session (reading breaks speaking focus)
- Visual aid accessible via icon tap, not always shown
- **No "End Session" button**
- **No progress bar** (creates pressure)

### After session:
- Feedback card appears immediately
- XP and streak shown below card
- CTA: "Start another session" or "Back to dashboard"

---

## Cost Control

All cost constraints are server-enforced. The frontend has no role in enforcing these.

| Constraint | Value | Enforcement |
|---|---|---|
| Max user turns | 16 (hard cap) | Backend — absolute |
| Max voice time | 12 minutes | Backend — absolute |
| Max Maya output | 35 words per turn | System prompt instruction |
| Feedback generation | Once per session | On ENDED state only |
| Waypoint classification | Per Maya turn | Lightweight GPT call, cached |

---

## File Structure Reference

```
backend/
  app/
    services/
      session/
        session_manager.py      ← state machine, trigger logic
        waypoint_tracker.py     ← waypoint detection + classification
        twist_engine.py         ← twist selection + injection
        feedback_generator.py   ← transcript → feedback card
      maya/
        maya_service.py         ← conversation turns, system prompt builder
        prompt_templates.py     ← all system prompt components
    api/
      routes/
        speaking.py             ← session start, turn, end endpoints
    models/
      session.py                ← Session, Turn, Waypoint, Twist models
      scenario.py               ← Scenario schema

docs/
  session_engine.md             ← this file
  onboarding_flow.md
  gamification.md
  scenarios/
    cafe_order_v1.json
    job_interview_v1.json
    ...
```

---

## Quick Reference — What Never Changes

```
✗ User ends the session
✗ Maya breaks character
✗ Maya corrects the user verbally during the session
✗ Feedback is templated
✗ Twists fire in first 2 or last 2 turns
✗ Hard caps are bypassed for any reason
✗ Level is the same across languages
```

---

*Lisana · Session Engine v1.0 · April 2026*
