import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def gen_uuid():
    return str(uuid.uuid4())


# ─────────────────────────────────────────────
# CORE
# ─────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, nullable=False, unique=True)
    username = Column(String, nullable=True, unique=True)
    full_name = Column(String, nullable=True)
    subscription_plan = Column(String, default="free")  # free | pro
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    language_profiles = relationship("UserLanguageProfile", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")
    badges = relationship("Badge", back_populates="user")
    exam_sessions = relationship("ExamSession", back_populates="user")


class UserProfile(Base):
    """
    Stores onboarding form data as JSONB.
    Example onboarding_data:
    {
        "age": 26,
        "native_language": "Turkish",
        "interests": ["technology", "travel"],
        "learning_goal": "daily_life",
        "exam_target": "TestDAF",
        "exam_date": "2026-09-01",
        "daily_practice_minutes": 20
    }
    """
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    onboarding_data = Column(JSONB, default={})
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class UserLanguageProfile(Base):
    """
    One row per language the user is learning.
    All language-specific data (sessions, vocab, streaks, XP) hangs off this.
    """
    __tablename__ = "user_language_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    language = Column(String, nullable=False)        # "German", "Spanish", "English"
    current_level = Column(String, default="A1")     # CEFR: A1 A2 B1 B2 C1 C2
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "language", name="uq_user_language"),
    )

    user = relationship("User", back_populates="language_profiles")
    sessions = relationship("Session", back_populates="language_profile")
    vocabulary_items = relationship("VocabularyItem", back_populates="language_profile")
    streak = relationship("Streak", back_populates="language_profile", uselist=False)
    xp_events = relationship("XPEvent", back_populates="language_profile")


class Session(Base):
    """
    One conversation session. Scoped to a language profile.
    state: IDLE | ENTRY | CORE | WRAP_UP_SIGNAL | WRAP_UP | ENDED
    """
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_profile_id = Column(UUID(as_uuid=True), ForeignKey("user_language_profiles.id", ondelete="CASCADE"), nullable=False)
    scenario = Column(String, nullable=False)         # human-readable title
    scenario_id = Column(String, nullable=True)       # JSON scenario file ID e.g. "cafe_order_v1"
    mode = Column(String, default="daily")            # daily | exam
    state = Column(String, default="IDLE")            # session state machine
    turn_count = Column(Integer, default=0)           # user turns completed
    started_at = Column(DateTime, nullable=True)      # when session voice started
    voice_seconds = Column(Float, default=0.0)        # accumulated voice time
    waypoints_state = Column(JSONB, default={})       # {waypoint_id: bool}
    twists_fired = Column(Integer, default=0)
    wrap_up_turns = Column(Integer, default=0)        # turns spent in WRAP_UP
    session_feedback = Column(JSONB, nullable=True)   # generated feedback card
    created_at = Column(DateTime, default=datetime.utcnow)

    language_profile = relationship("UserLanguageProfile", back_populates="sessions")
    messages = relationship("Message", back_populates="session")


class Message(Base):
    """
    Every turn in a conversation.
    role: "user" | "assistant"
    """
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)             # user | assistant
    transcript = Column(Text, nullable=False)
    audio_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="messages")
    evaluation = relationship("Evaluation", back_populates="message", uselist=False)


class Evaluation(Base):
    """
    AI scoring of a single user message turn.
    All scores 0.0 - 10.0.
    """
    __tablename__ = "evaluations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id", ondelete="CASCADE"), nullable=False, unique=True)
    fluency = Column(Float, nullable=True)
    grammar = Column(Float, nullable=True)
    vocabulary = Column(Float, nullable=True)
    pronunciation = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)           # AI generated tip
    created_at = Column(DateTime, default=datetime.utcnow)

    message = relationship("Message", back_populates="evaluation")


# ─────────────────────────────────────────────
# CONTENT
# ─────────────────────────────────────────────

class VocabularyItem(Base):
    """
    Words extracted from conversations + manually added.
    Uses SM-2 spaced repetition fields.
    """
    __tablename__ = "vocabulary_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_profile_id = Column(UUID(as_uuid=True), ForeignKey("user_language_profiles.id", ondelete="CASCADE"), nullable=False)
    word = Column(String, nullable=False)
    translation = Column(String, nullable=False)
    example = Column(Text, nullable=True)
    source_session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    ease_factor = Column(Float, default=2.5)          # SM-2 ease factor
    repetitions = Column(Integer, default=0)          # SM-2 repetition count
    next_review_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    language_profile = relationship("UserLanguageProfile", back_populates="vocabulary_items")


