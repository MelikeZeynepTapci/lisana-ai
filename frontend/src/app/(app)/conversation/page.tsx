"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startSpeakingSession, sendSpeakingTurn, endSpeakingSession } from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type PageState = "pre_session" | "entry" | "core" | "ended";
type MicState = "idle" | "recording" | "processing" | "playing";

interface SessionInfo {
  sessionId: string;
  scenarioTitle: string;
  level: string;
  softCap: number;
  turnEstimate: number;
  personaName: string;
}

interface WatchOutItem {
  topic: string;
  said: string;
  better: string;
  note: string;
  examples?: { correct: boolean; text: string }[];
}

interface QuizOption {
  id: number;
  text: string;
  correct: boolean;
}

interface Feedback {
  what_went_well: string[];
  watch_out_for: WatchOutItem[];
  useful_phrases: string[];
  one_tip: string;
  next_session: string;
  alternatives?: { instead: string; try: string[] }[];
  quiz?: {
    topic: string;
    question: string;
    options: QuizOption[];
    explanation: string;
  };
}

interface TranscriptTurn {
  role: "user" | "assistant";
  text: string;
}

const SAMPLE_RATE = 24000;

// ─── Mock data for preview ────────────────────────────────────────────────────

const MOCK_FEEDBACK: Feedback = {
  what_went_well: [
    "You expressed your interests clearly — mentioning specific places like 'natürlichen Wegen in Wien' made the conversation feel real.",
    "You used 'Entschuldigung' naturally when you needed to clarify, which is great conversational instinct.",
  ],
  watch_out_for: [
    {
      topic: "Perfekt Tense",
      said: "Ich viele gegessen heute.",
      better: "Ich habe heute viel gegessen.",
      note: "Perfekt needs a helper verb — haben or sein — in position 2. The past participle goes to the end.",
      examples: [
        { correct: true,  text: "Ich habe Kaffee getrunken." },
        { correct: true,  text: "Sie sind nach Hause gegangen." },
        { correct: false, text: "Ich Kaffee getrunken heute." },
      ],
    },
    {
      topic: "Word Order",
      said: "Ich spiele Videospiele gerne und ich spazieren gegangen.",
      better: "Ich spiele gerne Videospiele und gehe spazieren.",
      note: "In German, the verb stays in position 2. With 'und', the second verb moves to the end of its clause.",
      examples: [
        { correct: true,  text: "Ich gehe gerne spazieren." },
        { correct: false, text: "Ich gerne gehe spazieren." },
      ],
    },
  ],
  alternatives: [
    { instead: "Das ist gut.", try: ["Das klingt super!", "Das freut mich!", "Wunderbar!"] },
    { instead: "Ich verstehe nicht.", try: ["Wie bitte?", "Könnten Sie das wiederholen?"] },
  ],
  quiz: {
    topic: "Perfekt Tense",
    question: "Which sentence is correct?",
    options: [
      { id: 1, text: "Ich gegessen viel heute.",        correct: false },
      { id: 2, text: "Ich habe heute viel gegessen.",   correct: true  },
      { id: 3, text: "Ich viel habe gegessen heute.",   correct: false },
    ],
    explanation: "Correct! Haben goes to position 2, past participle to the end — that's the Perfekt pattern.",
  },
  useful_phrases: [
    "Ich interessiere mich für Sprachen.",
    "Ich gehe gerne in Wien spazieren.",
    "Das klingt interessant!",
  ],
  one_tip: "Next time, pause briefly before answering to give yourself time to form the full sentence — especially with Perfekt tense.",
  next_session: "Practice the Perfekt tense — try a scenario where you describe what you did yesterday or last weekend.",
};

const MOCK_TRANSCRIPT: TranscriptTurn[] = [
  { role: "assistant", text: "Hallo! Schön dich kennenzulernen. Was machst du gerne in deiner Freizeit?" },
  { role: "user",      text: "Ich spiele Videospiele gerne und ich spazieren gegangen, gehe mit meinen Freunden." },
  { role: "assistant", text: "Oh interessant! Spielst du lieber online oder mit Freunden zusammen?" },
  { role: "user",      text: "Ich viele gegessen heute nach dem Spielen." },
  { role: "assistant", text: "Oh, was hast du gegessen? Kochst du gerne?" },
  { role: "user",      text: "Ja, ich koche manchmal. Ich mag italienisches Essen sehr." },
  { role: "assistant", text: "Das klingt lecker! Hast du ein Lieblingsrezept?" },
];

