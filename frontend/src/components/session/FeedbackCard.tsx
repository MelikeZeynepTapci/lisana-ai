"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchOutItem {
  topic: string;
  said: string;
  better: string;
  note: string;
  examples?: { correct: boolean; text: string }[];
}

export interface QuizOption {
  id: number;
  text: string;
  correct: boolean;
}

export interface Feedback {
  maya_summary?: { headline: string; body: string };
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

export interface TranscriptTurn {
  role: "user" | "assistant";
  text: string;
}

// ─── Rich text renderer (**bold** → <strong>) ─────────────────────────────────

function renderRichText(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-on-surface">{part}</strong>
      : part
  );
}

// ─── WatchOutCard ─────────────────────────────────────────────────────────────

function WatchOutCard({ item, defaultOpen = true }: { item: WatchOutItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-highest/20 transition-colors text-left"
      >
        <span className="font-lexend font-semibold text-sm text-on-surface">{item.topic}</span>
        <span
          className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-outline-variant/10 bg-white">
          <p className="font-manrope text-sm text-on-surface-variant leading-relaxed mt-3">{item.note}</p>
          {item.said && item.better && (
            <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
              <span className="font-manrope text-xs text-on-surface-variant">&ldquo;{item.said}&rdquo;</span>
              <span className="text-on-surface-variant text-xs">→</span>
              <span className="font-manrope text-xs font-semibold text-on-surface">&ldquo;{item.better}&rdquo;</span>
            </div>
          )}
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
    <div className="space-y-2.5">
      <p className="font-manrope text-sm font-medium text-on-surface">{quiz.question}</p>
      <div className="space-y-2">
        {(quiz.options ?? []).map((opt) => {
          const isSelected = selected === opt.id;
          const showResult = answered && isSelected;
          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => setSelected(opt.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-sm transition-all font-manrope ${
                !answered
                  ? "border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-highest/20 text-on-surface"
                  : showResult && opt.correct
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : showResult && !opt.correct
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-outline-variant/10 text-on-surface-variant"
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all ${
                showResult && opt.correct  ? "bg-emerald-500 border-emerald-500" :
                showResult && !opt.correct ? "bg-red-400 border-red-400" :
                "border-outline-variant/40"
              }`} />
              {opt.text}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`font-manrope text-xs px-3 py-2.5 rounded-xl leading-relaxed ${
          quiz.options.find(o => o.id === selected)?.correct
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-600"
        }`}>
          {quiz.explanation}
        </div>
      )}
    </div>
  );
}

// ─── TranscriptSection ────────────────────────────────────────────────────────

function TranscriptSection({ transcript }: { transcript: TranscriptTurn[] }) {
  const [open, setOpen] = useState(false);
  if (transcript.length === 0) return null;

  return (
    <div className="bg-white border border-outline-variant/20 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-highest/20 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📄</span>
          <div>
            <p className="font-lexend font-semibold text-base text-on-surface">Session transcript</p>
            <p className="font-manrope text-xs text-on-surface-variant mt-0.5">
              {transcript.length} turns · tap to {open ? "hide" : "show"} full conversation
            </p>
          </div>
        </div>
        <span
          className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200 flex-shrink-0"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div className="border-t border-outline-variant/10 px-5 py-4 space-y-4">
          {transcript.map((turn, i) => (
            <div key={i} className="flex gap-3">
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 text-[11px] font-bold ${
                turn.role === "assistant" ? "bg-primary/15 text-primary" : "bg-surface-highest text-on-surface-variant"
              }`}>
                {turn.role === "assistant" ? "M" : "Y"}
              </div>
              <div className="min-w-0">
                <p className="font-manrope text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide mb-1">
                  {turn.role === "assistant" ? "Maya" : "You"}
                </p>
                <p className="font-manrope text-sm text-on-surface leading-relaxed">{turn.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FeedbackLoader ───────────────────────────────────────────────────────────

export function FeedbackLoader() {
  return (
    <div className="flex flex-col items-center justify-center bg-background" style={{ height: "100vh" }}>
      <div className="flex flex-col items-center gap-3 text-center px-6">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"
              style={{ animationDelay: `${i * 0.12}s`, animationDuration: "0.8s" }}
            />
          ))}
        </div>
        <p className="font-manrope text-sm text-on-surface-variant">
          Preparing your feedback…
        </p>
      </div>
    </div>
  );
}

// ─── FeedbackCard ─────────────────────────────────────────────────────────────

export function FeedbackCard({
  feedback,
  turnCount,
  softCap,
  transcript,
  onNext,
  isDemo = false,
}: {
  feedback: Feedback;
  turnCount: number;
  softCap: number;
  transcript: TranscriptTurn[];
  onNext: () => void;
  isDemo?: boolean;
}) {
  const errors       = feedback.watch_out_for ?? [];
  const alternatives = feedback.alternatives  ?? [];
  const xpEarned     = Math.max(10, turnCount * 4);
  const mayaHeadline = feedback.maya_summary?.headline ?? feedback.what_went_well?.[0] ?? "Great effort this session";
  const mayaBody     = feedback.maya_summary?.body ?? [
    ...(feedback.what_went_well?.slice(1) ?? []),
    feedback.one_tip ?? "",
  ].filter(Boolean).join(" ");

  const hasWatchOut = errors.length > 0;
  const hasQuiz     = !!feedback.quiz?.options?.length;
  const hasAlts     = alternatives.length > 0;

  return (
    <div className="flex flex-col bg-background" style={{ height: "100vh" }}>

      {/* ── Navbar ── */}
      <nav className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-white border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined ms-filled text-[16px] text-primary">smart_toy</span>
          </div>
          <span className="font-lexend font-semibold text-sm text-on-surface">Lisana AI</span>
        </div>
        <div className="flex items-center gap-2">
          {!isDemo && (
            <button
              onClick={onNext}
              className="font-manrope text-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Back to sessions
            </button>
          )}
          <button
            onClick={onNext}
            className="font-manrope text-sm font-semibold text-white bg-primary px-4 py-2 rounded-full hover:bg-primary/90 transition-colors flex items-center gap-1"
          >
            {isDemo ? "Sign up to continue" : "Continue learning"}
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </nav>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 lg:px-10 py-6 lg:py-8">

          {/* Hero */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 font-manrope text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full mb-3">
              🏆 {isDemo ? "Demo complete" : "Session complete"}
            </span>
            <h1 className="font-lexend font-bold text-2xl lg:text-3xl text-on-surface leading-snug mb-1">
              Conversation feedback
            </h1>
            <p className="font-manrope text-sm text-on-surface-variant">
              {isDemo
                ? "Here's what Maya noticed. Sign up to get this after every session."
                : "The highlights, corrections, and what to try next."}
            </p>
          </div>

          {/* 2-col grid */}
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start">

            {/* ── Left column ── */}
            <div className="space-y-4">

              {/* Maya's Summary */}
              {(feedback.maya_summary || feedback.what_went_well?.length > 0) && (
                <div className="bg-white border border-outline-variant/20 rounded-2xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)" }}>
                      <span className="material-symbols-outlined ms-filled text-[20px] text-white">smart_toy</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-manrope text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest mb-1">Maya&apos;s Summary</p>
                      <p className="font-lexend font-semibold text-lg text-on-surface leading-snug mb-2">
                        {mayaHeadline} ✨
                      </p>
                      {mayaBody && (
                        <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">
                          {renderRichText(mayaBody)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Watch out for */}
              {hasWatchOut && (
                <div className="bg-white border border-outline-variant/20 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="material-symbols-outlined text-[16px] text-amber-500">warning</span>
                        <h3 className="font-lexend font-semibold text-base text-on-surface">Watch out for 🔍</h3>
                      </div>
                      <p className="font-manrope text-xs text-on-surface-variant">
                        The most valuable corrections, shown as expandable notes.
                      </p>
                    </div>
                    <span className="font-manrope text-xs text-on-surface-variant bg-surface-highest/60 px-2 py-0.5 rounded-full flex-shrink-0">
                      {errors.length} {errors.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {errors.map((item, i) => (
                      <WatchOutCard key={i} item={item} defaultOpen={i === 0} />
                    ))}
                  </div>
                </div>
              )}

              {/* You could have said */}
              {hasAlts && (
                <div className="bg-white border border-outline-variant/20 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
                      </div>
                      <div>
                        <h3 className="font-lexend font-semibold text-base text-on-surface">You could have said 💬</h3>
                        <p className="font-manrope text-xs text-on-surface-variant mt-0.5">
                          A few natural alternatives worth remembering.
                        </p>
                      </div>
                    </div>
                    <span className="font-manrope text-xs text-on-surface-variant bg-surface-highest/60 px-2 py-0.5 rounded-full flex-shrink-0">
                      {alternatives.length} {alternatives.length === 1 ? "idea" : "ideas"}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {alternatives.map((alt, i) => (
                      <div key={i} className={i > 0 ? "pt-4 border-t border-outline-variant/10" : ""}>
                        <p className="font-manrope text-xs text-on-surface-variant mb-2">
                          Instead of <span className="font-medium text-on-surface">&ldquo;{alt.instead}&rdquo;</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {alt.try.map((t, j) => (
                            <span key={j} className="font-manrope text-sm text-on-surface bg-surface-highest/40 border border-outline-variant/20 px-3 py-1.5 rounded-lg">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript */}
              <TranscriptSection transcript={transcript} />

              <div className="pb-4 lg:pb-8" />
            </div>

            {/* ── Right sidebar ── */}
            <div className="space-y-4 mt-4 lg:mt-0 lg:sticky lg:top-4">

              {/* Metrics */}
              <div className="bg-white border border-outline-variant/20 rounded-2xl p-4">
                <p className="font-manrope text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest mb-3">This session</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-on-surface-variant">timer</span>
                      <span className="font-manrope text-sm text-on-surface-variant">Turns</span>
                    </div>
                    <span className="font-lexend font-bold text-xl text-on-surface">
                      {turnCount}<span className="text-sm font-normal text-on-surface-variant">/{softCap}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-on-surface-variant">error_outline</span>
                      <span className="font-manrope text-sm text-on-surface-variant">Errors</span>
                    </div>
                    <span className={`font-lexend font-bold text-xl ${errors.length > 2 ? "text-amber-500" : "text-on-surface"}`}>
                      {errors.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-on-surface-variant">star</span>
                      <span className="font-manrope text-sm text-on-surface-variant">XP earned</span>
                    </div>
                    <span className="font-lexend font-bold text-xl text-primary">+{xpEarned}</span>
                  </div>
                </div>
                {isDemo && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/10">
                    <p className="font-manrope text-xs text-on-surface-variant/70 text-center">
                      Sign up to track XP & streaks
                    </p>
                  </div>
                )}
              </div>

              {/* Quiz */}
              {hasQuiz && (
                <div className="bg-white border border-outline-variant/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">quiz</span>
                    <h3 className="font-lexend font-semibold text-base text-on-surface">Quick check 🧩</h3>
                  </div>
                  <p className="font-manrope text-xs text-on-surface-variant mb-4">
                    Short and optional — just one quick reinforcement.
                  </p>
                  <QuizSection quiz={feedback.quiz!} />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex-shrink-0 bg-white border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          {isDemo ? (
            <>
              <p className="font-lexend font-semibold text-base text-on-surface">Want the full experience?</p>
              <p className="font-manrope text-xs text-on-surface-variant truncate">
                Unlimited sessions, full feedback, streaks & progress tracking.
              </p>
            </>
          ) : (
            <>
              <p className="font-manrope text-xs text-on-surface-variant flex items-center gap-1 mb-0.5">
                Pick your next move
                <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
              </p>
              <p className="font-lexend font-semibold text-base text-on-surface">What to do next</p>
              <p className="font-manrope text-xs text-on-surface-variant truncate">
                Keep it light — replay for a quick win, or jump into a fresh challenge.
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isDemo && (
            <button
              onClick={() => window.location.reload()}
              className="font-manrope text-sm text-on-surface-variant border border-outline-variant/30 px-4 py-2 rounded-full hover:bg-surface-highest/40 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">replay</span>
              Replay
            </button>
          )}
          <button
            onClick={onNext}
            className="font-manrope text-sm font-semibold text-white bg-primary px-4 py-2 rounded-full hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            {isDemo ? "Create free account" : "Next scenario"}
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>

    </div>
  );
}
