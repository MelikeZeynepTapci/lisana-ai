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

const SAMPLE_RATE = 24000;

// ─── Mock data for ?preview=1 ─────────────────────────────────────────────────

const MOCK_FEEDBACK: Feedback = {
  maya_summary: {
    headline: "You stayed engaged and sounded natural",
    body: `When you said **"Ich interessiere mich für Sprachen"**, that's a native-level phrase — most learners just say "Ich mag Sprachen". You also recovered well mid-sentence with **"Entschuldigung, ich meine..."** — that kind of self-correction shows real confidence. The main thing to work on is **Perfekt tense** structure so your answers feel as smooth as your vocabulary already does.`,
  },
  what_went_well: [
    "You stayed engaged and sounded natural",
    "You used memorable phrases and kept the conversation moving.",
  ],
  watch_out_for: [
    {
      topic: "Perfekt tense",
      said: "Ich viele gegessen heute.",
      better: "Ich habe heute viel gegessen.",
      note: "Remember the helper verb in position 2, with the past participle at the end. This was the most important correction in the session.",
      examples: [
        { correct: true,  text: "Ich habe Kaffee getrunken." },
        { correct: true,  text: "Sie sind nach Hause gegangen." },
        { correct: false, text: "Ich Kaffee getrunken heute." },
      ],
    },
    {
      topic: "Word order",
      said: "Ich spiele Videospiele gerne und ich spazieren gegangen.",
      better: "Ich spiele gerne Videospiele und gehe spazieren.",
      note: "You had the right idea, but some sentences became less natural because key words landed in the wrong position.",
    },
  ],
  alternatives: [
    { instead: "Das ist gut.", try: ["Das klingt super!", "Das freut mich!"] },
    { instead: "Ich verstehe nicht.", try: ["Wie bitte?", "Könnten Sie das wiederholen?"] },
  ],
  quiz: {
    topic: "Perfekt Tense",
    question: "Which sentence is correct?",
    options: [
      { id: 1, text: "Ich gegessen viel heute.",       correct: false },
      { id: 2, text: "Ich habe heute viel gegessen.",  correct: true  },
      { id: 3, text: "Ich viel habe gegessen heute.",  correct: false },
    ],
    explanation: "Correct! Haben goes to position 2, and the past participle moves to the end.",
  },
  useful_phrases: ["Ich interessiere mich für Sprachen.", "Das klingt interessant!"],
  one_tip: "Pause briefly before answering to give yourself time to form the full sentence — especially with Perfekt tense.",
  next_session: "Practice the Perfekt tense — try a scenario where you describe what you did yesterday.",
};


