"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { startSpeakingSession, sendSpeakingTurn, sendSpeakingTurnText, endSpeakingSession } from "@/lib/api";
import { FeedbackCard, FeedbackLoader, type Feedback, type TranscriptTurn } from "@/components/session/FeedbackCard";
import { SuggestionChips } from "@/components/session/SuggestionChips";

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


const MOCK_TRANSCRIPT: TranscriptTurn[] = [
  { role: "assistant", text: "Hallo! Schön dich kennenzulernen. Was machst du gerne in deiner Freizeit?" },
  { role: "user",      text: "Ich spiele Videospiele gerne und ich spazieren gegangen, gehe mit meinen Freunden." },
  { role: "assistant", text: "Oh interessant! Spielst du lieber online oder mit Freunden zusammen?" },
  { role: "user",      text: "Ich interessiere mich für Sprachen und ich viele gegessen heute nach dem Spielen." },
  { role: "assistant", text: "Oh, was hast du gegessen? Kochst du gerne?" },
  { role: "user",      text: "Ja, ich koche manchmal. Ich mag italienisches Essen sehr. Das klingt interessant!" },
  { role: "assistant", text: "Das klingt lecker! Hast du ein Lieblingsrezept?" },
];

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
  const [generatingFeedback, setGeneratingFeedback] = useState(false);
  const [error,            setError]             = useState<string | null>(null);
  const [mayaText,         setMayaText]          = useState("");
  const [chips,            setChips]             = useState<string[]>([]);
  const [chipsVisible,     setChipsVisible]      = useState(false);

  const micStateRef        = useRef<MicState>("idle");
  const sessionIdRef       = useRef<string | null>(null);
  const chipsTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChipsRef    = useRef<string[]>([]);
  const turnCountRef       = useRef(0);
  const mediaRecorderRef   = useRef<MediaRecorder | null>(null);
  const chunksRef          = useRef<Blob[]>([]);
  const spaceDownRef       = useRef(false);
  const abortRef           = useRef<AbortController | null>(null);
  const [sessionTranscript, setSessionTranscript] = useState<TranscriptTurn[]>([]);
  const transcriptRef      = useRef<TranscriptTurn[]>([]);

  // Web Audio API
  const audioCtxRef          = useRef<AudioContext | null>(null);
  const nextPlayTimeRef       = useRef(0);
  const scheduledSourcesRef   = useRef<AudioBufferSourceNode[]>([]);

  // Typewriter
  const typeQueueRef       = useRef<Array<{ char: string }>>([]);
  const typeIntervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentMayaTextRef = useRef("");

  const setMicStateSync = (s: MicState) => { micStateRef.current = s; setMicState(s); };

  function hideChips() {
    if (chipsTimerRef.current) { clearTimeout(chipsTimerRef.current); chipsTimerRef.current = null; }
    setChipsVisible(false);
  }

  function showChipsAfterDelay(chipsArr: string[], delayMs: number) {
    if (chipsTimerRef.current) clearTimeout(chipsTimerRef.current);
    chipsTimerRef.current = setTimeout(() => {
      setChips(chipsArr);
      setChipsVisible(true);
    }, delayMs);
  }

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
            enqueueText((event.data.text as string) + " ");
            break;
          case "audio":
            schedulePCMChunk(event.data.pcm as string, event.data.rate as number);
            break;
          case "chips":
            pendingChipsRef.current = event.data.chips as string[];
            break;
          case "done": {
            if (openingText.trim()) transcriptRef.current.push({ role: "assistant", text: openingText.trim() });
            const ctx = audioCtxRef.current;
            const rem = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
            setTimeout(() => {
              setMicStateSync("idle");
              // Turn 1 (opening): show chips 1.5s after audio ends
              if (pendingChipsRef.current.length > 0) {
                showChipsAfterDelay(pendingChipsRef.current, 1500);
                pendingChipsRef.current = [];
              }
            }, rem * 1000 + 300);
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
      hideChips();
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      setError(msg);
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
              enqueueText((event.data.text as string) + " ");
              break;
            case "audio":
              schedulePCMChunk(event.data.pcm as string, event.data.rate as number);
              break;
            case "chips":
              pendingChipsRef.current = event.data.chips as string[];
              break;
            case "turn_update":
              turnCountRef.current = event.data.turn_count as number;
              setTurnCount(event.data.turn_count as number);
              setSoftCap(event.data.soft_cap as number);
              if ((event.data.state as string) === "ENDED") {
                const ctx = audioCtxRef.current;
                const rem = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
                setTimeout(() => setGeneratingFeedback(true), rem * 1000 + 300);
              }
              break;
            case "done": {
              if (turnUserText)        transcriptRef.current.push({ role: "user",      text: turnUserText });
              if (turnMayaText.trim()) transcriptRef.current.push({ role: "assistant", text: turnMayaText.trim() });
              const ctx = audioCtxRef.current;
              const rem = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
              setTimeout(() => {
                setMicStateSync("idle");
                if (pendingChipsRef.current.length > 0) {
                  // Turn 2+: show chips after 4s of inactivity; turn 1 after 1.5s
                  const delay = turnCountRef.current > 1 ? 4000 : 1500;
                  showChipsAfterDelay(pendingChipsRef.current, delay);
                  pendingChipsRef.current = [];
                }
              }, rem * 1000 + 300);
              break;
            }
            case "session_ended": {
              if (turnUserText)        transcriptRef.current.push({ role: "user",      text: turnUserText });
              if (turnMayaText.trim()) transcriptRef.current.push({ role: "assistant", text: turnMayaText.trim() });
              const ctx = audioCtxRef.current;
              const rem = ctx ? Math.max(0, nextPlayTimeRef.current - ctx.currentTime) : 0;
              setTimeout(() => {
                setMicStateSync("idle");
                setGeneratingFeedback(false);
                setPageState("ended");
                if (event.data.feedback) setFeedback(event.data.feedback as Feedback);
                setSessionTranscript([...transcriptRef.current]);
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

  const handleChipSelect = useCallback((_chip: string) => {
    // Tooltip is shown inside SuggestionChips — nothing to do here
  }, []);

  // ── Preview mode ───────────────────────────────────────────────────────────

  if (preview) {
    return (
      <FeedbackCard
        feedback={MOCK_FEEDBACK}
        turnCount={7}
        softCap={10}
        transcript={MOCK_TRANSCRIPT}
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

  // ── Generating feedback loader ─────────────────────────────────────────────

  if (generatingFeedback) return <FeedbackLoader />;

  // ── Ended (feedback) ───────────────────────────────────────────────────────

  if (pageState === "ended") {
    return feedback ? (
      <FeedbackCard
        feedback={feedback}
        turnCount={turnCount}
        softCap={softCap}
        transcript={sessionTranscript}
        onNext={() => router.push("/speaking")}
      />
    ) : (
      <FeedbackLoader />
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

      {/* Suggestion chips — fixed height so layout doesn't shift */}
      {pageState === "core" && (
        <div className="pb-3 min-h-[80px] flex items-end justify-center">
          {micState === "idle" && (
            <SuggestionChips
              chips={chips}
              visible={chipsVisible}
              onSelect={handleChipSelect}
            />
          )}
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
              setSessionTranscript([...transcriptRef.current]);
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
