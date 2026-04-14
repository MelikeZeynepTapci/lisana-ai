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
}

interface Feedback {
  what_went_well: string[];
  watch_out_for: WatchOutItem[];
  useful_phrases: string[];
  one_tip: string;
  next_session: string;
}

const SAMPLE_RATE = 24000;

// ─── Maya Avatar ─────────────────────────────────────────────────────────────

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
        micState === "playing" ? "bg-primary/15" :
        micState === "recording" ? "bg-error/10" :
        micState === "processing" ? "bg-surface-highest" :
        "bg-primary-container/40"
      }`}>
        <span className={`material-symbols-outlined ms-filled text-[40px] transition-colors duration-300 ${
          micState === "playing" ? "text-primary" :
          micState === "recording" ? "text-error" :
          micState === "processing" ? "text-on-surface-variant" :
          "text-primary"
        }`}>
          {micState === "processing" ? "hourglass_top" : "smart_toy"}
        </span>
      </div>
    </div>
  );
}

// ─── Feedback Card ────────────────────────────────────────────────────────────

function FeedbackCard({ feedback, onNext }: { feedback: Feedback; onNext: () => void }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-6 space-y-4">
      <div>
        <h2 className="font-lexend font-bold text-xl text-on-surface">Session complete</h2>
        <p className="font-manrope text-sm text-on-surface-variant mt-1">Here&apos;s how it went</p>
      </div>

      <div className="bg-surface-lowest border border-outline-variant/20 rounded-2xl p-4 shadow-ambient-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined ms-filled text-[18px] text-tertiary">check_circle</span>
          <h3 className="font-lexend font-semibold text-sm text-on-surface">What went well</h3>
        </div>
        <ul className="space-y-2">
          {feedback.what_went_well.map((item, i) => (
            <li key={i} className="font-manrope text-sm text-on-surface leading-relaxed flex gap-2">
              <span className="text-tertiary mt-0.5">·</span>{item}
            </li>
          ))}
        </ul>
      </div>

      {feedback.watch_out_for?.length > 0 && (
        <div className="bg-surface-lowest border border-outline-variant/20 rounded-2xl p-4 shadow-ambient-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[18px] text-secondary">lightbulb</span>
            <h3 className="font-lexend font-semibold text-sm text-on-surface">Watch out for</h3>
          </div>
          <ul className="space-y-4">
            {feedback.watch_out_for.map((item, i) => (
              <li key={i} className="space-y-2">
                <span className="inline-block font-manrope font-bold text-[11px] uppercase tracking-wider text-secondary bg-secondary-container px-2 py-0.5 rounded-full">
                  {item.topic}
                </span>
                <div className="font-manrope text-sm space-y-1">
                  <span className="block line-through text-on-surface-variant">&ldquo;{item.said}&rdquo;</span>
                  <span className="block text-on-surface font-medium">→ &ldquo;{item.better}&rdquo;</span>
                  {item.note && (
                    <span className="block text-xs text-on-surface-variant mt-1">{item.note}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-surface-lowest border border-outline-variant/20 rounded-2xl p-4 shadow-ambient-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[18px] text-primary">format_quote</span>
          <h3 className="font-lexend font-semibold text-sm text-on-surface">Useful phrases</h3>
        </div>
        <ul className="space-y-2">
          {feedback.useful_phrases.map((phrase, i) => (
            <li key={i} className="font-manrope text-sm text-on-surface bg-primary/5 rounded-xl px-3 py-2 italic">
              &ldquo;{phrase}&rdquo;
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined ms-filled text-[18px] text-primary">tips_and_updates</span>
          <h3 className="font-lexend font-semibold text-sm text-primary">One tip for next time</h3>
        </div>
        <p className="font-manrope text-sm text-on-surface leading-relaxed">{feedback.one_tip}</p>
      </div>

      {feedback.next_session && (
        <div className="bg-surface-lowest border border-outline-variant/20 rounded-2xl p-4 shadow-ambient-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">arrow_forward</span>
            <h3 className="font-lexend font-semibold text-sm text-on-surface">Try next</h3>
          </div>
          <p className="font-manrope text-sm text-on-surface-variant">{feedback.next_session}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2 pb-6">
        <button
          onClick={onNext}
          className="flex-1 bg-primary text-white font-manrope font-bold text-sm py-3 rounded-full hover:bg-primary/90 transition-colors"
        >
          Start another session
        </button>
        <button
          onClick={() => { window.location.href = "/"; }}
          className="flex-1 border border-outline-variant/40 text-on-surface font-manrope font-semibold text-sm py-3 rounded-full hover:bg-surface-highest/40 transition-colors"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenario_id") || "daily_conversation_v1";
  const scenarioTitle = searchParams.get("scenario") || "Daily Conversation";
  const language = searchParams.get("language") || "German";

  const [pageState, setPageState] = useState<PageState>("pre_session");
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [micState, setMicState] = useState<MicState>("idle");
  const [turnCount, setTurnCount] = useState(0);
  const [softCap, setSoftCap] = useState(10);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mayaText, setMayaText] = useState("");

  const micStateRef = useRef<MicState>("idle");
  const sessionIdRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const spaceDownRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Web Audio API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef(0);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // Typewriter
  const typeQueueRef = useRef<Array<{ char: string }>>([]);
  const typeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentMayaTextRef = useRef("");

  const setMicStateSync = (s: MicState) => {
    micStateRef.current = s;
    setMicState(s);
  };

  // ─── Audio ────────────────────────────────────────────────────────────────

  const getAudioCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      nextPlayTimeRef.current = 0;
    }
    return audioCtxRef.current;
  }, []);

  const schedulePCMChunk = useCallback(
    (base64pcm: string, rate: number) => {
      const ctx = getAudioCtx();
      if (ctx.sampleRate !== rate) return;
      const raw = atob(base64pcm);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      const int16 = new Int16Array(bytes.buffer);
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
        scheduledSourcesRef.current = scheduledSourcesRef.current.filter((s) => s !== source);
      };
    },
    [getAudioCtx]
  );

  const stopAllAudio = useCallback(() => {
    scheduledSourcesRef.current.forEach((s) => { try { s.stop(0); } catch {} });
    scheduledSourcesRef.current = [];
    nextPlayTimeRef.current = 0;
    abortRef.current?.abort();
    if (typeIntervalRef.current) { clearInterval(typeIntervalRef.current); typeIntervalRef.current = null; }
    typeQueueRef.current = [];
  }, []);

  // ─── Typewriter ──────────────────────────────────────────────────────────

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

  // ─── Session start ────────────────────────────────────────────────────────

  async function handleStartSession() {
    setPageState("entry");
    setMicStateSync("processing");
    resetMayaText();
    setError(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      for await (const event of startSpeakingSession(scenarioId, language, abort.signal)) {
        if (abort.signal.aborted) break;
        switch (event.type) {
          case "session_created": {
            const d = event.data;
            setSessionInfo({
              sessionId: d.session_id as string,
              scenarioTitle: d.scenario_title as string,
              level: d.level as string,
              softCap: d.soft_cap as number,
              turnEstimate: d.turn_estimate as number,
              personaName: d.persona_name as string,
            });
            sessionIdRef.current = d.session_id as string;
            setSoftCap(d.soft_cap as number);
            setPageState("core");
            setMicStateSync("playing");
            break;
          }
          case "ai_chunk":
            enqueueText(event.data.text as string);
            break;
          case "audio":
            schedulePCMChunk(event.data.pcm as string, event.data.rate as number);
            break;
          case "done": {
            const ctx = audioCtxRef.current;
            const remaining = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
            setTimeout(() => setMicStateSync("idle"), remaining * 1000 + 300);
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

  // ─── Recording ────────────────────────────────────────────────────────────

  const startRecording = useCallback(async () => {
    if (micStateRef.current !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
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
    recorder.stream.getTracks().forEach((t) => t.stop());

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const sid = sessionIdRef.current;
      if (!sid) return;

      resetMayaText();

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        for await (const event of sendSpeakingTurn(sid, blob, abort.signal)) {
          if (abort.signal.aborted) break;
          switch (event.type) {
            case "transcript":
              // No transcript shown during session (per UX spec)
              break;
            case "ai_chunk":
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
              const ctx = audioCtxRef.current;
              const remaining = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
              setTimeout(() => setMicStateSync("idle"), remaining * 1000 + 300);
              break;
            }
            case "session_ended": {
              const ctx = audioCtxRef.current;
              const remaining = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
              setTimeout(() => {
                setMicStateSync("idle");
                setPageState("ended");
                if (event.data.feedback) setFeedback(event.data.feedback as Feedback);
              }, remaining * 1000 + 500);
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

  // ─── Keyboard shortcut ────────────────────────────────────────────────────

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
    if (micState === "idle") startRecording();
    else if (micState === "recording") stopRecording();
    else if (micState === "playing") { stopAllAudio(); setMicStateSync("idle"); }
  }

  // ─── Pre-session card ─────────────────────────────────────────────────────

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

  // ─── Ended (feedback) ────────────────────────────────────────────────────

  if (pageState === "ended") {
    return (
      <div className="page-transition flex flex-col" style={{ height: "100vh" }}>
        {feedback ? (
          <FeedbackCard feedback={feedback} onNext={() => router.push("/speaking")} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
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
        )}
      </div>
    );
  }

  // ─── Active session ───────────────────────────────────────────────────────

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
            <p className="font-lexend font-bold text-lg text-on-surface">{turnCount} <span className="text-on-surface-variant text-sm font-manrope">/ {softCap}</span></p>
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
          {micState === "idle" && pageState === "core" && "Hold SPACE or tap the mic to speak"}
          {micState === "recording" && "Listening..."}
          {micState === "processing" && (pageState === "entry" ? "Starting session..." : "Processing...")}
          {micState === "playing" && `${sessionInfo?.personaName ?? "Maya"} is speaking`}
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
            micState === "idle" ? "bg-primary hover:bg-primary/90 shadow-ambient" :
            micState === "recording" ? "bg-error shadow-ambient scale-110" :
            micState === "processing" ? "bg-surface-highest cursor-not-allowed" :
            "bg-tertiary shadow-ambient"
          }`}
        >
          {micState === "idle" && <span className="material-symbols-outlined ms-filled text-[32px] text-white">mic</span>}
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
          {micState === "playing" && "Tap to stop"}
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
