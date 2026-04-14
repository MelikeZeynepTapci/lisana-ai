"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startDemoSession, sendDemoTurn } from "@/lib/api";
import { FeedbackCard, FeedbackLoader, type Feedback, type TranscriptTurn } from "@/components/session/FeedbackCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageState = "pre_session" | "entry" | "core" | "ended";
type MicState = "idle" | "recording" | "processing" | "playing";

const SAMPLE_RATE = 24000;
const DEMO_MAX_TURNS = 3;

const LEVELS = [
  { id: "A1", label: "Beginner",     desc: "I know a few words",        emoji: "🌱" },
  { id: "B1", label: "Intermediate", desc: "I can handle basic topics", emoji: "📈" },
  { id: "C1", label: "Advanced",     desc: "I want a real challenge",   emoji: "🚀" },
];

// ─── Maya Avatar ──────────────────────────────────────────────────────────────

function MayaAvatar({ micState }: { micState: MicState }) {
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      {micState === "playing" && (
        <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
      )}
      {micState === "recording" && (
        <span className="absolute inset-0 rounded-full border-2 border-error/40 animate-ping" />
      )}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 ${
        micState === "playing"    ? "bg-primary/15" :
        micState === "recording"  ? "bg-error/10" :
        micState === "processing" ? "bg-surface-highest" :
        "bg-primary-container/40"
      }`}>
        <span className={`material-symbols-outlined ms-filled text-[36px] transition-colors duration-300 ${
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

// ─── Turn Dots ────────────────────────────────────────────────────────────────

function TurnDots({ used, max }: { used: number; max: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors duration-300 ${
            i < used ? "bg-primary" : "bg-outline-variant/40"
          }`}
        />
      ))}
    </div>
  );
}


// ─── Demo Page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("pre_session");
  const [micState, setMicState] = useState<MicState>("idle");
  const [turnCount, setTurnCount] = useState(0);
  const [mayaText, setMayaText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scenarioTitle, setScenarioTitle] = useState("Café Order");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  // Onboarding form
  const [userName, setUserName] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("A1");

  // Transcript accumulation
  const transcriptRef = useRef<TranscriptTurn[]>([]);
  const [sessionTranscript, setSessionTranscript] = useState<TranscriptTurn[]>([]);

  const micStateRef        = useRef<MicState>("idle");
  const sessionIdRef       = useRef<string | null>(null);
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
  const chunksRef          = useRef<Blob[]>([]);
  const spaceDownRef       = useRef(false);
  const abortRef           = useRef<AbortController | null>(null);

  // Web Audio
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
    const int16   = new Int16Array(bytes.buffer);
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

  // ── Start session ──────────────────────────────────────────────────────────

  async function handleStart() {
    setPageState("entry");
    setMicStateSync("processing");
    resetMayaText();
    setError(null);
    transcriptRef.current = [];

    const abort = new AbortController();
    abortRef.current = abort;
    let openingText = "";

    try {
      for await (const event of startDemoSession(userName.trim(), selectedLevel)) {
        if (abort.signal.aborted) break;
        switch (event.type) {
          case "session_created": {
            const d = event.data;
            sessionIdRef.current = d.session_id as string;
            setScenarioTitle(d.scenario_title as string);
            setPageState("core");
            setMicStateSync("playing");
            break;
          }
          case "ai_chunk":
            openingText += (event.data.text as string) + " ";
            enqueueText((event.data.text as string) + " ");
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
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
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
        for await (const event of sendDemoTurn(sid, blob, abort.signal)) {
          if (abort.signal.aborted) break;
          switch (event.type) {
            case "transcript":
              turnUserText = event.data.text as string;
              break;
            case "ai_chunk":
              turnMayaText += (event.data.text as string) + " ";
              if (micStateRef.current !== "playing") setMicStateSync("playing");
              enqueueText((event.data.text as string) + " ");
              break;
            case "audio":
              schedulePCMChunk(event.data.pcm as string, event.data.rate as number);
              break;
            case "turn_update": {
              const newCount = event.data.turn_count as number;
              setTurnCount(newCount);
              if (newCount >= DEMO_MAX_TURNS) {
                const ctx = audioCtxRef.current;
                const rem = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
                setTimeout(() => setGeneratingFeedback(true), rem * 1000 + 300);
              }
              break;
            }
            case "done": {
              if (turnUserText)        transcriptRef.current.push({ role: "user",      text: turnUserText });
              if (turnMayaText.trim()) transcriptRef.current.push({ role: "assistant", text: turnMayaText.trim() });
              const ctx = audioCtxRef.current;
              const rem = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
              setTimeout(() => setMicStateSync("idle"), rem * 1000 + 300);
              break;
            }
            case "demo_ended": {
              if (turnUserText)        transcriptRef.current.push({ role: "user",      text: turnUserText });
              if (turnMayaText.trim()) transcriptRef.current.push({ role: "assistant", text: turnMayaText.trim() });
              const fb = event.data.feedback as Feedback | null;
              const ctx = audioCtxRef.current;
              const rem = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
              setTimeout(() => {
                setMicStateSync("idle");
                setFeedback(fb);
                setSessionTranscript([...transcriptRef.current]);
                setGeneratingFeedback(false);
                setPageState("ended");
              }, rem * 1000 + 600);
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
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setMicStateSync("idle");
      }
    };
  }, [schedulePCMChunk]);

  // ── Keyboard (Space) ───────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

  // Feedback loading screen
  if (generatingFeedback) return <FeedbackLoader />;

  // FeedbackCard renders its own full-screen layout — return it directly
  if (pageState === "ended" && feedback) {
    return (
      <FeedbackCard
        feedback={feedback}
        turnCount={turnCount}
        softCap={DEMO_MAX_TURNS}
        transcript={sessionTranscript}
        isDemo
        onNext={() => router.push("/signup")}
      />
    );
  }

  return (
    <div className="flex flex-col bg-background font-manrope" style={{ height: "100dvh" }}>

      {/* Nav */}
      <nav className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-surface-lowest border-b border-outline-variant/20">
        <Link href="/landing" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined ms-filled text-[15px] text-white">language</span>
          </div>
          <span className="font-lexend font-bold text-sm text-on-surface">
            Lisana <span className="text-primary">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="font-manrope text-xs text-on-surface-variant hover:text-on-surface transition-colors px-3 py-1.5"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="font-manrope text-xs font-semibold text-white bg-primary px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Body */}
      {pageState === "ended" ? (
        /* feedback generation failed — minimal fallback */
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <p className="font-lexend font-bold text-xl text-on-surface mb-2">Demo complete!</p>
          <p className="font-manrope text-sm text-on-surface-variant mb-6">Sign up to keep practicing and track your progress.</p>
          <Link href="/signup" className="font-manrope font-bold text-sm text-white bg-primary px-8 py-3.5 rounded-full hover:bg-primary/90 transition-colors">
            Create free account →
          </Link>
        </div>

      ) : pageState === "pre_session" ? (
        /* ── Onboarding form ── */
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
          <div className="w-full max-w-sm">

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #a78bfa 0%, #725991 100%)" }}
              >
                <span className="material-symbols-outlined ms-filled text-[22px] text-white">smart_toy</span>
              </div>
              <div>
                <h1 className="font-lexend font-bold text-lg text-on-surface leading-snug">
                  Quick setup before we start
                </h1>
                <p className="font-manrope text-xs text-on-surface-variant mt-0.5">
                  So Maya can greet you properly
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="mb-5">
              <label className="block font-manrope text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                Your first name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Sarah"
                maxLength={40}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-lowest text-sm text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>

            {/* Level */}
            <div className="mb-7">
              <label className="block font-manrope text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                Your German level
              </label>
              <div className="space-y-2">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      selectedLevel === lvl.id
                        ? "border-primary/60 bg-primary-container/20 ring-2 ring-primary/10"
                        : "border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-high/30"
                    }`}
                  >
                    <span className="text-xl">{lvl.emoji}</span>
                    <div className="min-w-0">
                      <p className={`font-manrope text-sm font-semibold ${
                        selectedLevel === lvl.id ? "text-primary" : "text-on-surface"
                      }`}>
                        {lvl.label}
                      </p>
                      <p className="font-manrope text-xs text-on-surface-variant">{lvl.desc}</p>
                    </div>
                    {selectedLevel === lvl.id && (
                      <span className="material-symbols-outlined ms-filled text-[18px] text-primary ml-auto flex-shrink-0">
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario hint */}
            <div className="flex items-center gap-3 bg-surface-low border border-outline-variant/20 rounded-xl px-4 py-3 mb-6">
              <span className="text-lg">☕</span>
              <p className="font-manrope text-xs text-on-surface-variant leading-relaxed">
                You&apos;re at a German café — Maya plays the barista. Order something and chat.
              </p>
            </div>

            {error && (
              <p className="font-manrope text-sm text-error mb-4 text-center">{error}</p>
            )}

            <button
              onClick={handleStart}
              className="w-full font-manrope font-bold text-sm text-white bg-primary py-3.5 rounded-full hover:bg-primary/90 transition-colors shadow-ambient-sm"
            >
              Start conversation →
            </button>

            <p className="font-manrope text-xs text-on-surface-variant/60 text-center mt-4">
              {DEMO_MAX_TURNS} free turns · No account needed
            </p>
          </div>
        </div>

      ) : (
        /* ── Active session ── */
        <div className="flex-1 flex flex-col items-center justify-between px-6 py-6 min-h-0">

          {/* Top bar */}
          <div className="w-full max-w-sm flex items-center justify-between">
            <div>
              <p className="font-manrope text-[11px] font-semibold text-on-surface-variant uppercase tracking-widest">
                Demo
              </p>
              <p className="font-lexend font-semibold text-sm text-on-surface">{scenarioTitle}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <TurnDots used={turnCount} max={DEMO_MAX_TURNS} />
              <p className="font-manrope text-[10px] text-on-surface-variant">
                {DEMO_MAX_TURNS - turnCount} turn{DEMO_MAX_TURNS - turnCount !== 1 ? "s" : ""} left
              </p>
            </div>
          </div>

          {/* Maya avatar + text */}
          <div className="flex flex-col items-center gap-4">
            <MayaAvatar micState={micState} />
            <div className="min-h-[56px] max-w-xs text-center">
              {mayaText ? (
                <p className="font-manrope text-sm text-on-surface leading-relaxed">
                  {mayaText}
                  {(micState === "playing" || micState === "processing") && (
                    <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm align-middle" />
                  )}
                </p>
              ) : (
                <p className="font-manrope text-sm text-on-surface-variant italic">
                  {micState === "processing"
                    ? "Processing…"
                    : micState === "idle"
                    ? "Your turn — tap or hold Space to speak"
                    : ""}
                </p>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="font-manrope text-xs text-error text-center max-w-xs">{error}</p>
          )}

          {/* Mic button */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleMicClick}
              disabled={micState === "processing"}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-ambient-sm ${
                micState === "recording"
                  ? "bg-error scale-110"
                  : micState === "processing"
                  ? "bg-surface-highest cursor-not-allowed"
                  : micState === "playing"
                  ? "bg-primary-container/60 border-2 border-primary/30"
                  : "bg-primary hover:bg-primary/90 active:scale-95"
              }`}
            >
              <span className={`material-symbols-outlined ms-filled text-[26px] ${
                micState === "recording"  ? "text-white" :
                micState === "processing" ? "text-on-surface-variant" :
                micState === "playing"    ? "text-primary" :
                "text-white"
              }`}>
                {micState === "recording" ? "stop" : micState === "playing" ? "volume_up" : "mic"}
              </span>
            </button>
            <p className="font-manrope text-[11px] text-on-surface-variant">
              {micState === "recording"  ? "Release to send"  :
               micState === "processing" ? "Processing…"      :
               micState === "playing"    ? "Tap to interrupt" :
               "Tap or hold Space"}
            </p>
          </div>
        </div>
      )}

      {/* Footer strip — hidden when FeedbackCard is shown (it has its own bottom bar) */}
      {pageState !== "ended" && (
        <div className="flex-shrink-0 px-5 py-3 border-t border-outline-variant/20 bg-surface-lowest flex items-center justify-between">
          <p className="font-manrope text-xs text-on-surface-variant">
            Like it?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Sign up for full access →
            </Link>
          </p>
          <p className="font-manrope text-xs text-on-surface-variant/40">
            {DEMO_MAX_TURNS} free turns
          </p>
        </div>
      )}
    </div>
  );
}
