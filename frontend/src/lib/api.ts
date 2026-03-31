const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SessionResponse {
  session_id: string;
  language: string;
  scenario: string;
  level: string;
  created_at: string;
}

export interface TurnResponse {
  user_transcript: string;
  ai_text: string;
  audio_url: string;
  latency_ms: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  audio_url: string | null;
  created_at: string;
}

export async function createSession(
  language: string,
  scenario: string,
  level = "intermediate"
): Promise<SessionResponse> {
  const res = await fetch(`${API_URL}/api/session/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, scenario, level }),
  });
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function sendTurn(
  sessionId: string,
  audioBlob: Blob
): Promise<TurnResponse> {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("audio", audioBlob, "recording.webm");

  const res = await fetch(`${API_URL}/api/conversation/turn`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to process turn");
  }
  return res.json();
}

export function getAudioUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}
