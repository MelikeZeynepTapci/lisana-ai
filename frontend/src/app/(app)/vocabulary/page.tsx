"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";

const collections = [
  {
    icon: "restaurant",
    iconBg: "bg-tertiary-container",
    iconColor: "text-tertiary",
    title: "Food & Drinks",
    meta: "42 words",
    status: "85% Mastered",
    statusColor: "text-tertiary",
    active: false,
  },
  {
    icon: "flight",
    iconBg: "bg-primary-container",
    iconColor: "text-primary",
    title: "Travel Essentials",
    meta: "30 words",
    status: "Review Needed",
    statusColor: "text-secondary",
    active: true,
  },
  {
    icon: "work",
    iconBg: "bg-surface-highest",
    iconColor: "text-on-surface-variant",
    title: "Office & Career",
    meta: "15 words",
    status: "New",
    statusColor: "text-on-surface-variant",
    active: false,
  },
];

export default function VocabularyPage() {
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [learning, setLearning] = useState(0);

  function handleKnow() {
    setKnown((k) => k + 1);
    setFlipped(false);
  }

  function handleLearning() {
    setLearning((l) => l + 1);
    setFlipped(false);
  }

  return (
    <div className="page-transition">
      <Header title="Vocabulary Mastery" />

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Collections Picker */}
          <div className="lg:col-span-3">
            <h3 className="font-lexend font-bold text-base text-on-surface mb-3">Collections</h3>
            <div className="flex lg:flex-col gap-3 overflow-x-auto pb-1 lg:pb-0 -mx-6 px-6 lg:mx-0 lg:px-0">
              {collections.map((c, i) => (
                <div
                  key={i}
                  className={`rounded-3xl p-4 cursor-pointer transition-all duration-200 flex-shrink-0 lg:flex-shrink w-60 lg:w-auto ${
                    c.active
                      ? "bg-surface-lowest border-2 border-primary shadow-ambient-sm"
                      : "bg-surface border-2 border-outline-variant/60 hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 ${c.iconBg} rounded-2xl flex items-center justify-center`}>
                      <span className={`material-symbols-outlined ms-filled text-[20px] ${c.iconColor}`}>{c.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-manrope font-semibold text-sm text-on-surface">{c.title}</p>
                      <p className="font-manrope text-xs text-on-surface-variant">{c.meta}</p>
                    </div>
                  </div>
                  <p className={`font-manrope font-bold text-xs ${c.statusColor}`}>{c.status}</p>
                </div>
              ))}
            </div>

            {/* Daily Goal */}
            <div className="bg-surface-lowest border border-outline-variant/60 rounded-3xl p-4 mt-4" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
              <p className="font-lexend font-semibold text-sm text-on-surface mb-3">Daily Goal</p>
              <div className="w-full bg-surface-highest rounded-full h-2.5 mb-2">
                <div className="bg-tertiary h-2.5 rounded-full" style={{ width: "75%" }} />
              </div>
              <p className="font-manrope text-xs text-on-surface-variant">
                <span className="font-bold text-on-surface">15/20</span> words reviewed today. Keep it up!
              </p>
            </div>
          </div>

          {/* Flashcard Area */}
          <div className="lg:col-span-9 space-y-5">
            {/* The Card */}
            <div
              className="relative overflow-hidden bg-surface-lowest border border-outline-variant/60 rounded-4xl cursor-pointer select-none"
              style={{ aspectRatio: "4/3", maxHeight: "380px", boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}
              onClick={() => setFlipped(!flipped)}
            >
              {/* Decorative blurs */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-container/40 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-tertiary-container/30 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

              <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
                {!flipped ? (
                  <>
                    <p className="font-manrope text-xs font-semibold text-primary/60 uppercase tracking-widest mb-6">
                      Word 14 of 30
                    </p>
                    <h2 className="font-lexend font-bold text-4xl sm:text-6xl text-on-surface mb-3">die Bibliothek</h2>
                    <p className="font-manrope text-sm text-on-surface-variant mb-8">Noun • German</p>
                    <button className="flex items-center gap-2 bg-primary-container hover:bg-primary-container/70 border border-primary/20 text-primary px-5 py-2.5 rounded-full shadow-ambient-sm transition-all duration-200">
                      <span className="material-symbols-outlined ms-filled text-[18px]">cached</span>
                      <span className="font-manrope font-semibold text-sm">Flip Card</span>
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-manrope text-xs font-semibold text-tertiary uppercase tracking-widest mb-4">
                      Translation
                    </p>
                    <h2 className="font-lexend font-bold text-3xl sm:text-5xl text-on-surface mb-2">The Library</h2>
                    <p className="font-manrope text-sm text-on-surface-variant mb-2">A place where books are kept</p>
                    <div className="mt-4 bg-surface border border-outline-variant/60 rounded-2xl px-6 py-3">
                      <p className="font-manrope text-sm text-on-surface-variant italic">
                        &ldquo;Ich gehe jede Woche in die <span className="text-primary font-semibold">Bibliothek</span>.&rdquo;
                      </p>
                      <p className="font-manrope text-xs text-on-surface-variant mt-1">I go to the library every week.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleLearning}
                className="flex items-center justify-center gap-2 bg-secondary-container border border-secondary/20 text-secondary font-manrope font-bold py-4 rounded-4xl shadow-ambient-sm hover:shadow-ambient active:scale-95 transition-all duration-200"
              >
                <span className="material-symbols-outlined ms-filled text-[20px]">refresh</span>
                Still learning
                {learning > 0 && <span className="text-xs opacity-70">({learning})</span>}
              </button>
              <button
                onClick={handleKnow}
                className="flex items-center justify-center gap-2 bg-tertiary text-white font-manrope font-bold py-4 rounded-4xl shadow-ambient-sm hover:shadow-ambient active:scale-95 transition-all duration-200"
              >
                <span className="material-symbols-outlined ms-filled text-[20px]">check_circle</span>
                Know it!
                {known > 0 && <span className="text-xs opacity-70">({known})</span>}
              </button>
            </div>

            {/* Retention Progress */}
            <div className="bg-surface-lowest border border-outline-variant/60 rounded-4xl p-5" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-manrope font-semibold text-sm text-on-surface">Retention Progress</p>
                  <p className="font-manrope text-xs text-on-surface-variant mt-0.5">Next review in 4 days</p>
                </div>
                <span className="font-lexend font-bold text-2xl text-tertiary">78%</span>
              </div>
              <div className="w-full bg-surface-highest rounded-full h-2">
                <div className="bg-tertiary h-2 rounded-full transition-all duration-500" style={{ width: "78%" }} />
              </div>
            </div>

            {/* Usage Hint + Pronunciation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-surface-lowest border border-outline-variant/60 rounded-3xl p-5" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined ms-filled text-[20px] text-primary">translate</span>
                  <p className="font-manrope font-semibold text-sm text-on-surface">Usage Hint</p>
                </div>
                <p className="font-manrope text-xs text-on-surface-variant leading-relaxed">
                  Always feminine with the article <span className="font-semibold text-on-surface">&ldquo;die&rdquo;</span>. Not to be confused with{" "}
                  <span className="font-semibold text-on-surface">&ldquo;die Buchhandlung&rdquo;</span> (bookstore).
                </p>
              </div>
              <div className="bg-surface-lowest border border-outline-variant/60 rounded-3xl p-5" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined ms-filled text-[20px] text-secondary">record_voice_over</span>
                  <p className="font-manrope font-semibold text-sm text-on-surface">Pronunciation</p>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <button className="w-9 h-9 rounded-full bg-primary-container border border-primary/20 flex items-center justify-center shadow-ambient-sm hover:bg-primary-container/80 transition-colors">
                    <span className="material-symbols-outlined ms-filled text-[18px] text-primary">play_arrow</span>
                  </button>
                  <div>
                    <p className="font-manrope text-xs font-semibold text-on-surface">/diː ˌbɪblioˈteːk/</p>
                    <p className="font-manrope text-[10px] text-on-surface-variant">Standard German</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
