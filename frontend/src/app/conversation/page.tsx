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
    <div className="flex items-center gap-1 h-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="wave-bar w-1 h-full bg-green-400 rounded-full origin-center"
          style={{ animationDelay: `${(i - 1) * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin" />
  );
}

export default function ConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get("language") || "English";
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

  const micButtonClass = () => {
    const base =
      "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg focus:outline-none";
    switch (micState) {
      case "idle":
        return `${base} bg-[#242424] hover:bg-[#2e2e2e] border-2 border-[#3a3a3a] hover:border-purple-500/50 hover:scale-105`;
      case "recording":
        return `${base} bg-red-600 hover:bg-red-500 border-2 border-red-400 scale-110 animate-pulse`;
      case "processing":
        return `${base} bg-[#242424] border-2 border-[#3a3a3a] cursor-not-allowed`;
      case "playing":
        return `${base} bg-green-700 hover:bg-green-600 border-2 border-green-500`;
    }
  };

  const micIcon = () => {
    switch (micState) {
      case "idle":
        return (
          <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v7a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm-7 9a7 7 0 0 0 14 0h2a9 9 0 0 1-8 8.94V23h-2v-2.06A9 9 0 0 1 3 12h2z" />
          </svg>
        );
      case "recording":
        return <div className="w-5 h-5 bg-white rounded-sm" />;
      case "processing":
        return <Spinner />;
      case "playing":
        return <WaveAnimation />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-3">
          <span className="text-white font-semibold">
            Lingua<span className="text-purple-400">Tutor</span>
          </span>
          <span className="text-[#3a3a3a]">·</span>
          <span className="text-gray-400 text-sm">{language}</span>
          <span className="text-[#3a3a3a]">·</span>
          <span className="text-gray-500 text-sm truncate max-w-[180px]">{scenario}</span>
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors border border-[#2a2a2a] hover:border-[#3a3a3a] px-3 py-1.5 rounded-lg"
        >
          End session
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-600 mt-20 text-sm">
            Hold <kbd className="bg-[#2a2a2a] px-2 py-0.5 rounded text-gray-400 text-xs font-mono">SPACE</kbd> or
            press the mic to start speaking
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-purple-900/50 text-gray-100 border border-purple-800/40"
                  : "bg-[#1e1e1e] text-gray-200 border border-[#2a2a2a]"
              }`}
            >
              <p>{msg.text}</p>
              {msg.role === "assistant" && msg.audioUrl && (
                <button
                  onClick={() => replayAudio(msg.audioUrl!)}
                  className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                  </svg>
                  Replay
                </button>
              )}
            </div>
          </div>
        ))}

        {liveText && (
          <div className="flex justify-center">
            <span className="text-gray-500 text-sm italic animate-pulse">{liveText}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Bottom controls */}
      <div className="px-4 pb-8 pt-4 flex flex-col items-center gap-3">
        <button
          onClick={handleMicClick}
          disabled={micState === "processing" || !sessionId}
          className={micButtonClass()}
          aria-label={
            micState === "idle"
              ? "Start recording"
              : micState === "recording"
              ? "Stop recording"
              : micState === "playing"
              ? "Stop playback"
              : "Processing"
          }
        >
          {micIcon()}
          {micState === "recording" && (
            <span className="absolute -inset-2 rounded-full border-2 border-red-400/40 animate-ping" />
          )}
        </button>

        <p className="text-xs text-gray-600">
          {micState === "idle" && "Click or hold SPACE to speak"}
          {micState === "recording" && "Recording... release SPACE or click to send"}
          {micState === "processing" && "Processing your message..."}
          {micState === "playing" && "AI is speaking... click to stop"}
        </p>
      </div>
    </div>
  );
}
