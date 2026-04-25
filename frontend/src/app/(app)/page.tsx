"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase";
import { getDailyNews, getProgress, type DailyNewsData, type ProgressData } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
function levelToOffset(level: string): number {
  const idx = CEFR_LEVELS.indexOf(level.toUpperCase());
  if (idx === -1) return 185;
  return Math.round(201 * (1 - (idx + 1) / 6));
}

const quickStart = [
  { href: "/speaking",   icon: "record_voice_over", iconBg: "bg-tertiary-container",   iconColor: "text-tertiary",  title: "Speaking",   desc: "Real scenarios" },
  { href: "/listening",  icon: "headphones",         iconBg: "bg-primary-container",    iconColor: "text-primary",   title: "Listening",  desc: "Audio practice" },
  { href: "/vocabulary", icon: "menu_book",           iconBg: "bg-secondary-container",  iconColor: "text-secondary", title: "Vocabulary", desc: "24 words due" },
  { href: "/grammar",    icon: "auto_stories",        iconBg: "bg-surface-highest",      iconColor: "text-on-surface",title: "Grammar",    desc: "Focus on Daily" },
];

const leaderboard = [
  { rank: 1, name: "Sarah M.", level: "C1 Level", xp: "2,450 XP", isYou: false },
  { rank: 2, name: "David K.", level: "B2 Level", xp: "2,100 XP", isYou: false },
  { rank: 3, name: "You",      level: "B2 Level", xp: "1,840 XP", isYou: true  },
  { rank: 4, name: "Elena R.", level: "B1 Level", xp: "1,650 XP", isYou: false },
];

const rankColors = ["text-yellow-500", "text-slate-400", "text-amber-600"];

