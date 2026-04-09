"use client";

import { useState } from "react";
import Link from "next/link";

const quickStart = [
  { href: "/speaking", icon: "record_voice_over", iconBg: "bg-tertiary-container", iconColor: "text-tertiary", title: "Speaking", desc: "Real scenarios" },
  { href: "/listening", icon: "headphones", iconBg: "bg-primary-container/60", iconColor: "text-primary", title: "Listening", desc: "Audio practice" },
  { href: "/vocabulary", icon: "menu_book", iconBg: "bg-secondary-container", iconColor: "text-secondary", title: "Vocabulary", desc: "24 words due" },
  { href: "/grammar", icon: "auto_stories", iconBg: "bg-surface-highest", iconColor: "text-on-surface", title: "Grammar", desc: "Focus on Daily" },
];

const quizOptions = [
  "Schneller und umweltfreundlicher zu sein",
  "Die Ticketpreise deutlich zu senken",
  "Mehr Zugpersonal einzustellen",
];

const leaderboard = [
  { rank: 1, name: "Sarah M.", level: "C1 Level", xp: "2,450 XP", isYou: false },
  { rank: 2, name: "David K.", level: "B2 Level", xp: "2,100 XP", isYou: false },
  { rank: 3, name: "You", level: "B2 Level", xp: "1,840 XP", isYou: true },
  { rank: 4, name: "Elena R.", level: "B1 Level", xp: "1,650 XP", isYou: false },
];

