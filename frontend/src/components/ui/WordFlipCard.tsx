"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  checkSentence,
  lookupText,
  updateWordProgress,
  saveItem,
  type SentenceCheckResult,
  type MistakeItem,
  type LookupData,
} from "@/lib/api";

interface WordFlipCardProps {
  wordId: string;
  word: string;
  partOfSpeech: string | null;
  language: string;
  level: string | null;
}

type KnownState = "idle" | "input" | "checking" | "result";
type LookupState = "idle" | "loading" | "done" | "error";

export default function WordFlipCard({
  wordId,
  word,
  partOfSpeech,
  language,
  level,
}: WordFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [knownState, setKnownState] = useState<KnownState>("idle");
  const [saved, setSaved] = useState(false);
  const [sentence, setSentence] = useState("");
  const [result, setResult] = useState<SentenceCheckResult | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);

  // Lookup (translation + example) fetched on first flip
  const [lookup, setLookup] = useState<LookupData | null>(null);
  const [lookupState, setLookupState] = useState<LookupState>("idle");

  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const resultPopoverRef = useRef<HTMLDivElement>(null);

  // Fetch translation+example when card is flipped for the first time
  useEffect(() => {
    if (!flipped || lookupState !== "idle") return;
    setLookupState("loading");
    lookupText(word, language)
      .then((data) => { setLookup(data); setLookupState("done"); })
      .catch(() => setLookupState("error"));
  }, [flipped]);

  function calcPopoverPos() {
    if (!cardRef.current) return null;
    const rect = cardRef.current.getBoundingClientRect();
    const popoverWidth = 360;
    const margin = 16;
    const idealLeft = rect.left + rect.width / 2 - popoverWidth / 2;
    return {
      x: Math.min(Math.max(idealLeft, margin), window.innerWidth - popoverWidth - margin),
      y: rect.top - 8,
    };
  }

  // Keep popover anchored to the card as the user scrolls — direct DOM manipulation
  useEffect(() => {
    if (knownState !== "result") return;
    function onScroll() {
      const pos = calcPopoverPos();
      if (pos && resultPopoverRef.current) {
        resultPopoverRef.current.style.left = `${pos.x}px`;
        resultPopoverRef.current.style.top = `${pos.y}px`;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [knownState]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!sentence.trim() || knownState === "checking") return;
    setKnownState("checking");
    try {
      const res = await checkSentence(word, sentence.trim(), language);
      setResult(res);
      setPopoverPos(calcPopoverPos());
      setKnownState("result");
    } catch {
      setKnownState("input");
    }
  }

  function handleClosePopover() {
    setPopoverPos(null);
    setResult(null);
    setKnownState("input");
    setSentence("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleKnowIt(e: React.MouseEvent) {
    e.stopPropagation();
    updateWordProgress(wordId, "known").catch(() => {});
    setKnownState("input");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    if (saved) return;
    setSaved(true);
    saveItem({ text: word, source_type: "vocab", language }).catch(() => setSaved(false));
  }

  function handleStillLearning(e: React.MouseEvent) {
    e.stopPropagation();
    updateWordProgress(wordId, "learning").catch(() => {});
    setFlipped(false);
  }

  return (
    <>
    <div ref={cardRef} className="rounded-3xl" style={{ perspective: "1200px" }}>
      <div
        onClick={() => knownState === "idle" && setFlipped((f) => !f)}
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.45, 0.05, 0.55, 0.95)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
          cursor: knownState === "idle" ? "pointer" : "default",
          minHeight: 380,
        }}
      >

        {/* ── FRONT ── */}
        <div
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          className="absolute inset-0 bg-surface-lowest border border-outline-variant/60 rounded-3xl p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined ms-filled text-[20px] text-secondary">menu_book</span>
              <h3 className="font-lexend font-semibold text-base text-on-surface">Word of the Day</h3>
            </div>
            {level && (
              <span className="font-manrope font-bold text-[11px] border border-outline-variant text-on-surface-variant px-2.5 py-0.5 rounded-full">
                {level}
              </span>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
            <h2 className="font-lora font-bold text-3xl text-on-surface mb-3">{word}</h2>
            {partOfSpeech && (
              <p className="font-manrope text-xs text-on-surface-variant">{partOfSpeech}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-on-surface-variant/40">
            <span className="material-symbols-outlined text-[14px]">touch_app</span>
            <span className="font-manrope text-[11px]">Click to reveal</span>
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          className="absolute inset-0 bg-surface-lowest border border-outline-variant/60 rounded-3xl p-6 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined ms-filled text-[20px] text-secondary">menu_book</span>
              <h3 className="font-lexend font-semibold text-base text-on-surface">Word of the Day</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className={`transition-colors ${saved ? "text-secondary" : "text-on-surface-variant/50 hover:text-secondary"}`}
                title={saved ? "Saved to collection" : "Save to collection"}
              >
                <span className={`material-symbols-outlined text-[18px] ${saved ? "ms-filled" : ""}`}>bookmark</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
                className="text-on-surface-variant/50 hover:text-on-surface transition-colors"
                title="Flip back"
              >
                <span className="material-symbols-outlined text-[18px]">flip</span>
              </button>
            </div>
          </div>

          <p className="font-lora font-semibold text-base text-on-surface mb-3">{word}</p>

          {/* Translation + Example */}
          <div className="flex-1 space-y-2">
            <div className="bg-surface border border-outline-variant/60 rounded-2xl p-3">
              <p className="font-manrope font-semibold text-[10px] text-on-surface-variant uppercase tracking-wide mb-1">Translation</p>
              {lookupState === "loading" ? (
                <p className="font-manrope text-sm text-on-surface-variant/50 animate-pulse">Loading…</p>
              ) : lookupState === "done" && lookup ? (
                <p className="font-manrope font-semibold text-sm text-on-surface">{lookup.definition}</p>
              ) : lookupState === "error" ? (
                <p className="font-manrope text-sm text-on-surface-variant/50">—</p>
              ) : null}
            </div>
            <div className="bg-surface border border-outline-variant/60 rounded-2xl p-3">
              <p className="font-manrope font-semibold text-[10px] text-on-surface-variant uppercase tracking-wide mb-1">Example</p>
              {lookupState === "loading" ? (
                <p className="font-manrope text-sm text-on-surface-variant/50 animate-pulse">Loading…</p>
              ) : lookupState === "done" && lookup?.example ? (
                <p className="font-manrope text-sm text-on-surface italic">&ldquo;{lookup.example}&rdquo;</p>
              ) : lookupState === "done" ? (
                <p className="font-manrope text-sm text-on-surface-variant/50">No example available.</p>
              ) : null}
            </div>
          </div>

          {/* Bottom section */}
          <div className="mt-4 space-y-3">

            {knownState === "idle" && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleStillLearning}
                  className="flex items-center justify-center gap-1.5 border border-outline-variant text-on-surface font-manrope font-bold text-sm py-2.5 rounded-full hover:bg-surface transition-colors"
                >
                  Still Learning
                </button>
                <button
                  onClick={handleKnowIt}
                  className="flex items-center justify-center gap-1.5 text-white font-manrope font-bold text-sm py-2.5 rounded-full transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #4ECBA8 0%, #2A9D7C 100%)", boxShadow: "0 4px 14px rgba(42,157,124,0.28)" }}
                >
                  <span className="material-symbols-outlined ms-filled text-[17px]">check_circle</span>
                  Know It
                </button>
              </div>
            )}

            {(knownState === "input" || knownState === "checking") && (
              <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="space-y-2">
                {knownState === "checking" ? (
                  <p className="font-manrope text-xs text-on-surface-variant italic animate-pulse">
                    Analyzing your sentence for feedback…
                  </p>
                ) : (
                  <p className="font-manrope text-xs text-on-surface-variant">
                    Write a sentence using <span className="font-semibold text-on-surface">{word}</span> to earn your daily 15 XP:
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={sentence}
                    onChange={(e) => setSentence(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    disabled={knownState === "checking"}
                    className="flex-1 font-manrope text-sm bg-surface border border-outline-variant/60 rounded-xl px-3 py-2 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 disabled:opacity-50 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!sentence.trim() || knownState === "checking"}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #A07DD6 0%, #7C5CBF 100%)" }}
                  >
                    {knownState === "checking"
                      ? <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      : <span className="material-symbols-outlined text-[16px]">send</span>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Correction popover — portal to body to escape any stacking context */}
    {knownState === "result" && result && popoverPos && typeof document !== "undefined" && createPortal(
      <div
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}
      >
        <div
          ref={resultPopoverRef}
          className="pointer-events-auto animate-fade-up [animation-duration:150ms] [animation-fill-mode:both]"
          style={{
            position: "absolute",
            left: popoverPos.x,
            top: popoverPos.y,
            transform: "translateY(-100%)",
          }}
        >
          <div
            className={`rounded-2xl shadow-xl overflow-hidden border ${
              result.correct
                ? "bg-tertiary-container border-tertiary/20"
                : "bg-amber-50 border-amber-200"
            }`}
            style={{ width: 360, maxHeight: 500, overflowY: "auto", boxShadow: "0 8px 32px rgba(27,31,59,0.20)" }}
          >
            {/* Header: feedback + XP + close */}
            <div className={`flex items-center justify-between gap-2 px-4 pt-3.5 pb-3 border-b ${result.correct ? "border-tertiary/20" : "border-amber-200/70"}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`material-symbols-outlined ms-filled text-[18px] flex-shrink-0 ${result.correct ? "text-tertiary" : "text-amber-500"}`}>
                  {result.correct ? "check_circle" : "tips_and_updates"}
                </span>
                <span className={`font-manrope font-semibold text-sm leading-snug ${result.correct ? "text-secondary" : "text-amber-800"}`}>
                  {result.feedback}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`font-manrope font-bold text-xs px-2 py-0.5 rounded-full ${
                  result.correct ? "bg-tertiary text-white" : "bg-amber-400 text-white"
                }`}>
                  +{result.xp} XP
                </span>
                <button
                  onClick={handleClosePopover}
                  className={`transition-colors ${result.correct ? "text-secondary/50 hover:text-secondary" : "text-amber-500 hover:text-amber-700"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Mistakes + corrected sentence */}
            {!result.correct && (
              <div className="px-4 py-3 space-y-3">
                {result.mistakes.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-manrope text-[10px] text-amber-600 uppercase tracking-wide font-semibold">
                      {result.mistakes.length === 1 ? "Mistake" : `${result.mistakes.length} Mistakes`}
                    </p>
                    {result.mistakes.map((m: MistakeItem, i: number) => (
                      <div key={i} className="bg-amber-100/70 rounded-xl px-3 py-2 space-y-0.5">
                        <p className="font-manrope text-sm text-amber-900 line-through opacity-70">
                          &ldquo;{m.location}&rdquo;
                        </p>
                        <p className="font-manrope text-xs text-amber-800 leading-relaxed">
                          {m.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {result.corrected && (
                  <div>
                    <p className="font-manrope text-[10px] text-amber-600 uppercase tracking-wide font-semibold mb-0.5">Correct version</p>
                    <p className="font-manrope text-sm text-amber-900 italic">&ldquo;{result.corrected}&rdquo;</p>
                  </div>
                )}
              </div>
            )}

            <div className="px-4 pb-3.5">
              <button
                onClick={handleClosePopover}
                className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-manrope font-bold text-sm transition-opacity hover:opacity-90 ${
                  result.correct ? "text-white" : "bg-amber-500 text-white"
                }`}
                style={result.correct ? { background: "linear-gradient(135deg, #4ECBA8 0%, #2A9D7C 100%)" } : {}}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {result.correct ? "check" : "refresh"}
                </span>
                {result.correct ? "Done" : "Try again"}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