// ─── Maya Avatar ─────────────────────────────────────────────────────────────

function MayaAvatar({ micState }: { micState: MicState }) {
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      {micState === "playing" && (
        <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
      )}
      {micState === "recording" && (
        <span className="absolute inset-0 rounded-full border-2 border-error/40 animate-ping" />
      )}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300 ${
        micState === "playing" ? "bg-primary/15" :
        micState === "recording" ? "bg-error/10" :
        micState === "processing" ? "bg-surface-highest" :
        "bg-primary-container/40"
      }`}>
        <span className={`material-symbols-outlined ms-filled text-[40px] transition-colors duration-300 ${
          micState === "playing" ? "text-primary" :
          micState === "recording" ? "text-error" :
          micState === "processing" ? "text-on-surface-variant" :
          "text-primary"
        }`}>
          {micState === "processing" ? "hourglass_top" : "smart_toy"}
        </span>
      </div>
    </div>
  );
}

// ─── Error category helpers ───────────────────────────────────────────────────

type ErrorCategory = "grammar" | "vocabulary" | "word-order" | "fluency";

const categoryConfig: Record<ErrorCategory, { bg: string; text: string }> = {
  grammar:      { bg: "bg-red-50",    text: "text-red-700" },
  vocabulary:   { bg: "bg-blue-50",   text: "text-blue-700" },
  "word-order": { bg: "bg-amber-50",  text: "text-amber-700" },
  fluency:      { bg: "bg-purple-50", text: "text-purple-700" },
};

function detectCategory(topic: string): ErrorCategory {
  const t = topic.toLowerCase();
  if (t.includes("order") || t.includes("structure") || t.includes("position")) return "word-order";
  if (t.includes("vocab") || t.includes("word choice") || t.includes("expression") || t.includes("phrase")) return "vocabulary";
  if (t.includes("fluency") || t.includes("filler") || t.includes("pause") || t.includes("hesitation")) return "fluency";
  return "grammar";
}

// ─── ErrorCard ────────────────────────────────────────────────────────────────

function ErrorCard({ item, defaultOpen }: { item: WatchOutItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [saved, setSaved] = useState(false);
  const cfg = categoryConfig[detectCategory(item.topic)];

  return (
    <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface-lowest">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-highest/30 transition-colors text-left"
      >
        <span className={`font-manrope text-xs font-semibold px-2.5 py-1 rounded-md ${cfg.bg} ${cfg.text}`}>
          {item.topic}
        </span>
        <span className="ml-auto text-on-surface-variant/50">
          <span className="material-symbols-outlined text-[18px]">{open ? "expand_less" : "expand_more"}</span>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-outline-variant/10 pt-3 space-y-3">
          {/* You said / correction */}
          <div className="space-y-1.5">
            <p className="font-manrope text-xs text-on-surface-variant font-medium">You said</p>
            <p className="font-manrope text-sm text-on-surface-variant line-through leading-relaxed">&ldquo;{item.said}&rdquo;</p>
            <div className="flex items-start gap-2">
              <span className="text-on-surface-variant text-xs mt-0.5">→</span>
              <p className="font-manrope text-sm font-semibold text-on-surface leading-relaxed">&ldquo;{item.better}&rdquo;</p>
            </div>
          </div>

          {/* Rule */}
          {item.note && (
            <div className="bg-surface-highest/40 rounded-lg px-3 py-2.5">
              <p className="font-manrope text-xs text-on-surface-variant leading-relaxed">{item.note}</p>
            </div>
          )}

          {/* Examples */}
          {item.examples && item.examples.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-manrope text-xs font-medium text-on-surface-variant uppercase tracking-wide">More examples</p>
              {item.examples.map((ex, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className={`text-xs mt-0.5 font-bold flex-shrink-0 ${ex.correct ? "text-emerald-500" : "text-red-400"}`}>
                    {ex.correct ? "✓" : "✗"}
                  </span>
                  <p className="font-manrope text-sm text-on-surface-variant">{ex.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setSaved(!saved)}
              className={`font-manrope text-xs px-3 py-1.5 border rounded-lg transition-colors flex items-center gap-1.5 ${
                saved
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-highest/40 hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">{saved ? "bookmark" : "bookmark_border"}</span>
              {saved ? "Saved" : "Save to notes"}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="font-manrope text-xs px-3 py-1.5 border border-outline-variant/30 rounded-lg text-on-surface-variant hover:bg-surface-highest/40 hover:text-on-surface transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              Practice this
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── QuizSection ──────────────────────────────────────────────────────────────

function QuizSection({ quiz }: { quiz: NonNullable<Feedback["quiz"]> }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  return (
    <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface-lowest">
      <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center gap-2">
        <span className="material-symbols-outlined ms-filled text-[16px] text-secondary">quiz</span>
        <p className="font-manrope text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
          Quick check — {quiz.topic}
        </p>
      </div>
      <div className="p-4 space-y-3">
        <p className="font-manrope text-sm font-medium text-on-surface">{quiz.question}</p>
        <div className="space-y-2">
          {quiz.options.map((opt) => {
            const isSelected = selected === opt.id;
            const showResult = answered && isSelected;
            return (
              <button
                key={opt.id}
                disabled={answered}
                onClick={() => setSelected(opt.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left text-sm transition-all font-manrope ${
                  !answered
                    ? "border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-highest/30 text-on-surface"
                    : showResult && opt.correct
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : showResult && !opt.correct
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-outline-variant/10 text-on-surface-variant"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all ${
                  showResult && opt.correct ? "bg-emerald-500 border-emerald-500" :
                  showResult && !opt.correct ? "bg-red-400 border-red-400" :
                  "border-outline-variant/40"
                }`} />
                {opt.text}
              </button>
            );
          })}
        </div>
        {answered && (
          <div className={`font-manrope text-xs px-3 py-2.5 rounded-lg leading-relaxed ${
            quiz.options.find(o => o.id === selected)?.correct
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}>
            {quiz.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TranscriptSection ────────────────────────────────────────────────────────

function TranscriptSection({
  transcript,
  errors,
}: {
  transcript: TranscriptTurn[];
  errors: WatchOutItem[];
}) {
  const [open, setOpen] = useState(false);
  const [activeError, setActiveError] = useState<string | null>(null);

  function findErrorForTurn(turn: TranscriptTurn): WatchOutItem | null {
    if (turn.role !== "user") return null;
    return errors.find(e => turn.text.toLowerCase().includes(e.said.toLowerCase().slice(0, 10))) ?? null;
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between font-manrope text-sm text-on-surface-variant bg-surface-highest/30 border border-outline-variant/20 rounded-xl px-4 py-2.5 hover:bg-surface-highest/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">description</span>
          {open ? "Hide conversation" : "Show full conversation"}
        </span>
        <span className="material-symbols-outlined text-[16px]">{open ? "expand_less" : "expand_more"}</span>
      </button>

      {open && (
        <div className="mt-2 bg-surface-lowest border border-outline-variant/20 rounded-xl p-4 space-y-4">
          {transcript.map((turn, i) => {
            const err = findErrorForTurn(turn);
            const isActive = err && activeError === `${i}`;
            return (
              <div key={i}>
                <p className="font-manrope text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">
                  {turn.role === "assistant" ? "Maya" : "You"}
                </p>
                <p className="font-manrope text-sm text-on-surface leading-relaxed">
                  {err ? (
                    <span
                      className="border-b-2 border-dashed border-red-300 cursor-pointer hover:bg-red-50 rounded px-0.5 transition-colors"
                      onClick={() => setActiveError(isActive ? null : `${i}`)}
                    >
                      {turn.text}
                    </span>
                  ) : (
                    turn.text
                  )}
                </p>
                {err && !isActive && (
                  <p className="font-manrope text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-amber-500">arrow_upward</span>
                    {err.topic} — tap to see correction
                  </p>
                )}
                {err && isActive && (
                  <div className="mt-2 font-manrope text-xs bg-red-50 text-red-700 rounded-lg px-3 py-2 leading-relaxed">
                    <span className="line-through">&ldquo;{err.said}&rdquo;</span>
                    <span className="mx-1.5">→</span>
                    <span className="font-semibold">&ldquo;{err.better}&rdquo;</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Feedback Card ────────────────────────────────────────────────────────────

function FeedbackCard({
  feedback,
  turnCount,
  softCap,
  transcript,
  onNext,
}: {
  feedback: Feedback;
  turnCount: number;
  softCap: number;
  transcript: TranscriptTurn[];
  onNext: () => void;
}) {
  const [showAll, setShowAll] = useState(false);

  const errors = feedback.watch_out_for ?? [];
  const visibleErrors = showAll ? errors : errors.slice(0, 2);
  const hiddenCount = errors.length - 2;
  const xpEarned = Math.max(10, turnCount * 4);

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6 overflow-y-auto" style={{ height: "100vh" }}>

      {/* Header */}
      <div>
        <h1 className="font-lexend font-semibold text-2xl text-on-surface">Session complete</h1>
        <p className="font-manrope text-sm text-on-surface-variant mt-0.5">Here&apos;s how it went</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-highest/40 rounded-xl p-3">
          <p className="font-manrope text-xs text-on-surface-variant mb-1 font-medium tracking-wide uppercase">Turns</p>
          <p className="font-lexend text-xl font-semibold text-emerald-600">
            {turnCount}<span className="text-sm font-normal text-on-surface-variant">/{softCap}</span>
          </p>
        </div>
        <div className="bg-surface-highest/40 rounded-xl p-3">
          <p className="font-manrope text-xs text-on-surface-variant mb-1 font-medium tracking-wide uppercase">Errors</p>
          <p className={`font-lexend text-xl font-semibold ${errors.length > 2 ? "text-amber-600" : "text-on-surface"}`}>
            {errors.length}
          </p>
        </div>
        <div className="bg-surface-highest/40 rounded-xl p-3">
          <p className="font-manrope text-xs text-on-surface-variant mb-1 font-medium tracking-wide uppercase">Phrases</p>
          <p className="font-lexend text-xl font-semibold text-on-surface">{feedback.useful_phrases?.length ?? 0}</p>
        </div>
      </div>

      {/* What went well */}
      <div>
        <p className="font-manrope text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-3">What went well</p>
        <div className="bg-surface-lowest border border-outline-variant/20 rounded-xl p-4 border-l-4 border-l-emerald-400 space-y-2.5">
          {feedback.what_went_well.map((item, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <p className="font-manrope text-sm text-on-surface leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Watch out for */}
      {errors.length > 0 && (
        <div>
          <p className="font-manrope text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-3">Watch out for</p>
          <div className="space-y-2">
            {visibleErrors.map((item, i) => (
              <ErrorCard key={i} item={item} defaultOpen={i === 0} />
            ))}
            {hiddenCount > 0 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full font-manrope text-sm text-on-surface-variant bg-surface-highest/30 border border-outline-variant/20 rounded-xl py-2.5 hover:bg-surface-highest/50 transition-colors flex items-center justify-center gap-1"
              >
                +{hiddenCount} more
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
            )}
            {showAll && hiddenCount > 0 && (
              <button
                onClick={() => setShowAll(false)}
                className="w-full font-manrope text-sm text-on-surface-variant bg-surface-highest/30 border border-outline-variant/20 rounded-xl py-2.5 hover:bg-surface-highest/50 transition-colors"
              >
                Show less
              </button>
            )}
          </div>
        </div>
      )}

      {/* You could have said */}
      {(feedback.alternatives?.length ?? 0) > 0 && (
        <div>
          <p className="font-manrope text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-3">You could have said</p>
          <div className="bg-surface-lowest border border-outline-variant/20 rounded-xl p-4 space-y-4">
            {feedback.alternatives!.map((alt, i) => (
              <div key={i} className={i > 0 ? "pt-4 border-t border-outline-variant/10" : ""}>
                <p className="font-manrope text-xs text-on-surface-variant mb-2">
                  Instead of <span className="font-medium text-on-surface">&ldquo;{alt.instead}&rdquo;</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {alt.try.map((t, j) => (
                    <span key={j} className="font-manrope text-sm text-on-surface bg-surface-highest/40 border border-outline-variant/20 px-2.5 py-1 rounded-lg">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Useful phrases */}
      {(feedback.useful_phrases?.length ?? 0) > 0 && (
        <div>
          <p className="font-manrope text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-3">Phrases from this session</p>
          <div className="space-y-2">
            {feedback.useful_phrases.map((phrase, i) => (
              <div key={i} className="border border-outline-variant/20 rounded-xl px-4 py-3 bg-surface-lowest">
                <p className="font-manrope text-sm text-on-surface italic">&ldquo;{phrase}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar mini-quiz */}
      {feedback.quiz && (
        <div>
          <p className="font-manrope text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-3">Quick check</p>
          <QuizSection quiz={feedback.quiz} />
        </div>
      )}

      {/* One tip */}
      {feedback.one_tip && (
        <div>
          <p className="font-manrope text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-3">One tip for next time</p>
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex gap-3">
            <span className="material-symbols-outlined ms-filled text-[20px] text-primary flex-shrink-0 mt-0.5">tips_and_updates</span>
            <p className="font-manrope text-sm text-on-surface leading-relaxed">{feedback.one_tip}</p>
          </div>
        </div>
      )}

      {/* Next session */}
      {feedback.next_session && (
        <div>
          <p className="font-manrope text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-3">What to practice next</p>
          <div className="bg-surface-lowest border border-outline-variant/20 rounded-xl p-4 flex gap-3">
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant flex-shrink-0 mt-0.5">arrow_forward</span>
            <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{feedback.next_session}</p>
          </div>
        </div>
      )}

      {/* Session transcript */}
      {transcript.length > 0 && (
        <div>
          <p className="font-manrope text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-3">Session transcript</p>
          <TranscriptSection transcript={transcript} errors={errors} />
        </div>
      )}

      {/* What to do next */}
      <div>
        <p className="font-manrope text-xs font-semibold text-on-surface-variant tracking-widest uppercase mb-3">What to do next</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => window.location.reload()}
            className="text-left bg-surface-lowest border border-outline-variant/20 rounded-xl p-3.5 hover:border-outline-variant/40 hover:bg-surface-highest/30 transition-all"
          >
            <p className="font-manrope text-xs text-on-surface-variant mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">replay</span> Replay
            </p>
            <p className="font-lexend font-semibold text-sm text-on-surface mb-1">Same scenario</p>
            <p className="font-manrope text-xs text-on-surface-variant leading-relaxed">Practice what you learned today</p>
          </button>
          <button
            onClick={onNext}
            className="text-left bg-surface-lowest border border-outline-variant/20 rounded-xl p-3.5 hover:border-outline-variant/40 hover:bg-surface-highest/30 transition-all"
          >
            <p className="font-manrope text-xs text-on-surface-variant mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">arrow_forward</span> Next
            </p>
            <p className="font-lexend font-semibold text-sm text-on-surface mb-1">Try another scenario</p>
            <p className="font-manrope text-xs text-on-surface-variant leading-relaxed">Explore new conversations</p>
          </button>
        </div>
      </div>

      {/* XP + streak — gamification footer */}
      <div className="bg-surface-highest/40 border border-outline-variant/20 rounded-xl p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="font-lexend text-2xl font-semibold text-on-surface">+{xpEarned}</span>
            <span className="font-manrope text-sm text-on-surface-variant">XP earned</span>
          </div>
          <div className="h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${Math.min((xpEarned / 200) * 100, 100)}%` }}
            />
          </div>
          <p className="font-manrope text-xs text-on-surface-variant mt-1">Keep going to level up</p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
          <span className="text-base">🔥</span>
          <span className="font-lexend text-sm font-semibold text-amber-700">1</span>
          <span className="font-manrope text-xs text-amber-500">day streak</span>
        </div>
      </div>

      <div className="pb-8" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenario_id") || "daily_conversation_v1";
  const scenarioTitle = searchParams.get("scenario") || "Daily Conversation";
  const language = searchParams.get("language") || "German";

  const preview = searchParams.get("preview") === "1";

  const [pageState, setPageState] = useState<PageState>("pre_session");
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [micState, setMicState] = useState<MicState>("idle");
  const [turnCount, setTurnCount] = useState(0);
  const [softCap, setSoftCap] = useState(10);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mayaText, setMayaText] = useState("");
  const [sessionTranscript, setSessionTranscript] = useState<TranscriptTurn[]>([]);

  const micStateRef = useRef<MicState>("idle");
  const sessionIdRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const spaceDownRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Transcript accumulation
  const transcriptRef = useRef<TranscriptTurn[]>([]);

  // Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // Typewriter
  const typeQueueRef = useRef<Array<{ char: string }>>([]);
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentMayaTextRef = useRef("");

  const setMicStateSync = (s: MicState) => {
    micStateRef.current = s;
    setMicState(s);
  };

  // ─── Audio ────────────────────────────────────────────────────────────────

  const getAudioCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      nextPlayTimeRef.current = 0;
    }
    return audioCtxRef.current;
  }, []);

  const schedulePCMChunk = useCallback(
    (base64pcm: string, rate: number) => {
      const ctx = getAudioCtx();
      if (ctx.sampleRate !== rate) return;
      const raw = atob(base64pcm);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
      const buffer = ctx.createBuffer(1, float32.length, rate);
      buffer.copyToChannel(float32, 0);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + buffer.duration;
      scheduledSourcesRef.current.push(source);
      source.onended = () => {
        scheduledSourcesRef.current = scheduledSourcesRef.current.filter((s) => s !== source);
      };
    },
    [getAudioCtx]
  );

  const stopAllAudio = useCallback(() => {
    scheduledSourcesRef.current.forEach((s) => { try { s.stop(0); } catch {} });
    scheduledSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    abortRef.current?.abort();
    if (typeIntervalRef.current) { clearInterval(typeIntervalRef.current); typeIntervalRef.current = null; }
    typeQueueRef.current = [];
  }, []);

  // ─── Typewriter ──────────────────────────────────────────────────────────

  function startTypeInterval() {
    if (typeIntervalRef.current) return;
    typeIntervalRef.current = setInterval(() => {
      const item = typeQueueRef.current.shift();
      if (!item) { clearInterval(typeIntervalRef.current!); typeIntervalRef.current = null; return; }
      currentMayaTextRef.current += item.char;
      setMayaText(currentMayaTextRef.current);
    }, 18);
  }

  function enqueueText(text: string) {
    for (const char of text) typeQueueRef.current.push({ char });
    startTypeInterval();
  }

  function resetMayaText() {
    currentMayaTextRef.current = "";
    typeQueueRef.current = [];
    if (typeIntervalRef.current) { clearInterval(typeIntervalRef.current); typeIntervalRef.current = null; }
    setMayaText("");
  }

  // ─── Session start ────────────────────────────────────────────────────────

  async function handleStartSession() {
    setPageState("entry");
    setMicStateSync("processing");
    resetMayaText();
    setError(null);
    transcriptRef.current = [];

    const abort = new AbortController();
    abortRef.current = abort;

    let openingText = "";

    try {
      for await (const event of startSpeakingSession(scenarioId, language, abort.signal)) {
        if (abort.signal.aborted) break;
        switch (event.type) {
          case "session_created": {
            const d = event.data;
            setSessionInfo({
              sessionId: d.session_id as string,
              scenarioTitle: d.scenario_title as string,
              level: d.level as string,
              softCap: d.soft_cap as number,
              turnEstimate: d.turn_estimate as number,
              personaName: d.persona_name as string,
            });
            sessionIdRef.current = d.session_id as string;
            setSoftCap(d.soft_cap as number);
            setPageState("core");
            setMicStateSync("playing");
            break;
          }
          case "ai_chunk":
            openingText += (event.data.text as string) + " ";
            enqueueText(event.data.text as string);
            break;
          case "audio":
            schedulePCMChunk(event.data.pcm as string, event.data.rate as number);
            break;
          case "done": {
            if (openingText.trim()) {
              transcriptRef.current.push({ role: "assistant", text: openingText.trim() });
            }
            const ctx = audioCtxRef.current;
            const remaining = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
            setTimeout(() => setMicStateSync("idle"), remaining * 1000 + 300);
            break;
          }
          case "error":
            setError(event.data.message as string);
            setMicStateSync("idle");
            setPageState("pre_session");
            break;
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string }).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMicStateSync("idle");
      setPageState("pre_session");
    }
  }

  // ─── Recording ────────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (micStateRef.current !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setMicStateSync("recording");
      setError(null);
    } catch {
      setError("Microphone access denied.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (micStateRef.current !== "recording") return;
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    setMicStateSync("processing");
    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const sid = sessionIdRef.current;
      if (!sid) return;

      resetMayaText();

      const abort = new AbortController();
      abortRef.current = abort;

      let turnUserText = "";
      let turnMayaText = "";

      try {
        for await (const event of sendSpeakingTurn(sid, blob, abort.signal)) {
          if (abort.signal.aborted) break;
          switch (event.type) {
            case "transcript":
              turnUserText = event.data.text as string;
              break;
            case "ai_chunk":
              turnMayaText += (event.data.text as string) + " ";
              if (micStateRef.current !== "playing") setMicStateSync("playing");
              enqueueText(event.data.text as string);
              break;
            case "audio":
              schedulePCMChunk(event.data.pcm as string, event.data.rate as number);
              break;
            case "turn_update":
              setTurnCount(event.data.turn_count as number);
              setSoftCap(event.data.soft_cap as number);
              break;
            case "done": {
              if (turnUserText) transcriptRef.current.push({ role: "user", text: turnUserText });
              if (turnMayaText.trim()) transcriptRef.current.push({ role: "assistant", text: turnMayaText.trim() });
              const ctx = audioCtxRef.current;
              const remaining = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
              setTimeout(() => setMicStateSync("idle"), remaining * 1000 + 300);
              break;
            }
            case "session_ended": {
              if (turnUserText) transcriptRef.current.push({ role: "user", text: turnUserText });
              if (turnMayaText.trim()) transcriptRef.current.push({ role: "assistant", text: turnMayaText.trim() });
              const ctx = audioCtxRef.current;
              const remaining = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
              setTimeout(() => {
                setMicStateSync("idle");
                setPageState("ended");
                if (event.data.feedback) setFeedback(event.data.feedback as Feedback);
                setSessionTranscript([...transcriptRef.current]);
              }, remaining * 1000 + 500);
              break;
            }
            case "error":
              setError(event.data.message as string);
              setMicStateSync("idle");
              break;
          }
        }
      } catch (err: unknown) {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong");
        setMicStateSync("idle");
      }
    };
  }, [schedulePCMChunk]);

  // ─── Keyboard shortcut ────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !spaceDownRef.current && pageState === "core") {
        spaceDownRef.current = true;
        startRecording();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") { spaceDownRef.current = false; stopRecording(); }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [startRecording, stopRecording, pageState]);

  function handleMicClick() {
    if (micState === "idle") startRecording();
    else if (micState === "recording") stopRecording();
    else if (micState === "playing") { stopAllAudio(); setMicStateSync("idle"); }
  }

  // ─── Preview mode ─────────────────────────────────────────────────────────

  if (preview) {
    return (
      <div className="page-transition flex flex-col" style={{ height: "100vh" }}>
        <FeedbackCard
          feedback={MOCK_FEEDBACK}
          turnCount={7}
          softCap={10}
          transcript={MOCK_TRANSCRIPT}
          onNext={() => router.push("/speaking")}
        />
      </div>
    );
  }

  // ─── Pre-session card ─────────────────────────────────────────────────────

  if (pageState === "pre_session") {
    return (
      <div className="page-transition flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-background">
        <div className="w-full max-w-md bg-surface-lowest border border-outline-variant/20 rounded-3xl p-8 shadow-ambient">
          <div className="text-5xl mb-5">💬</div>
          <h2 className="font-lexend font-bold text-2xl text-on-surface mb-2">{scenarioTitle}</h2>
          <p className="font-manrope text-sm text-on-surface-variant mb-6 leading-relaxed">
            A real-world conversation in {language}. Maya stays in character — just speak naturally.
          </p>
          <div className="flex items-center gap-3 mb-8">
            <span className="font-manrope font-bold text-xs bg-tertiary-container text-tertiary px-3 py-1 rounded-full">
              Adapted to your level
            </span>
            <span className="font-manrope text-xs text-on-surface-variant">~10 min · {language}</span>
          </div>
          {error && (
            <div className="mb-4 px-4 py-3 bg-error-container rounded-2xl text-error text-sm font-manrope">{error}</div>
          )}
          <button
            onClick={handleStartSession}
            className="w-full bg-primary text-white font-manrope font-bold text-base py-4 rounded-full hover:bg-primary/90 transition-colors"
          >
            Start Session
          </button>
          <button
            onClick={() => router.push("/speaking")}
            className="w-full mt-3 text-on-surface-variant font-manrope text-sm py-2 hover:text-on-surface transition-colors"
          >
            ← Back to scenarios
          </button>
        </div>
      </div>
    );
  }

  // ─── Ended (feedback) ────────────────────────────────────────────────────

  if (pageState === "ended") {
    return (
      <div className="page-transition flex flex-col" style={{ height: "100vh" }}>
        {feedback ? (
          <FeedbackCard
            feedback={feedback}
            turnCount={turnCount}
            softCap={softCap}
            transcript={sessionTranscript}
            onNext={() => router.push("/speaking")}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="font-lexend font-bold text-xl text-on-surface">Session complete!</p>
              <button
                onClick={() => router.push("/speaking")}
                className="bg-primary text-white font-manrope font-bold px-8 py-3 rounded-full"
              >
                Start another session
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Active session ───────────────────────────────────────────────────────

  return (
    <div className="page-transition flex flex-col items-center bg-background" style={{ height: "100vh" }}>
      {/* Header */}
      <div className="w-full flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
        <div>
          <h2 className="font-lexend font-bold text-base text-on-surface">
            {sessionInfo?.scenarioTitle ?? scenarioTitle}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-manrope font-bold text-xs bg-tertiary-container text-tertiary px-2 py-0.5 rounded-full">
              {sessionInfo?.level ?? "A1"}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
            <span className="font-manrope text-xs text-on-surface-variant">{language}</span>
          </div>
        </div>
        {pageState === "core" && (
          <div className="text-right">
            <p className="font-lexend font-bold text-lg text-on-surface">{turnCount} <span className="text-on-surface-variant text-sm font-manrope">/ {softCap}</span></p>
            <p className="font-manrope text-[10px] text-on-surface-variant uppercase tracking-wider">turns</p>
          </div>
        )}
      </div>

      {/* Maya area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <MayaAvatar micState={micState} />

        {mayaText && (
          <p className="font-manrope text-sm text-on-surface max-w-sm leading-relaxed">{mayaText}</p>
        )}

        <p className="font-manrope text-xs text-on-surface-variant">
          {micState === "idle" && pageState === "core" && "Hold SPACE or tap the mic to speak"}
          {micState === "recording" && "Listening..."}
          {micState === "processing" && (pageState === "entry" ? "Starting session..." : "Processing...")}
          {micState === "playing" && `${sessionInfo?.personaName ?? "Maya"} is speaking`}
        </p>
      </div>

      {error && (
        <div className="mx-6 mb-3 px-4 py-3 bg-error-container rounded-2xl text-error text-sm text-center font-manrope">
          {error}
        </div>
      )}

      {/* Mic */}
      <div className="pb-10 pt-3 flex flex-col items-center gap-3 border-t border-outline-variant/10 w-full">
        <button
          onClick={handleMicClick}
          disabled={micState === "processing" || pageState === "entry"}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none ${
            micState === "idle" ? "bg-primary hover:bg-primary/90 shadow-ambient" :
            micState === "recording" ? "bg-error shadow-ambient scale-110" :
            micState === "processing" ? "bg-surface-highest cursor-not-allowed" :
            "bg-tertiary shadow-ambient"
          }`}
        >
          {micState === "idle" && <span className="material-symbols-outlined ms-filled text-[32px] text-white">mic</span>}
          {micState === "recording" && (
            <>
              <span className="material-symbols-outlined ms-filled text-[32px] text-white">mic</span>
              <span className="absolute -inset-2 rounded-full border-2 border-error/40 animate-ping" />
            </>
          )}
          {micState === "processing" && (
            <div className="w-7 h-7 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          )}
          {micState === "playing" && <span className="material-symbols-outlined ms-filled text-[32px] text-white">stop</span>}
        </button>
        <p className="font-manrope text-xs text-on-surface-variant">
          {micState === "recording" && "Release to send"}
          {micState === "playing" && "Tap to stop"}
          {micState === "idle" && pageState === "core" && "Hold SPACE or tap mic"}
        </p>
        {pageState === "core" && sessionInfo && (
          <button
            onClick={async () => {
              stopAllAudio();
              try {
                const result = await endSpeakingSession(sessionInfo.sessionId);
                setFeedback(result.feedback as Feedback);
              } catch {}
              setSessionTranscript([...transcriptRef.current]);
              setPageState("ended");
            }}
            className="mt-2 font-manrope text-xs text-on-surface-variant underline underline-offset-2 hover:text-error transition-colors"
          >
            End session
          </button>
        )}
      </div>
    </div>
  );
}