// ─── Maya Avatar (active session) ─────────────────────────────────────────────

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
        micState === "playing"    ? "bg-primary/15" :
        micState === "recording"  ? "bg-error/10" :
        micState === "processing" ? "bg-surface-highest" :
        "bg-primary-container/40"
      }`}>
        <span className={`material-symbols-outlined ms-filled text-[40px] transition-colors duration-300 ${
          micState === "playing"    ? "text-primary" :
          micState === "recording"  ? "text-error" :
          micState === "processing" ? "text-on-surface-variant" :
          "text-primary"
        }`}>
          {micState === "processing" ? "hourglass_top" : "smart_toy"}
        </span>
      </div>
    </div>
  );
}

// ─── Rich text renderer (**bold** markers → <strong>) ────────────────────────

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
              <span className="font-manrope text-xs text-on-surface-variant line-through">&ldquo;{item.said}&rdquo;</span>
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
        {quiz.options.map((opt) => {
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

// ─── Feedback Card ────────────────────────────────────────────────────────────

function FeedbackCard({
  feedback,
  turnCount,
  softCap,
  onNext,
}: {
  feedback: Feedback;
  turnCount: number;
  softCap: number;
  onNext: () => void;
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
  const hasQuiz     = !!feedback.quiz;
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
          <button
            onClick={onNext}
            className="font-manrope text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Back to sessions
          </button>
          <button
            onClick={onNext}
            className="font-manrope text-sm font-semibold text-white bg-primary px-4 py-2 rounded-full hover:bg-primary/90 transition-colors flex items-center gap-1"
          >
            Continue learning
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </nav>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

          {/* Hero + Metrics */}
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 font-manrope text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full mb-3">
                🏆 Session complete
              </span>
              <h1 className="font-lexend font-bold text-2xl text-on-surface leading-snug mb-2">
                Conversation feedback
              </h1>
              <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">
                Here are the most important moments from your session — the highlights, the corrections, and what to try next.
              </p>
            </div>

            {/* Metrics card */}
            <div className="flex-shrink-0 bg-white border border-outline-variant/20 rounded-2xl p-4 min-w-[148px] space-y-1">
              <div className="flex items-center justify-between py-1.5 border-b border-outline-variant/10">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant">timer</span>
                  <span className="font-manrope text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">Turns</span>
                </div>
                <span className="font-lexend font-bold text-lg text-on-surface">{turnCount}<span className="text-sm font-normal text-on-surface-variant">/{softCap}</span></span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-outline-variant/10">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant">error_outline</span>
                  <span className="font-manrope text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">Errors</span>
                </div>
                <span className={`font-lexend font-bold text-lg ${errors.length > 2 ? "text-amber-500" : "text-on-surface"}`}>{errors.length}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant">star</span>
                  <span className="font-manrope text-[11px] font-semibold text-on-surface-variant uppercase tracking-wide">XP</span>
                </div>
                <span className="font-lexend font-bold text-lg text-primary">+{xpEarned}</span>
              </div>
            </div>
          </div>

          {/* Maya's Summary */}
          {(feedback.maya_summary || feedback.what_went_well?.length > 0) && (
            <div className="bg-white border border-outline-variant/20 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)" }}>
                  <span className="material-symbols-outlined ms-filled text-[22px] text-white">smart_toy</span>
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

          {/* Watch out for + Quiz (2-col) */}
          {(hasWatchOut || hasQuiz) && (
            <div className={`grid gap-4 ${hasWatchOut && hasQuiz ? "grid-cols-2" : "grid-cols-1"}`}>

              {/* Watch out for */}
              {hasWatchOut && (
                <div className="bg-white border border-outline-variant/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="material-symbols-outlined text-[16px] text-amber-500">warning</span>
                        <h3 className="font-lexend font-semibold text-base text-on-surface">Watch out for 🔍</h3>
                      </div>
                      <p className="font-manrope text-xs text-on-surface-variant leading-relaxed">
                        Only the most valuable corrections, shown like expandable notes.
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

              {/* Quiz */}
              {hasQuiz && (
                <div className="bg-white border border-outline-variant/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">timer</span>
                    <h3 className="font-lexend font-semibold text-base text-on-surface">Quick check quiz 🧩</h3>
                  </div>
                  <p className="font-manrope text-xs text-on-surface-variant mb-4">
                    Short and optional — just one quick reinforcement.
                  </p>
                  <QuizSection quiz={feedback.quiz!} />
                </div>
              )}
            </div>
          )}

          {/* You could have said */}
          {hasAlts && (
            <div className="bg-white border border-outline-variant/20 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
                  </div>
                  <div>
                    <h3 className="font-lexend font-semibold text-base text-on-surface">You could have said 💬</h3>
                    <p className="font-manrope text-xs text-on-surface-variant mt-0.5">
                      Only a few replacements, so it stays easy to remember.
                    </p>
                  </div>
                </div>
                <span className="font-manrope text-xs text-on-surface-variant bg-surface-highest/60 px-2 py-0.5 rounded-full flex-shrink-0">
                  {alternatives.length} {alternatives.length === 1 ? "idea" : "ideas"}
                </span>
              </div>
              <div className="mt-4 space-y-4">
                {alternatives.map((alt, i) => (
                  <div key={i} className={i > 0 ? "pt-4 border-t border-outline-variant/10" : ""}>
                    <p className="font-manrope text-xs text-on-surface-variant mb-2">
                      Instead of <span className="font-medium text-on-surface">&ldquo;{alt.instead}&rdquo;</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {alt.try.map((t, j) => (
                        <span
                          key={j}
                          className="font-manrope text-sm text-on-surface bg-surface-highest/40 border border-outline-variant/20 px-3 py-1.5 rounded-lg"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pb-2" />
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex-shrink-0 bg-white border-t border-outline-variant/20 px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-manrope text-xs text-on-surface-variant flex items-center gap-1 mb-0.5">
            Pick your next move
            <span className="material-symbols-outlined text-[12px]">arrow_downward</span>
          </p>
          <p className="font-lexend font-semibold text-base text-on-surface">What to do next</p>
          <p className="font-manrope text-xs text-on-surface-variant truncate">
            Keep it light — replay for a quick win, or jump into a fresh challenge.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => window.location.reload()}
            className="font-manrope text-sm text-on-surface-variant border border-outline-variant/30 px-4 py-2 rounded-full hover:bg-surface-highest/40 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">replay</span>
            Replay
          </button>
          <button
            onClick={onNext}
            className="font-manrope text-sm font-semibold text-white bg-primary px-4 py-2 rounded-full hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            Next scenario
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenarioId    = searchParams.get("scenario_id") || "daily_conversation_v1";
  const scenarioTitle = searchParams.get("scenario")    || "Daily Conversation";
  const language      = searchParams.get("language")    || "German";
  const preview       = searchParams.get("preview")     === "1";

  const [pageState,        setPageState]        = useState<PageState>("pre_session");
  const [sessionInfo,      setSessionInfo]       = useState<SessionInfo | null>(null);
  const [micState,         setMicState]          = useState<MicState>("idle");
  const [turnCount,        setTurnCount]         = useState(0);
  const [softCap,          setSoftCap]           = useState(10);
  const [feedback,         setFeedback]          = useState<Feedback | null>(null);
  const [error,            setError]             = useState<string | null>(null);
  const [mayaText,         setMayaText]          = useState("");

  const micStateRef        = useRef<MicState>("idle");
  const sessionIdRef       = useRef<string | null>(null);
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
  const chunksRef          = useRef<Blob[]>([]);
  const spaceDownRef       = useRef(false);
  const abortRef           = useRef<AbortController | null>(null);
  const transcriptRef      = useRef<{role: "user"|"assistant"; text: string}[]>([]);

  // Web Audio API
  const audioCtxRef          = useRef<AudioContext | null>(null);
  const nextPlayTimeRef       = useRef(0);
  const scheduledSourcesRef   = useRef<AudioBufferSourceNode[]>([]);

  // Typewriter
  const typeQueueRef       = useRef<Array<{ char: string }>>([]);
  const typeIntervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentMayaTextRef = useRef("");

  const setMicStateSync = (s: MicState) => { micStateRef.current = s; setMicState(s); };

  // ── Audio ──────────────────────────────────────────────────────────────────

  const getAudioCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      nextPlayTimeRef.current = 0;
    }
    return audioCtxRef.current;
  }, []);

  const schedulePCMChunk = useCallback((base64pcm: string, rate: number) => {
    const ctx = getAudioCtx();
    if (ctx.sampleRate !== rate) return;
    const raw   = atob(base64pcm);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const int16  = new Int16Array(bytes.buffer);
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
      scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
    };
  }, [getAudioCtx]);

  const stopAllAudio = useCallback(() => {
    scheduledSourcesRef.current.forEach(s => { try { s.stop(0); } catch {} });
    scheduledSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    abortRef.current?.abort();
    if (typeIntervalRef.current) { clearInterval(typeIntervalRef.current); typeIntervalRef.current = null; }
    typeQueueRef.current = [];
  }, []);

  // ── Typewriter ─────────────────────────────────────────────────────────────

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

  // ── Session start ──────────────────────────────────────────────────────────

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
              sessionId:     d.session_id     as string,
              scenarioTitle: d.scenario_title as string,
              level:         d.level          as string,
              softCap:       d.soft_cap       as number,
              turnEstimate:  d.turn_estimate  as number,
              personaName:   d.persona_name   as string,
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
            if (openingText.trim()) transcriptRef.current.push({ role: "assistant", text: openingText.trim() });
            const ctx = audioCtxRef.current;
            const rem = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
            setTimeout(() => setMicStateSync("idle"), rem * 1000 + 300);
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

  // ── Recording ──────────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (micStateRef.current !== "idle") return;
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
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
    recorder.stream.getTracks().forEach(t => t.stop());

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const sid  = sessionIdRef.current;
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
              if (turnUserText)        transcriptRef.current.push({ role: "user",      text: turnUserText });
              if (turnMayaText.trim()) transcriptRef.current.push({ role: "assistant", text: turnMayaText.trim() });
              const ctx = audioCtxRef.current;
              const rem = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
              setTimeout(() => setMicStateSync("idle"), rem * 1000 + 300);
              break;
            }
            case "session_ended": {
              if (turnUserText)        transcriptRef.current.push({ role: "user",      text: turnUserText });
              if (turnMayaText.trim()) transcriptRef.current.push({ role: "assistant", text: turnMayaText.trim() });
              const ctx = audioCtxRef.current;
              const rem = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
              setTimeout(() => {
                setMicStateSync("idle");
                setPageState("ended");
                if (event.data.feedback) setFeedback(event.data.feedback as Feedback);
              }, rem * 1000 + 500);
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

  // ── Keyboard shortcut ──────────────────────────────────────────────────────

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
    if      (micState === "idle")      startRecording();
    else if (micState === "recording") stopRecording();
    else if (micState === "playing")   { stopAllAudio(); setMicStateSync("idle"); }
  }

  // ── Preview mode ───────────────────────────────────────────────────────────

  if (preview) {
    return (
      <FeedbackCard
        feedback={MOCK_FEEDBACK}
        turnCount={7}
        softCap={10}
        onNext={() => router.push("/speaking")}
      />
    );
  }

  // ── Pre-session card ───────────────────────────────────────────────────────

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

  // ── Ended (feedback) ───────────────────────────────────────────────────────

  if (pageState === "ended") {
    return feedback ? (
      <FeedbackCard
        feedback={feedback}
        turnCount={turnCount}
        softCap={softCap}
        onNext={() => router.push("/speaking")}
      />
    ) : (
      <div className="flex items-center justify-center" style={{ height: "100vh" }}>
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
    );
  }

  // ── Active session ─────────────────────────────────────────────────────────

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
            <p className="font-lexend font-bold text-lg text-on-surface">
              {turnCount} <span className="text-on-surface-variant text-sm font-manrope">/ {softCap}</span>
            </p>
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
          {micState === "idle"       && pageState === "core"  && "Hold SPACE or tap the mic to speak"}
          {micState === "recording"  && "Listening..."}
          {micState === "processing" && (pageState === "entry" ? "Starting session..." : "Processing...")}
          {micState === "playing"    && `${sessionInfo?.personaName ?? "Maya"} is speaking`}
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
            micState === "idle"       ? "bg-primary hover:bg-primary/90 shadow-ambient" :
            micState === "recording"  ? "bg-error shadow-ambient scale-110" :
            micState === "processing" ? "bg-surface-highest cursor-not-allowed" :
            "bg-tertiary shadow-ambient"
          }`}
        >
          {micState === "idle"      && <span className="material-symbols-outlined ms-filled text-[32px] text-white">mic</span>}
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
          {micState === "playing"   && "Tap to stop"}
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
