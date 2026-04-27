"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { saveItem, lookupText, speakText, type LookupData } from "@/lib/api";

interface SelectableTextProps {
  children: React.ReactNode;
  language: string;
  sourceType: "news" | "conversation";
  sourceId?: string;
  className?: string;
}

interface PopoverState {
  text: string;
  // viewport-fixed coordinates
  x: number;
  y: number;
}

type ActivePanel = "meaning" | "example" | "synonyms" | null;

export default function SelectableText({
  children,
  language,
  sourceType,
  sourceId,
  className,
}: SelectableTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const [playing, setPlaying] = useState(false);

  const dismiss = useCallback(() => {
    setPopover(null);
    setSaved(false);
    setSaving(false);
    setLookupData(null);
    setLookupLoading(false);
    setActivePanel(null);
    setPlaying(false);
    audioRef.current?.pause();
  }, []);

  // Keep popover anchored to the selection as the user scrolls — direct DOM
  // manipulation bypasses React re-render lag so there's no catch-up jitter.
  useEffect(() => {
    if (!popover) return;
    function onScroll() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (popoverRef.current) {
        popoverRef.current.style.left = `${rect.left + rect.width / 2}px`;
        popoverRef.current.style.top = `${rect.top - 8}px`;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [popover?.text]);

  // Dismiss on outside click
  useEffect(() => {
    if (!popover) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) return;
      dismiss();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popover, dismiss]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // Ignore synthetic mouseup events from scroll/drag — only act on real clicks
    if (e.detail === 0) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) { dismiss(); return; }
    const text = selection.toString().trim();
    if (!text || text.length < 2) { dismiss(); return; }

    // If the same text is already showing, don't reposition (e.g. trackpad scroll)
    if (popover && popover.text === text) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setPopover({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
    setSaved(false);
    setSaving(false);
    setLookupData(null);
    setLookupLoading(false);
    setActivePanel(null);
    setPlaying(false);
  }, [dismiss, popover]);

  const ensureLookup = useCallback(async (text: string): Promise<LookupData | null> => {
    if (lookupData) return lookupData;
    setLookupLoading(true);
    try {
      const data = await lookupText(text, language);
      setLookupData(data);
      return data;
    } catch {
      return null;
    } finally {
      setLookupLoading(false);
    }
  }, [lookupData, language]);

  const handlePanelClick = async (panel: ActivePanel) => {
    if (!popover) return;
    if (activePanel === panel) { setActivePanel(null); return; }
    setActivePanel(panel);
    await ensureLookup(popover.text);
  };

  const handleSpeak = async () => {
    if (!popover) return;
    if (playing) { audioRef.current?.pause(); setPlaying(false); return; }
    setPlaying(true);
    try {
      const buf = await speakText(popover.text, language);
      const blob = new Blob([buf], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.pause(); URL.revokeObjectURL(audioRef.current.src); }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setPlaying(false); URL.revokeObjectURL(url); };
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch { setPlaying(false); }
  };

  const handleSave = async () => {
    if (!popover || saving || saved) return;
    setSaving(true);
    try {
      await saveItem({ text: popover.text, source_type: sourceType, source_id: sourceId, language });
      setSaved(true);
      window.getSelection()?.removeAllRanges();
    } catch {
      // keep open so user can retry
    } finally {
      setSaving(false);
    }
  };

  const panelContent = (): React.ReactNode => {
    if (!activePanel) return null;
    if (lookupLoading) {
      return (
        <p
          className="text-xs bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent py-0.5"
          style={{ backgroundImage: "linear-gradient(90deg, #9ca3af 0%, #9ca3af 30%, #E8437A 50%, #F97316 60%, #9ca3af 70%, #9ca3af 100%)" }}
        >
          Loading...
        </p>
      );
    }
    if (!lookupData) return <p className="text-xs text-on-surface-variant/50">Couldn&apos;t load data.</p>;
    if (activePanel === "meaning") {
      return (
        <p className="text-xs text-on-surface leading-relaxed">
          {lookupData.part_of_speech && <span className="font-bold text-secondary mr-1.5">{lookupData.part_of_speech}</span>}
          {lookupData.definition}
        </p>
      );
    }
    if (activePanel === "example") {
      return lookupData.example
        ? <p className="text-xs text-on-surface leading-relaxed italic">&ldquo;{lookupData.example}&rdquo;</p>
        : <p className="text-xs text-on-surface-variant/50">No example available.</p>;
    }
    if (activePanel === "synonyms") {
      return lookupData.synonyms.length > 0
        ? (
          <div className="flex flex-wrap gap-1">
            {lookupData.synonyms.map((s) => (
              <span key={s} className="font-manrope text-[11px] bg-surface border border-outline-variant/60 text-on-surface px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )
        : <p className="text-xs text-on-surface-variant/50">No synonyms found.</p>;
    }
    return null;
  };

  const actions: { key: ActivePanel; label: string; icon: string }[] = [
    { key: "meaning",  label: "See meaning",      icon: "dictionary" },
    { key: "example",  label: "Example sentence", icon: "chat_bubble" },
    { key: "synonyms", label: "Synonyms",          icon: "compare_arrows" },
  ];

  return (
    <div
      ref={containerRef}
      className={`relative select-text ${className ?? ""}`}
      onMouseUp={(e) => handleMouseUp(e)}
    >
      {children}

      {popover && typeof document !== "undefined" && createPortal(
        /* Fixed full-viewport overlay — immune to any ancestor transform.
           The popover is absolutely positioned INSIDE this overlay,
           so its coords map 1:1 to viewport pixels and never scroll. */
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9999,
          }}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div
            ref={popoverRef}
            className="pointer-events-auto animate-fade-up [animation-duration:150ms] [animation-fill-mode:both]"
            style={{
              position: "absolute",
              left: popover.x,
              top: popover.y,
              transform: "translate(-50%, -100%)",
            }}
          >
          <div
            className="bg-surface border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden"
            style={{ minWidth: 180, maxWidth: 220, boxShadow: "0 8px 32px rgba(27,31,59,0.18)" }}
          >
            {/* Header */}
            <div className="px-3.5 pt-3 pb-2.5 border-b border-outline-variant/30">
              <p className="font-lora font-semibold text-sm text-on-surface truncate">
                &ldquo;{popover.text.length > 36 ? popover.text.slice(0, 36) + "…" : popover.text}&rdquo;
              </p>
            </div>

            {/* Action rows */}
            <div className="py-1">
              {actions.map(({ key, label, icon }) => (
                <div key={key}>
                  <button
                    onClick={() => handlePanelClick(key)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors text-sm font-manrope ${
                      activePanel === key
                        ? "text-primary bg-primary-container/40"
                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[16px] flex-shrink-0 ${activePanel === key ? "ms-filled text-primary" : ""}`}>
                      {icon}
                    </span>
                    <span className="flex-1">{label}</span>
                    {activePanel === key && lookupLoading ? (
                      <span className="material-symbols-outlined text-[14px] text-primary animate-spin">progress_activity</span>
                    ) : (
                      <span className={`material-symbols-outlined text-[14px] text-on-surface-variant/40 transition-transform ${activePanel === key ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    )}
                  </button>
                  {activePanel === key && (
                    <div className="px-3.5 pb-2.5 pt-1 bg-surface-lowest/60 border-t border-outline-variant/20">
                      {panelContent()}
                    </div>
                  )}
                </div>
              ))}

              {/* Pronunciation */}
              <button
                onClick={handleSpeak}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors text-sm font-manrope ${
                  playing ? "text-primary bg-primary-container/40" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] flex-shrink-0 ${playing ? "ms-filled text-primary" : ""}`}>
                  {playing ? "pause_circle" : "volume_up"}
                </span>
                <span className="flex-1">{playing ? "Playing…" : "Pronunciation"}</span>
              </button>
            </div>

            {/* Save */}
            <div className="border-t border-outline-variant/30 p-2.5">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl font-manrope font-bold text-sm transition-all ${
                  saved ? "bg-tertiary-container text-secondary cursor-default" : "text-white hover:opacity-90 disabled:opacity-50"
                }`}
                style={saved ? {} : { background: "linear-gradient(135deg, #A07DD6 0%, #7C5CBF 100%)", boxShadow: "0 3px 12px rgba(124,92,191,0.30)" }}
              >
                {saving ? (
                  <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Saving…</>
                ) : saved ? (
                  <><span className="material-symbols-outlined ms-filled text-[16px]">check_circle</span>Saved</>
                ) : (
                  <><span className="material-symbols-outlined ms-filled text-[16px]">bookmark_add</span>Save</>
                )}
              </button>
            </div>
          </div>
        </div>
        </div>,
        document.body
      )}
    </div>
  );
}
