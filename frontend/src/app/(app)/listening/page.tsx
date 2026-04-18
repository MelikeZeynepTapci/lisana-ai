"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";

const options = [
  "Unexpected heavy traffic downtown",
  "A technical issue with the train line",
  "Misplacement of car keys",
  "Bad weather conditions in the morning",
];

const waveBars = [35, 55, 70, 45, 80, 60, 90, 50, 75, 40, 65, 85, 55, 70, 45, 60, 75, 50];

export default function ListeningPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="page-transition">
      <Header title="Listening" />

      <div className="px-6 py-6 max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <p className="font-manrope font-bold text-xs uppercase tracking-widest text-tertiary mb-1">
              Listening Proficiency
            </p>
            <h2 className="font-lexend font-bold text-2xl sm:text-3xl text-on-surface">Test 3 of 10</h2>
          </div>
          <div className="sm:text-right">
            <p className="font-manrope text-xs text-on-surface-variant mb-2">
              Topic: <span className="font-semibold text-on-surface">Daily Routines</span>
            </p>
            <div className="w-full sm:w-40 bg-surface-highest rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: "30%" }} />
            </div>
            <p className="font-manrope text-[10px] text-on-surface-variant mt-1">30% complete</p>
          </div>
        </div>

        {/* Audio Card */}
        <div className="relative overflow-hidden bg-surface-lowest border border-outline-variant/60 rounded-4xl p-8 mb-6" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
          {/* Decorative blurs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-tertiary-container/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

          {/* Waveform */}
          <div className="relative z-10 flex items-end justify-center gap-1 h-20 mb-8">
            {waveBars.map((h, i) => (
              <div
                key={i}
                className={`w-2 rounded-full transition-all duration-300 ${isPlaying ? "wave-bar" : ""}`}
                style={{
                  height: `${h}%`,
                  backgroundColor: "#dbbdfd",
                  animationDelay: isPlaying ? `${i * 0.08}s` : "0s",
                }}
              />
            ))}
          </div>

          {/* Play Button */}
          <div className="relative z-10 flex flex-col items-center">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-20 h-20 rounded-full bg-tertiary-container border border-tertiary/20 flex items-center justify-center shadow-ambient hover:shadow-ambient-lg hover:scale-105 transition-all duration-300 mb-3"
            >
              <span className="material-symbols-outlined ms-filled text-[36px] text-tertiary">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
            <p className="font-manrope font-semibold text-sm text-on-surface">
              {isPlaying ? "Playing..." : "Press to Play Audio"}
            </p>
            <p className="font-manrope text-xs text-on-surface-variant mt-0.5">Approx 0:45 Duration</p>
          </div>
        </div>

        {/* Question */}
        <div className="bg-surface-lowest border border-outline-variant/60 rounded-4xl p-8 mb-6" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
          <h3 className="font-lexend font-bold text-xl text-on-surface mb-1">
            Based on the audio, what was the primary reason for the delay?
          </h3>
          <p className="font-manrope text-sm text-on-surface-variant mb-6">Select the most accurate response.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`flex items-center gap-3 p-4 rounded-3xl text-left transition-all duration-200 ${
                  selected === i
                    ? "bg-tertiary-container border-2 border-tertiary"
                    : "bg-surface border-2 border-outline-variant/60 hover:border-primary/30 hover:bg-primary-container/10"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    selected === i ? "border-tertiary bg-tertiary" : "border-outline-variant"
                  }`}
                >
                  {selected === i && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="font-manrope text-sm text-on-surface">{opt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between">
          <button className="font-manrope font-semibold text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-200">
            Skip for now
          </button>
          <button
            className={`flex items-center gap-2 px-8 py-3.5 rounded-full font-manrope font-bold text-sm transition-all duration-300 ${
              selected !== null
                ? "bg-gradient-to-r from-primary to-primary-dim text-white shadow-ambient hover:shadow-ambient-lg hover:scale-[1.02]"
                : "bg-surface-high border border-outline-variant/60 text-on-surface-variant cursor-not-allowed"
            }`}
          >
            <span>Submit Answer</span>
            <span className="material-symbols-outlined ms-filled text-[18px]">check_circle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