export default function DashboardPage() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [wordFlipped, setWordFlipped] = useState(false);
  const [displayName, setDisplayName] = useState<string>("");
  const [news, setNews] = useState<DailyNewsData | null>(null);
  const [newsLoading, setNewsLoading] = useState(true);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const info = await res.json();
          setDisplayName(info.username ?? info.full_name ?? data.session?.user.email?.split("@")[0] ?? "");
          return;
        }
      } catch {}
      const email = data.session?.user.email ?? "";
      setDisplayName(email.split("@")[0]);
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getDailyNews(controller.signal)
      .then((data) => { setNews(data); setNewsLoading(false); })
      .catch((err) => { if (err?.name !== "AbortError") setNewsLoading(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    getProgress().then(setProgress).catch(() => {});
  }, []);

  const currentQuestion = news?.quiz_questions[currentQuizIdx] ?? null;

  function handleCheckAnswer() {
    if (selectedOption === null) return;
    setAnswerChecked(true);
  }

  function handleNextQuestion() {
    if (!news) return;
    setCurrentQuizIdx((i) => Math.min(i + 1, news.quiz_questions.length - 1));
    setSelectedOption(null);
    setAnswerChecked(false);
  }

  return (
    <>
    <Header />
    <div className="page-transition px-6 py-6 max-w-6xl mx-auto">

      {/* ── Greeting ─────────────────────────────────────────────────────────── */}
      <div className="mb-7">
        <h1 className="font-lora font-bold text-3xl text-on-surface">Welcome, {displayName || "…"} 👋</h1>
        <p className="font-manrope text-sm text-on-surface-variant mt-1">Your daily 10-minute warm-up is ready.</p>
      </div>

      {/* ── Quick Start ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {quickStart.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-center gap-3 bg-surface-lowest border border-outline-variant/60 rounded-2xl px-4 py-3.5 hover:shadow-ambient hover:-translate-y-0.5 transition-all duration-200"
            style={{ boxShadow: "0 1px 4px rgba(27,31,59,0.06)" }}
          >
            <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className={`material-symbols-outlined ms-filled text-[20px] ${card.iconColor}`}>{card.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-manrope font-semibold text-sm text-on-surface">{card.title}</p>
              <p className="font-manrope text-xs text-on-surface-variant">{card.desc}</p>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60 flex-shrink-0">chevron_right</span>
          </Link>
        ))}
      </div>

      {/* ── Two-column main ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left column */}
        <div className="lg:col-span-3 space-y-5">

          {/* Daily News */}
          <div className="bg-surface-lowest border border-outline-variant/60 rounded-3xl p-6" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined ms-filled text-[20px] text-primary">newspaper</span>
                <h3 className="font-lexend font-semibold text-base text-on-surface">Daily News</h3>
              </div>
              {news && (
                <span className="font-manrope font-bold text-xs bg-primary-container text-primary px-3 py-1 rounded-full">
                  {news.level} Level
                </span>
              )}
            </div>

            {newsLoading ? (
              <div className="flex items-center justify-center py-8">
                <span
                  className="font-lexend font-semibold text-lg bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #9ca3af 0%, #9ca3af 30%, #E8437A 50%, #F97316 60%, #9ca3af 70%, #9ca3af 100%)",
                  }}
                >
                  Collecting daily news for you...
                </span>
              </div>
            ) : news ? (
              <>
                <h4 className="font-lora font-bold text-lg text-on-surface mb-2 leading-snug opacity-0 animate-fade-up [animation-delay:60ms] [animation-fill-mode:forwards]">
                  {news.title}
                </h4>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed mb-5 opacity-0 animate-fade-up [animation-delay:140ms] [animation-fill-mode:forwards]">
                  {news.body}
                </p>

                {currentQuestion && (
                  <div className="border-t border-outline-variant/50 pt-3 opacity-0 animate-fade-up [animation-delay:240ms] [animation-fill-mode:forwards]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-manrope font-semibold text-[10px] text-primary uppercase tracking-wide">
                        Question {currentQuizIdx + 1} of {news.quiz_questions.length}
                      </span>
                      <span className="font-manrope font-bold text-[10px] bg-tertiary text-white px-2 py-0.5 rounded-full">+15 XP</span>
                    </div>
                    <p className="font-manrope font-semibold text-xs text-on-surface mb-2">
                      {currentQuestion.question}
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {currentQuestion.options.map((opt, i) => {
                        const letter = ["A", "B", "C"][i];
                        const isSelected = selectedOption === i;
                        const isCorrect = letter === currentQuestion.correct;
                        let style = "border-outline-variant/70 text-on-surface hover:border-primary/40 hover:bg-primary-container/20";
                        if (answerChecked) {
                          if (isCorrect) style = "border-tertiary bg-tertiary-container text-tertiary font-semibold";
                          else if (isSelected) style = "border-error bg-error-container text-error font-semibold";
                        } else if (isSelected) {
                          style = "border-primary bg-primary-container text-primary font-semibold";
                        }
                        const reason = answerChecked ? currentQuestion.reasoning?.[i] : null;
                        return (
                          <div key={i} className="opacity-0 animate-fade-up [animation-fill-mode:forwards]" style={{ animationDelay: `${320 + i * 60}ms` }}>
                            <button
                              onClick={() => !answerChecked && setSelectedOption(i)}
                              disabled={answerChecked}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs text-left transition-all duration-200 font-manrope ${style}`}
                              style={!isSelected && !answerChecked ? { background: "var(--yellow-pale)" } : undefined}
                            >
                              <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                                isSelected ? "border-current bg-current" : "border-outline-variant"
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              {opt}
                            </button>
                            {reason && (
                              <p className={`font-manrope text-[10px] leading-snug px-3 pt-1 pb-0.5 animate-[fadeIn_0.3s_ease-out] ${
                                isCorrect ? "text-tertiary" : isSelected ? "text-error" : "text-on-surface-variant/70"
                              }`}>
                                {reason}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-center">
                      {!answerChecked ? (
                        <button
                          onClick={handleCheckAnswer}
                          disabled={selectedOption === null}
                          className="text-white font-manrope font-bold text-xs px-8 py-2 rounded-full transition-opacity hover:opacity-90 disabled:opacity-40"
                          style={{ background: "linear-gradient(135deg, #A07DD6 0%, #7C5CBF 100%)", boxShadow: "0 4px 14px rgba(124,92,191,0.30)" }}
                        >
                          Check Answer
                        </button>
                      ) : currentQuizIdx < news.quiz_questions.length - 1 ? (
                        <button
                          onClick={handleNextQuestion}
                          className="text-white font-manrope font-bold text-xs px-8 py-2 rounded-full transition-opacity hover:opacity-90"
                          style={{ background: "linear-gradient(135deg, #A07DD6 0%, #7C5CBF 100%)", boxShadow: "0 4px 14px rgba(124,92,191,0.30)" }}
                        >
                          Next Question →
                        </button>
                      ) : (
                        <span className="font-manrope font-bold text-xs text-tertiary">Quiz complete! 🎉</span>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="font-manrope text-sm text-on-surface-variant">Could not load today&apos;s news.</p>
            )}
          </div>

          {/* Progress Snapshot */}
          <div className="bg-surface-lowest border border-outline-variant/60 rounded-3xl p-6" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined ms-filled text-[20px] text-primary">insights</span>
                <h3 className="font-lexend font-semibold text-base text-on-surface">My Progress</h3>
              </div>
              <Link href="/progress" className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[20px]">open_in_new</span>
              </Link>
            </div>

            <div className="flex items-center gap-6 mb-5">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" className="text-surface-highest" strokeWidth="6" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" className="text-primary" strokeWidth="6" strokeDasharray="201" strokeDashoffset={levelToOffset(progress?.current_level ?? "A1")} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-lexend font-bold text-xl text-primary">{progress?.current_level ?? "—"}</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-manrope text-sm text-on-surface-variant">Last Session Score</span>
                  <span className="font-manrope font-bold text-sm text-on-surface">
                    {progress?.last_session_score != null ? `${progress.last_session_score}/100` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-manrope text-sm text-on-surface-variant">Current Streak</span>
                  <span className="font-manrope font-bold text-sm text-tertiary">
                    {progress != null ? `🔥 ${progress.current_streak} day${progress.current_streak !== 1 ? "s" : ""}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-manrope text-sm text-on-surface-variant">Sessions this week</span>
                  <span className="font-manrope font-bold text-sm text-on-surface">
                    {progress != null ? `${progress.sessions_this_week} / 5` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Maya's Tip */}
            <div className="bg-primary-container border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                  <img src="/maya_icon.svg" alt="Maya" className="w-full h-full object-cover" />
                </div>
                <span className="font-manrope font-bold text-sm text-primary">Maya&apos;s Tip</span>
              </div>
              {progress?.watch_out_topic ? (
                <>
                  <p className="font-manrope text-sm text-on-surface-variant leading-relaxed mb-3">
                    You&apos;ve been working on <strong className="text-on-surface">{progress.watch_out_topic}</strong> in your recent sessions. A quick grammar drill today will help it click.
                  </p>
                  <div className="flex justify-center">
                    <button className="text-white font-manrope font-bold text-sm px-10 py-2.5 rounded-full transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #A07DD6 0%, #7C5CBF 100%)", boxShadow: "0 4px 14px rgba(124,92,191,0.30)" }}>
                      Practice {progress.watch_out_topic}
                    </button>
                  </div>
                </>
              ) : (
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">
                  Complete a speaking session and Maya will give you a personalized tip based on your performance.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Word of the Day */}
          <div className="bg-surface-lowest border border-outline-variant/60 rounded-3xl p-6" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined ms-filled text-[20px] text-secondary">menu_book</span>
                <h3 className="font-lexend font-semibold text-base text-on-surface">Word of the Day</h3>
              </div>
              <span className="font-manrope text-xs bg-secondary-container text-secondary px-2.5 py-1 rounded-full font-semibold border border-secondary/20">German</span>
            </div>

            <div className="text-center mb-5">
              <h2 className="font-lora font-bold text-2xl text-on-surface mb-1.5">die Leidenschaft</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="font-manrope text-xs text-on-surface-variant">[ˈlaɪdnʃaft] · Noun (f)</span>
                <button className="text-primary hover:text-primary/70 transition-colors">
                  <span className="material-symbols-outlined ms-filled text-[18px]">volume_up</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <div className="bg-surface border border-outline-variant/60 rounded-2xl p-3">
                <p className="font-manrope font-semibold text-[10px] text-on-surface-variant uppercase tracking-wide mb-1">Translation</p>
                <p className="font-manrope font-semibold text-sm text-on-surface">Passion</p>
              </div>
              <div className="bg-surface border border-outline-variant/60 rounded-2xl p-3">
                <p className="font-manrope font-semibold text-[10px] text-on-surface-variant uppercase tracking-wide mb-1">Example</p>
                <p className="font-manrope text-sm text-on-surface italic">&ldquo;Sie kocht mit großer Leidenschaft.&rdquo;</p>
                <p className="font-manrope text-xs text-on-surface-variant mt-1">(She cooks with great passion.)</p>
              </div>
            </div>

            {!wordFlipped ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setWordFlipped(true)}
                  className="flex items-center justify-center gap-1.5 border border-outline-variant text-on-surface font-manrope font-bold text-sm py-2.5 rounded-full hover:bg-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[17px]">cached</span>
                  Flip
                </button>
                <button className="flex items-center justify-center gap-1.5 text-white font-manrope font-bold text-sm py-2.5 rounded-full transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #4ECBA8 0%, #2A9D7C 100%)", boxShadow: "0 4px 14px rgba(42,157,124,0.28)" }}>
                  <span className="material-symbols-outlined ms-filled text-[17px]">check_circle</span>
                  Learned
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setWordFlipped(false)}
                  className="border border-outline-variant text-on-surface font-manrope font-bold text-sm py-2.5 rounded-full hover:bg-surface transition-colors"
                >
                  Still Learning
                </button>
                <button className="text-white font-manrope font-bold text-sm py-2.5 rounded-full transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #4ECBA8 0%, #2A9D7C 100%)", boxShadow: "0 4px 14px rgba(42,157,124,0.28)" }}>
                  Know It ✓
                </button>
              </div>
            )}
          </div>

          {/* Weekly Leaderboard */}
          <div className="bg-surface-lowest border border-outline-variant/60 rounded-3xl p-6" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined ms-filled text-[20px] text-secondary">leaderboard</span>
                <h3 className="font-lexend font-semibold text-base text-on-surface">Leaderboard</h3>
              </div>
              <span className="font-manrope text-xs text-on-surface-variant bg-surface border border-outline-variant/60 px-2.5 py-1 rounded-full">Resets in 2d</span>
            </div>

            <div className="space-y-1">
              {leaderboard.map((user) => (
                <div
                  key={user.rank}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors ${
                    user.isYou ? "bg-tertiary-container border border-tertiary/20" : "hover:bg-surface"
                  }`}
                >
                  <span className={`font-manrope font-bold text-sm w-4 flex-shrink-0 ${rankColors[user.rank - 1] ?? "text-on-surface-variant"}`}>
                    {user.rank}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white font-lexend font-bold text-xs flex-shrink-0">
                    {user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-manrope font-semibold text-sm truncate ${user.isYou ? "text-secondary" : "text-on-surface"}`}>
                      {user.name}
                    </p>
                    <p className="font-manrope text-xs text-on-surface-variant">{user.level}</p>
                  </div>
                  <span className={`font-manrope font-bold text-sm flex-shrink-0 ${user.isYou ? "text-secondary" : "text-on-surface"}`}>
                    {user.xp}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
    </>
  );
}
