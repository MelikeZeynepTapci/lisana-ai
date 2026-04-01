"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSession, sendTurn, getAudioUrl } from "@/lib/api";

type MicState = "idle" | "recording" | "processing" | "playing";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  audioUrl?: string;
}

function WaveAnimation() {
  return (
    <div className="flex items-center gap-0.5 h-5">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className="wave-bar w-0.5 h-full bg-primary rounded-full origin-center"
          style={{ animationDelay: `${(i - 1) * 0.1}s` }}
        />
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  );
}

export default function ConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get("language") || "German";
  const scenario = searchParams.get("scenario") || "Daily conversation";

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [micState, setMicState] = useState<MicState>("idle");
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const spaceDownRef = useRef(false);

  // Init session
  useEffect(() => {
    createSession(language, scenario)
      .then((s) => setSessionId(s.session_id))
      .catch(() => setError("Failed to start session. Check that the backend is running."));
  }, [language, scenario]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveText]);

  const startRecording = useCallback(async () => {
    if (micState !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setMicState("recording");
      setError(null);
    } catch {
      setError("Microphone access denied.");
    }
  }, [micState]);

  const stopRecording = useCallback(() => {
    if (micState !== "recording") return;
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (!sessionId) return;

      setMicState("processing");
      setLiveText("Transcribing...");

      try {
        const turn = await sendTurn(sessionId, blob);

        const userMsg: ChatMessage = {
          id: Date.now() + "-u",
          role: "user",
          text: turn.user_transcript,
        };
        const aiMsg: ChatMessage = {
          id: Date.now() + "-a",
          role: "assistant",
          text: turn.ai_text,
          audioUrl: getAudioUrl(turn.audio_url),
        };

        setMessages((prev) => [...prev, userMsg, aiMsg]);
        setLiveText("");
        setMicState("playing");

        // Auto-play AI audio
        const audio = new Audio(aiMsg.audioUrl);
        currentAudioRef.current = audio;
        audio.play();
        audio.onended = () => setMicState("idle");
        audio.onerror = () => setMicState("idle");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setError(message);
        setMicState("idle");
        setLiveText("");
      }
    };
  }, [micState, sessionId]);

  // Keyboard shortcut: hold SPACE
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !spaceDownRef.current) {
        spaceDownRef.current = true;
        startRecording();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDownRef.current = false;
        stopRecording();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [startRecording, stopRecording]);

  function replayAudio(url: string) {
    currentAudioRef.current?.pause();
    const audio = new Audio(url);
    currentAudioRef.current = audio;
    audio.play();
  }

  function handleMicClick() {
    if (micState === "idle") startRecording();
    else if (micState === "recording") stopRecording();
    else if (micState === "playing") {
      currentAudioRef.current?.pause();
      setMicState("idle");
    }
  }

  const micLabel = () => {
    switch (micState) {
      case "idle": return "Tap to speak";
      case "recording": return "Listening...";
      case "processing": return "Processing...";
      case "playing": return "AI is speaking...";
    }
  };

  return (
    <div className="page-transition flex flex-col" style={{ height: "calc(100vh)" }}>
      {/* Scenario Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="w-10 h-10 bg-surface-highest rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined ms-filled text-[22px] text-on-surface-variant">shopping_cart</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-lexend font-bold text-base text-on-surface">{scenario}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-manrope font-bold text-xs bg-tertiary-container text-tertiary px-2 py-0.5 rounded-full">A1</span>
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            <span className="font-manrope text-xs text-on-surface-variant">Session Active</span>
          </div>
        </div>
        <button
          onClick={() => router.push("/speaking")}
          className="flex items-center gap-2 border border-outline-variant/40 text-on-surface font-manrope font-semibold text-sm px-4 py-2 rounded-full hover:bg-surface-highest/40 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
          End Session
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {messages.length === 0 && !liveText && (
          <div className="text-center text-on-surface-variant mt-16 text-sm">
            Hold <kbd className="bg-surface-highest border border-outline-variant/40 px-2 py-0.5 rounded text-on-surface text-xs font-mono">SPACE</kbd> or press the mic to start speaking
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end items-end gap-2" : "justify-start items-start gap-2"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary-container/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined ms-filled text-[16px] text-primary">smart_toy</span>
              </div>
            )}
            <div className="max-w-[70%] space-y-2">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-surface-lowest border border-outline-variant/20 text-on-surface rounded-bl-sm shadow-ambient-sm"
                }`}
              >
                <p>{msg.text}</p>
              </div>
              {msg.role === "assistant" && msg.audioUrl && (
                <button
                  onClick={() => replayAudio(msg.audioUrl!)}
                  className="flex items-center gap-2 bg-surface-lowest border border-outline-variant/20 rounded-2xl px-3 py-2 hover:bg-surface-highest/40 transition-colors shadow-ambient-sm"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined ms-filled text-[14px] text-primary">play_arrow</span>
                  </span>
                  <WaveAnimation />
                  <span className="font-manrope text-xs text-on-surface-variant">0:04</span>
                </button>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center flex-shrink-0 mb-0.5">
                <span className="font-lexend font-bold text-xs text-white">A</span>
              </div>
            )}
          </div>
        ))}

        {liveText && (
          <div className="flex justify-center">
            <span className="font-manrope text-sm text-on-surface-variant italic animate-pulse">{liveText}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-2 px-4 py-3 bg-error-container rounded-2xl text-error text-sm text-center font-manrope">
          {error}
        </div>
      )}

      {/* Recording Controls */}
      <div className="px-6 pb-8 pt-3 flex flex-col items-center gap-3 border-t border-outline-variant/10">
        {micState === "recording" && (
          <p className="font-manrope font-semibold text-sm text-primary animate-pulse">Listening...</p>
        )}
        <button
          onClick={handleMicClick}
          disabled={micState === "processing" || !sessionId}
          aria-label={micLabel()}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none ${
            micState === "idle"
              ? "bg-primary hover:bg-primary/90 shadow-ambient"
              : micState === "recording"
              ? "bg-primary shadow-ambient scale-110"
              : micState === "processing"
              ? "bg-surface-highest cursor-not-allowed"
              : "bg-tertiary shadow-ambient"
          }`}
        >
          {micState === "idle" && (
            <span className="material-symbols-outlined ms-filled text-[28px] text-white">mic</span>
          )}
          {micState === "recording" && (
            <>
              <span className="material-symbols-outlined ms-filled text-[28px] text-white">mic</span>
              <span className="absolute -inset-2 rounded-full border-2 border-primary/40 animate-ping" />
            </>
          )}
          {micState === "processing" && <Spinner />}
          {micState === "playing" && (
            <span className="material-symbols-outlined ms-filled text-[28px] text-white">stop</span>
          )}
        </button>
        <p className="font-manrope text-xs text-on-surface-variant">
          {micState === "idle" && "Release to send"}
          {micState === "recording" && "Release to send"}
          {micState === "processing" && "Processing your message..."}
          {micState === "playing" && "Tap to stop playback"}
        </p>
      </div>
    </div>
  );
}
