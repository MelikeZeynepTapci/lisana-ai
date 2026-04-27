"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/layout/Header";
import {
  getSavedItems,
  getSavedItem,
  deleteSavedItem,
  speakText,
  lookupText,
  type SavedItemData,
  type LookupData,
} from "@/lib/api";

type FilterType = "all" | "news" | "conversation";

const FILTER_TABS: { key: FilterType; label: string; icon: string }[] = [
  { key: "all",          label: "All",          icon: "bookmarks" },
  { key: "news",         label: "News",         icon: "newspaper" },
  { key: "conversation", label: "Conversation", icon: "forum" },
];

type ActivePanel = "meaning" | "example" | "synonyms" | null;

function textCategory(text: string): string {
  const words = text.trim().split(/\s+/).length;
  if (words === 1) return "Word";
  if (words <= 6) return "Phrase";
  return "Sentence";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Per-card interactive panels ───────────────────────────────────────────────

function SavedCard({
  item,
  onDelete,
}: {
  item: SavedItemData;
  onDelete: (id: string) => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [synonyms, setSynonyms] = useState<string[] | null>(null);
  const [synonymsLoading, setSynonymsLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePanelClick = async (panel: ActivePanel) => {
    if (activePanel === panel) { setActivePanel(null); return; }
    setActivePanel(panel);
    if (panel === "synonyms" && synonyms === null && !synonymsLoading) {
      setSynonymsLoading(true);
      try {
        const data: LookupData = await lookupText(item.text, item.language);
        setSynonyms(data.synonyms);
      } catch {
        setSynonyms([]);
      } finally {
        setSynonymsLoading(false);
      }
    }
  };

  const handleSpeak = async () => {
    if (playing) { audioRef.current?.pause(); setPlaying(false); return; }
    setPlaying(true);
    try {
      const buf = await speakText(item.text, item.language);
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

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteSavedItem(item.id); onDelete(item.id); }
    catch { setDeleting(false); }
  };

  const isDone = item.enrichment_status === "done";
  const isPending = item.enrichment_status === "pending";

  const panelRows: { key: ActivePanel; label: string; icon: string; available: boolean }[] = [
    { key: "meaning",  label: "See meaning",      icon: "dictionary",      available: isDone && !!item.definition },
    { key: "example",  label: "Example sentence",  icon: "chat_bubble",     available: isDone && !!item.example },
    { key: "synonyms", label: "Synonyms",           icon: "compare_arrows",  available: isDone },
  ];

  return (
    <div
      className="bg-surface-lowest border border-outline-variant/60 rounded-3xl overflow-hidden transition-shadow hover:shadow-ambient"
      style={{ boxShadow: "0 1px 4px rgba(27,31,59,0.06)" }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <span className="font-manrope font-bold text-[10px] uppercase tracking-widest text-on-surface-variant bg-surface border border-outline-variant/60 px-2 py-0.5 rounded-full">
          {textCategory(item.text)}
        </span>
        <span className="font-manrope text-[10px] text-on-surface-variant/50">
          {item.source_type === "news" ? "News" : "Conversation"} · {item.language}
        </span>
        <span className="font-manrope text-[10px] text-on-surface-variant/40 ml-auto">
          {timeAgo(item.created_at)}
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Remove"
          className="text-on-surface-variant/35 hover:text-error transition-colors disabled:opacity-30 ml-1"
        >
          <span className="material-symbols-outlined text-[17px]">
            {deleting ? "progress_activity" : "delete"}
          </span>
        </button>
      </div>

      {/* Saved text */}
      <div className="px-5 pb-3">
        <p className="font-lora font-semibold text-base text-on-surface leading-snug">
          &ldquo;{item.text}&rdquo;
        </p>
      </div>

      {/* Enrichment pending shimmer */}
      {isPending && (
        <div className="flex items-center gap-2 px-5 pb-4">
          <span className="material-symbols-outlined text-[13px] text-on-surface-variant/30 animate-spin">progress_activity</span>
          <span
            className="font-manrope text-xs bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, #9ca3af 0%, #9ca3af 30%, #E8437A 50%, #F97316 60%, #9ca3af 70%, #9ca3af 100%)" }}
          >
            Enriching…
          </span>
        </div>
      )}

      {/* Interactive panels */}
      {isDone && (
        <div className="border-t border-outline-variant/30">
          {panelRows.map(({ key, label, icon, available }) => (
            <div key={key}>
              <button
                onClick={() => available && handlePanelClick(key)}
                disabled={!available}
                className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-left text-sm font-manrope transition-colors border-b border-outline-variant/20 last:border-b-0 ${
                  !available
                    ? "text-on-surface-variant/30 cursor-default"
                    : activePanel === key
                    ? "text-primary bg-primary-container/30"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
                }`}
              >
                <span className={`material-symbols-outlined text-[16px] flex-shrink-0 ${activePanel === key ? "ms-filled text-primary" : ""}`}>
                  {icon}
                </span>
                <span className="flex-1">{label}</span>
                {available && (
                  activePanel === key && synonymsLoading && key === "synonyms" ? (
                    <span className="material-symbols-outlined text-[14px] text-primary animate-spin">progress_activity</span>
                  ) : (
                    <span className={`material-symbols-outlined text-[14px] text-on-surface-variant/40 transition-transform ${activePanel === key ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  )
                )}
              </button>

              {activePanel === key && (
                <div className="px-5 py-3 bg-surface-lowest/60 border-b border-outline-variant/20">
                  {key === "meaning" && (
                    <p className="font-manrope text-sm text-on-surface leading-relaxed">
                      {item.part_of_speech && (
                        <span className="font-bold text-secondary mr-1.5">{item.part_of_speech}</span>
                      )}
                      {item.definition}
                    </p>
                  )}
                  {key === "example" && (
                    <p className="font-manrope text-sm text-on-surface leading-relaxed italic">
                      &ldquo;{item.example}&rdquo;
                    </p>
                  )}
                  {key === "synonyms" && (
                    synonymsLoading ? (
                      <p
                        className="font-manrope text-xs bg-[length:200%_auto] animate-text-shimmer bg-clip-text text-transparent"
                        style={{ backgroundImage: "linear-gradient(90deg, #9ca3af 0%, #9ca3af 30%, #E8437A 50%, #F97316 60%, #9ca3af 70%, #9ca3af 100%)" }}
                      >
                        Loading…
                      </p>
                    ) : synonyms && synonyms.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {synonyms.map((s) => (
                          <span key={s} className="font-manrope text-xs bg-surface border border-outline-variant/60 text-on-surface px-2.5 py-0.5 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="font-manrope text-xs text-on-surface-variant/50">No synonyms found.</p>
                    )
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pronunciation row */}
          <button
            onClick={handleSpeak}
            className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-left text-sm font-manrope transition-colors ${
              playing ? "text-primary bg-primary-container/30" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-high"
            }`}
          >
            <span className={`material-symbols-outlined text-[16px] flex-shrink-0 ${playing ? "ms-filled text-primary" : ""}`}>
              {playing ? "pause_circle" : "volume_up"}
            </span>
            <span className="flex-1">{playing ? "Playing…" : "Hear pronunciation"}</span>
          </button>
        </div>
      )}

      {/* Enrichment failed */}
      {item.enrichment_status === "failed" && (
        <p className="px-5 pb-4 font-manrope text-xs text-error/60">Couldn&apos;t load enrichment data.</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CollectionPage() {
  const [items, setItems] = useState<SavedItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const pollTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const fetchItems = useCallback(async () => {
    try {
      const data = await getSavedItems(filter === "all" ? undefined : filter);
      setItems(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchItems();
  }, [fetchItems]);

  // Poll pending items
  useEffect(() => {
    items.filter((i) => i.enrichment_status === "pending").forEach((item) => {
      if (pollTimers.current.has(item.id)) return;
      const poll = async () => {
        try {
          const updated = await getSavedItem(item.id);
          if (updated.enrichment_status !== "pending") {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            pollTimers.current.delete(item.id);
          } else {
            pollTimers.current.set(item.id, setTimeout(poll, 2500));
          }
        } catch { pollTimers.current.delete(item.id); }
      };
      pollTimers.current.set(item.id, setTimeout(poll, 2500));
    });
    return () => { pollTimers.current.forEach((t) => clearTimeout(t)); pollTimers.current.clear(); };
  }, [items]);

  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <>
      <Header />
      <div className="page-transition px-6 py-6 max-w-3xl mx-auto">

        <div className="mb-6">
          <h1 className="font-lora font-bold text-3xl text-on-surface">My Collection</h1>
          <p className="font-manrope text-sm text-on-surface-variant mt-1">
            Words, phrases, and sentences you&apos;ve saved while reading and practicing.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-manrope font-semibold text-sm whitespace-nowrap transition-all duration-200 ${
                filter === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-lowest border border-outline-variant/60 text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
              }`}
            >
              <span className={`material-symbols-outlined text-[16px] ${filter === tab.key ? "ms-filled" : ""}`}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
          {items.length > 0 && (
            <span className="ml-auto flex items-center font-manrope text-xs text-on-surface-variant whitespace-nowrap self-center pr-1">
              {items.length} saved
            </span>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-surface-lowest border border-outline-variant/60 rounded-3xl p-5 animate-pulse">
                <div className="h-4 bg-surface-highest rounded-full w-2/3 mb-3" />
                <div className="h-3 bg-surface-highest rounded-full w-full mb-2" />
                <div className="h-3 bg-surface-highest rounded-full w-4/5" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/25">bookmarks</span>
            <p className="font-manrope font-semibold text-base text-on-surface-variant text-center">
              {filter === "all" ? "Nothing saved yet" : `No ${filter} saves yet`}
            </p>
            <p className="font-manrope text-sm text-on-surface-variant/70 text-center max-w-xs">
              Select any text in a news article or conversation and tap &ldquo;Save&rdquo; to build your collection.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <SavedCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