export default function DashboardPage() {
  const [selectedOption, setSelectedOption] = useState(0);
  const [wordFlipped, setWordFlipped] = useState(false);

  return (
    <div className="page-transition px-6 py-6">
      {/* Greeting Row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-lexend font-bold text-3xl text-on-surface">Good morning, Alex</h1>
          <p className="font-manrope text-sm text-on-surface-variant mt-1">Your daily 10-minute warm-up is ready.</p>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined ms-filled text-[18px] text-secondary">local_fire_department</span>
            <span className="font-manrope font-bold text-sm text-on-surface">12 Days</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-manrope text-sm text-on-surface-variant">150/200</span>
            <div className="w-28 bg-surface-highest rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: "75%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {quickStart.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-center gap-3 bg-surface-lowest rounded-2xl px-4 py-3 shadow-ambient-sm hover:shadow-ambient hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-9 h-9 ${card.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className={`material-symbols-outlined ms-filled text-[18px] ${card.iconColor}`}>{card.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-manrope font-semibold text-sm text-on-surface">{card.title}</p>
              <p className="font-manrope text-xs text-on-surface-variant">{card.desc}</p>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant flex-shrink-0">chevron_right</span>
          </Link>
        ))}
      </div>

      {/* Two-column main content */}
      <div className="grid grid-cols-5 gap-6">
        {/* Left column */}
        <div className="col-span-3 space-y-5">
          {/* Daily News */}
          <div className="bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined ms-filled text-[20px] text-primary">newspaper</span>
                <h3 className="font-lexend font-semibold text-base text-on-surface">Daily News</h3>
              </div>
              <span className="font-manrope font-bold text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">B2 Level</span>
            </div>

            <h4 className="font-lexend font-bold text-lg text-on-surface mb-2">
              Die Deutsche Bahn plant neue Hochgeschwindigkeitszüge
            </h4>
            <p className="font-manrope text-sm text-on-surface-variant leading-relaxed mb-5">
              Die Deutsche Bahn hat angekündigt, bis 2030 eine neue Flotte von Hochgeschwindigkeitszügen einzuführen. Diese Züge sollen nicht nur deutlich schneller, sondern auch weitaus umweltfreundlicher betrieben werden, um die Klimaziele zu unterstützen.
            </p>

            <div className="border-t border-outline-variant/20 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-manrope font-semibold text-xs text-primary uppercase tracking-wide">Question 1 of 3</span>
                <span className="font-manrope text-xs text-on-surface-variant">+15 XP</span>
              </div>
              <p className="font-manrope font-semibold text-sm text-on-surface mb-3">
                Was ist das Hauptziel der neuen Zugflotte?
              </p>
              <div className="space-y-2 mb-4">
                {quizOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedOption(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-sm text-left transition-all duration-200 font-manrope ${
                      selectedOption === i
                        ? "border-primary bg-primary-container/40 text-primary font-semibold"
                        : "border-outline-variant/30 bg-surface-low text-on-surface hover:border-primary/40"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedOption === i ? "border-primary bg-primary" : "border-outline-variant"}`}>
                      {selectedOption === i && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    {opt}
                  </button>
                ))}
              </div>
              <button className="w-full bg-primary text-white font-manrope font-bold text-sm py-3 rounded-full hover:bg-primary/90 transition-colors">
                Check Answer
              </button>
            </div>
          </div>

          {/* My Progress Snapshot */}
          <div className="bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined ms-filled text-[20px] text-primary">insights</span>
                <h3 className="font-lexend font-semibold text-base text-on-surface">My Progress Snapshot</h3>
              </div>
              <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[20px]">open_in_new</span>
              </button>
            </div>

            <div className="flex items-center gap-6 mb-5">
              {/* B2 circle */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" className="text-surface-highest" strokeWidth="6" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke="currentColor" className="text-primary" strokeWidth="6" strokeDasharray="201" strokeDashoffset="50" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-lexend font-bold text-xl text-primary">B2</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-manrope text-sm text-on-surface-variant">Last Session Score</span>
                  <span className="font-manrope font-bold text-sm text-on-surface">85/100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-manrope text-sm text-on-surface-variant">Fluency Trend</span>
                  <span className="font-manrope font-bold text-sm text-tertiary">+4%</span>
                </div>
              </div>
            </div>

            {/* Maya's Tip */}
            <div className="bg-primary-container/30 rounded-3xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined ms-filled text-[18px] text-primary">auto_awesome</span>
                <span className="font-manrope font-bold text-sm text-primary">Maya&apos;s Tip</span>
              </div>
              <p className="font-manrope text-sm text-on-surface-variant leading-relaxed mb-3">
                You&apos;ve been struggling with the Dativ case recently in your speaking sessions. Try a quick grammar drill today to reinforce the rules.
              </p>
              <button className="w-full bg-primary text-white font-manrope font-bold text-sm py-2.5 rounded-full hover:bg-primary/90 transition-colors">
                Practice Dativ Case
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-2 space-y-5">
          {/* Word of the Day */}
          <div className="bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined ms-filled text-[20px] text-secondary">menu_book</span>
                <h3 className="font-lexend font-semibold text-base text-on-surface">Word of the Day</h3>
              </div>
              <span className="font-manrope text-xs text-on-surface-variant">German</span>
            </div>

            <div className="text-center mb-5">
              <h2 className="font-lexend font-bold text-2xl text-on-surface mb-1.5">die Leidenschaft</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="font-manrope text-sm text-on-surface-variant">[ˈlaɪdnʃaft] • Noun (f)</span>
                <button className="text-primary hover:text-primary/70 transition-colors">
                  <span className="material-symbols-outlined ms-filled text-[18px]">volume_up</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <div className="bg-surface-low rounded-2xl p-3">
                <p className="font-manrope font-semibold text-[10px] text-on-surface-variant uppercase tracking-wide mb-1">Translation</p>
                <p className="font-manrope font-semibold text-sm text-on-surface">Passion</p>
              </div>
              <div className="bg-surface-low rounded-2xl p-3">
                <p className="font-manrope font-semibold text-[10px] text-on-surface-variant uppercase tracking-wide mb-1">Example in Context</p>
                <p className="font-manrope text-sm text-on-surface italic">&ldquo;Sie kocht mit großer Leidenschaft für ihre Familie.&rdquo;</p>
                <p className="font-manrope text-xs text-on-surface-variant mt-1">(She cooks with great passion for her family.)</p>
              </div>
            </div>

            {!wordFlipped ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWordFlipped(true)}
                  className="flex items-center justify-center gap-2 border-2 border-outline-variant/40 text-on-surface font-manrope font-bold text-sm py-2.5 rounded-full hover:bg-surface-highest/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">cached</span>
                  Flip Card
                </button>
                <button className="flex items-center justify-center gap-2 bg-tertiary text-white font-manrope font-bold text-sm py-2.5 rounded-full hover:bg-tertiary/90 transition-colors">
                  <span className="material-symbols-outlined ms-filled text-[18px]">check_circle</span>
                  Mark as Learned
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWordFlipped(false)}
                  className="flex items-center justify-center gap-1.5 border-2 border-outline-variant/40 text-on-surface font-manrope font-bold text-sm py-2.5 rounded-full hover:bg-surface-highest/40 transition-colors"
                >
                  Still Learning
                </button>
                <button className="flex items-center justify-center gap-1.5 bg-tertiary text-white font-manrope font-bold text-sm py-2.5 rounded-full hover:bg-tertiary/90 transition-colors">
                  Know It
                </button>
              </div>
            )}
          </div>

          {/* Weekly Leaderboard */}
          <div className="bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined ms-filled text-[20px] text-secondary">leaderboard</span>
                <h3 className="font-lexend font-semibold text-base text-on-surface">Weekly Leaderboard</h3>
              </div>
              <span className="font-manrope text-xs text-on-surface-variant">Resets in 2d</span>
            </div>

            <div className="space-y-1">
              {leaderboard.map((user) => (
                <div
                  key={user.rank}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl ${user.isYou ? "bg-tertiary/15" : ""}`}
                >
                  <span className="font-manrope font-bold text-sm text-on-surface-variant w-4 flex-shrink-0">{user.rank}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white font-lexend font-bold text-xs flex-shrink-0">
                    {user.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-manrope font-semibold text-sm truncate ${user.isYou ? "text-primary" : "text-on-surface"}`}>{user.name}</p>
                    <p className="font-manrope text-xs text-on-surface-variant">{user.level}</p>
                  </div>
                  <span className="font-manrope font-bold text-sm text-on-surface flex-shrink-0">{user.xp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