class ListeningExercise(Base):
    """
    AI-generated listening exercise.
    Audio stored temporarily — expires_at used for cleanup.
    questions/correct_answers stored as JSONB arrays.
    """
    __tablename__ = "listening_exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language = Column(String, nullable=False)
    level = Column(String, nullable=False)            # CEFR level
    audio_text = Column(Text, nullable=False)         # Source text used for TTS
    audio_url = Column(String, nullable=True)         # Temporary URL
    questions = Column(JSONB, default=[])             # [{"question": "...", "options": [...]}]
    correct_answers = Column(JSONB, default=[])       # ["B", "A", "C"]
    expires_at = Column(DateTime, nullable=True)      # TTL for audio cleanup
    created_at = Column(DateTime, default=datetime.utcnow)

    attempts = relationship("ListeningAttempt", back_populates="exercise")


class ListeningAttempt(Base):
    __tablename__ = "listening_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("listening_exercises.id", ondelete="CASCADE"), nullable=False)
    answers = Column(JSONB, default=[])               # User's answers
    score = Column(Float, nullable=True)              # 0.0 - 10.0
    created_at = Column(DateTime, default=datetime.utcnow)

    exercise = relationship("ListeningExercise", back_populates="attempts")


class GrammarExercise(Base):
    """
    AI-generated grammar exercise.
    correct_answers stored as JSONB to support multiple blanks.
    """
    __tablename__ = "grammar_exercises"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language = Column(String, nullable=False)
    level = Column(String, nullable=False)
    topic_tag = Column(String, nullable=True)         # "dativ", "verb_tenses", "articles"
    question = Column(Text, nullable=False)
    correct_answers = Column(JSONB, default=[])
    explanation = Column(Text, nullable=True)         # AI explanation of the rule
    created_at = Column(DateTime, default=datetime.utcnow)

    attempts = relationship("GrammarAttempt", back_populates="exercise")


class GrammarAttempt(Base):
    __tablename__ = "grammar_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exercise_id = Column(UUID(as_uuid=True), ForeignKey("grammar_exercises.id", ondelete="CASCADE"), nullable=False)
    answers = Column(JSONB, default=[])
    score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    exercise = relationship("GrammarExercise", back_populates="attempts")


class DailyWord(Base):
    """
    One word per language per day shown on dashboard.
    """
    __tablename__ = "daily_words"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language = Column(String, nullable=False)
    word = Column(String, nullable=False)
    translation = Column(String, nullable=False)
    example = Column(Text, nullable=True)
    pronunciation_url = Column(String, nullable=True)
    for_date = Column(Date, nullable=False)

    __table_args__ = (
        UniqueConstraint("language", "for_date", name="uq_daily_word_language_date"),
    )


class DailyNews(Base):
    """
    AI-generated news article per language per level per city per day.
    city="" means no location context (global news).
    quiz_questions stored as JSONB array of 3 questions.
    """
    __tablename__ = "daily_news"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language = Column(String, nullable=False)
    level = Column(String, nullable=False)
    city = Column(String, nullable=False, server_default="")
    content = Column(Text, nullable=False)
    quiz_questions = Column(JSONB, default=[])
    for_date = Column(Date, nullable=False)

    __table_args__ = (
        UniqueConstraint("language", "level", "city", "for_date", name="uq_daily_news"),
    )


# ─────────────────────────────────────────────
# GAMIFICATION
# ─────────────────────────────────────────────

class Streak(Base):
    """
    Per language profile streak.
    One row per language the user is learning.
    """
    __tablename__ = "streaks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_profile_id = Column(UUID(as_uuid=True), ForeignKey("user_language_profiles.id", ondelete="CASCADE"), nullable=False, unique=True)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_active_date = Column(Date, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    language_profile = relationship("UserLanguageProfile", back_populates="streak")


