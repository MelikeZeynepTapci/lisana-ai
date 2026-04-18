"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";

const topics = [
  { label: "Nouns", icon: "category", iconBg: "bg-secondary-container", iconColor: "text-secondary", active: false },
  { label: "Verbs", icon: "motion_photos_on", iconBg: "bg-primary-container", iconColor: "text-primary", active: true },
  { label: "Tenses", icon: "schedule", iconBg: "bg-tertiary-container", iconColor: "text-tertiary", active: false },
  { label: "Adjectives", icon: "description", iconBg: "bg-surface-highest", iconColor: "text-on-surface-variant", active: false },
];

const modules = [
  {
    icon: "repeat",
    iconBg: "bg-tertiary",
    title: "Reflexive Verbs",
    desc: "Daily routines and actions done to oneself",
    progress: 70,
    progressColor: "text-tertiary",
    strokeColor: "#22705f",
    btn: "Continue",
    btnStyle: "bg-surface-high border border-outline-variant/60 text-on-surface",
  },
  {
    icon: "history",
    iconBg: "bg-primary",
    title: "The Preterite",
    desc: "Mastering completed actions in the past tense",
    progress: 20,
    progressColor: "text-primary",
    strokeColor: "#725991",
    btn: "Resume",
    btnStyle: "bg-surface-high border border-outline-variant/60 text-on-surface",
  },
  {
    icon: "psychology",
    iconBg: "bg-secondary",
    title: "Subjunctive Mood",
    desc: "Expressing desires, doubts, and the unknown",
    progress: 0,
    progressColor: "text-secondary",
    strokeColor: "#8c5900",
    btn: "Start Lesson",
    btnStyle: "bg-secondary-container border border-secondary/20 text-secondary",
  },
];

function CircleProgress({ value, stroke, size = 56 }: { value: number; stroke: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7edb1" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={5}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  );
}

export default function GrammarPage() {
  const [answer, setAnswer] = useState("");

  return (
    <div className="page-transition">
      <Header title="Grammar Mastery" />

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left: Topics + Main Exercise */}
          <div className="xl:col-span-8 space-y-6">
            {/* Active Exercise Card */}
            <div className="bg-surface-lowest border border-outline-variant/60 rounded-4xl p-6 sm:p-8" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
              {/* Badge */}
              <div className="inline-flex mb-3 bg-tertiary-container px-3 py-1 rounded-full">
                <span className="font-manrope font-bold text-xs text-tertiary uppercase tracking-wide">Active Lesson</span>
              </div>

              <h2 className="font-lexend font-bold text-2xl sm:text-3xl text-on-surface mb-2">Ser vs. Estar</h2>
              <p className="font-manrope text-sm text-on-surface-variant mb-8 leading-relaxed">
                Master the fundamental distinction between permanent traits and temporary states in Spanish.
              </p>

              {/* Fill in the blank */}
              <div className="bg-surface border border-outline-variant/60 rounded-3xl p-6 mb-6">
                <p className="font-manrope text-xs text-on-surface-variant uppercase tracking-widest mb-3">
                  Fill in the blank
                </p>
                <div className="flex items-baseline gap-2 flex-wrap font-lexend text-2xl font-semibold text-on-surface">
                  <span>Yo</span>
                  <div className="relative inline-flex items-end pb-1">
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="____"
                      className="bg-transparent border-b-2 border-primary focus:border-tertiary outline-none font-lexend font-semibold text-2xl text-on-surface placeholder-on-surface-variant/40 text-center w-28 transition-colors duration-200"
                    />
                  </div>
                  <span>cansado.</span>
                  <span className="font-manrope text-sm text-on-surface-variant font-normal">(ser/estar)</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dim text-white font-manrope font-bold px-8 py-3.5 rounded-full shadow-ambient hover:shadow-ambient-lg hover:scale-[1.02] transition-all duration-300">
                  <span className="material-symbols-outlined ms-filled text-[18px]">send</span>
                  Submit Answer
                </button>
                <button className="font-manrope font-semibold text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200">
                  Skip for now
                </button>
              </div>
            </div>

            {/* AI Tutor + Topics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Topics */}
              <div className="sm:col-span-1 bg-surface-lowest border border-outline-variant/60 rounded-4xl p-5" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
                <p className="font-lexend font-semibold text-sm text-on-surface mb-4">Library</p>
                <div className="space-y-2">
                  {topics.map((t, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                        t.active ? "ring-2 ring-primary bg-primary-container/30" : "hover:bg-surface"
                      }`}
                    >
                      <div className={`w-9 h-9 ${t.iconBg} rounded-xl flex items-center justify-center`}>
                        <span className={`material-symbols-outlined ms-filled text-[18px] ${t.iconColor}`}>{t.icon}</span>
                      </div>
                      <span className="font-manrope font-semibold text-sm text-on-surface flex-1">{t.label}</span>
                      {t.active && (
                        <span className="material-symbols-outlined text-[16px] text-primary">chevron_right</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Tutor */}
              <div className="sm:col-span-2 bg-surface-lowest border border-outline-variant/60 border-t-4 border-t-tertiary rounded-4xl p-5" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined ms-filled text-[22px] text-tertiary">auto_awesome</span>
                  <p className="font-lexend font-semibold text-base text-on-surface">AI Grammar Tutor</p>
                </div>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed mb-4">
                  Think about the <strong className="text-on-surface">nature of the state</strong>. Being &ldquo;tired&rdquo; (cansado) is a temporary condition that changes over time.
                </p>
                <div className="bg-surface border border-dashed border-outline-variant rounded-2xl p-4 mb-5">
                  <p className="font-manrope text-xs text-on-surface-variant mb-1">
                    <strong className="text-on-surface">Tip:</strong> Use{" "}
                    <strong className="text-tertiary">Estar</strong> for:
                  </p>
                  <p className="font-manrope text-xs text-on-surface font-bold">
                    P.L.A.C.E — Position, Location, Action, Condition, Emotion
                  </p>
                </div>
                <div className="border-t border-outline-variant/50 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-manrope text-xs text-on-surface-variant">Today&apos;s Hint Limit</p>
                    <p className="font-manrope font-bold text-xs text-tertiary">4/10</p>
                  </div>
                  <div className="w-full bg-surface-highest rounded-full h-1.5">
                    <div className="bg-tertiary h-1.5 rounded-full" style={{ width: "40%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Recommended Modules */}
          <div className="xl:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-lexend font-semibold text-base text-on-surface">Recommended Modules</h3>
              <button className="font-manrope text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
                View All
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
            {modules.map((m, i) => (
              <div key={i} className="bg-surface-lowest border border-outline-variant/60 rounded-4xl p-5 hover:shadow-ambient transition-all duration-200" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
                <div className="flex items-start gap-4 mb-3">
                  <div className="relative flex-shrink-0">
                    <CircleProgress value={m.progress} stroke={m.strokeColor} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-8 h-8 ${m.iconBg} rounded-xl flex items-center justify-center`}>
                        <span className="material-symbols-outlined ms-filled text-[16px] text-white">{m.icon}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-manrope font-bold text-sm text-on-surface">{m.title}</p>
                      <span className={`font-manrope font-bold text-xs ${m.progressColor}`}>{m.progress}%</span>
                    </div>
                    <p className="font-manrope text-xs text-on-surface-variant mt-1 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
                <button className={`w-full py-2.5 rounded-full font-manrope font-bold text-xs ${m.btnStyle} hover:opacity-90 transition-opacity duration-200`}>
                  {m.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