class XPEvent(Base):
    """
    Every XP-earning action logged per language profile.
    source: "conversation" | "quiz" | "vocabulary" | "listening" | "grammar" | "daily_word"
    """
    __tablename__ = "xp_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    language_profile_id = Column(UUID(as_uuid=True), ForeignKey("user_language_profiles.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Integer, nullable=False)
    source = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    language_profile = relationship("UserLanguageProfile", back_populates="xp_events")


class Badge(Base):
    """
    Earned badges per user.
    badge_key examples: "first_conversation", "streak_7", "streak_30", "b1_speaking"
    """
    __tablename__ = "badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_key = Column(String, nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "badge_key", name="uq_user_badge"),
    )

    user = relationship("User", back_populates="badges")


# ─────────────────────────────────────────────
# EXAM MODE
# ─────────────────────────────────────────────

class ExamSession(Base):
    """
    One exam practice session.
    exam_type: "IELTS" | "TOEFL" | "TestDAF" | "Goethe"
    section: "speaking" | "writing" | "reading" | "listening"
    feedback stored as JSONB with per-criterion scores.
    """
    __tablename__ = "exam_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    exam_type = Column(String, nullable=False)
    section = Column(String, nullable=False)
    score = Column(Float, nullable=True)              # Band score / raw score
    feedback = Column(JSONB, default={})
    # IELTS example:
    # {
    #   "fluency": 7.0,
    #   "coherence": 6.5,
    #   "lexical_resource": 7.0,
    #   "grammatical_range": 6.0,
    #   "overall_band": 6.5,
    #   "model_answer": "...",
    #   "tips": ["..."]
    # }
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="exam_sessions")


# ─────────────────────────────────────────────
# COLLECTION
# ─────────────────────────────────────────────

class VocabCache(Base):
    """
    Global enrichment cache keyed by (text, language).
    Populated by background enrichment; shared across all users.
    """
    __tablename__ = "vocab_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(Text, nullable=False)
    language = Column(String, nullable=False)
    definition = Column(Text, nullable=False)
    example = Column(Text, nullable=True)
    part_of_speech = Column(String, nullable=True)
    synonyms = Column(JSONB, default=[])
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("text", "language", name="uq_vocab_cache_text_language"),
    )


class SavedItem(Base):
    """
    User-saved text selections from news articles or conversation turns.
    source_type: 'news' | 'conversation'
    source_id: opaque reference (news id or session id) — no FK constraint.
    enrichment_status: 'pending' | 'done' | 'failed'
    """
    __tablename__ = "saved_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source_type = Column(String, nullable=False)
    source_id = Column(Text, nullable=True)
    text = Column(Text, nullable=False)
    language = Column(String, nullable=False)
    enrichment_status = Column(String, nullable=False, default="pending")
    definition = Column(Text, nullable=True)
    example = Column(Text, nullable=True)
    part_of_speech = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────
# VOCABULARY
# ─────────────────────────────────────────────

class VocabWord(Base):
    """
    Global vocabulary list seeded from Goethe/DTZ word lists.
    level: A1/A2/B1/B2/C1 — nullable if unknown.
    translation: filled on first use via vocab_cache.
    """
    __tablename__ = "vocab_words"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    word = Column(Text, nullable=False)
    part_of_speech = Column(String, nullable=True)
    language = Column(String, nullable=False)
    level = Column(String, nullable=True)
    translation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    progress = relationship("UserWordProgress", back_populates="vocab_word")


class UserWordProgress(Base):
    """
    Per-user vocabulary progress.
    status: 'seen' | 'learning' | 'known'
    """
    __tablename__ = "user_word_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    word_id = Column(UUID(as_uuid=True), ForeignKey("vocab_words.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False, default="seen")
    seen_at = Column(DateTime, default=datetime.utcnow)
    known_at = Column(DateTime, nullable=True)

    vocab_word = relationship("VocabWord", back_populates="progress")

    __table_args__ = (
        UniqueConstraint("user_id", "word_id", name="uq_user_word_progress"),
    )


# ─────────────────────────────────────────────
# BILLING
# ─────────────────────────────────────────────

class Subscription(Base):
    """
    Stripe subscription per user.
    plan: "free" | "pro"
    status: "active" | "canceled" | "past_due" | "trialing"
    """
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan = Column(String, default="free")
    stripe_customer_id = Column(String, nullable=True, unique=True)
    stripe_subscription_id = Column(String, nullable=True, unique=True)
    status = Column(String, default="active")
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")
