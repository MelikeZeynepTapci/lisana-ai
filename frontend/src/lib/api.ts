import { createClient } from "@/lib/supabase";

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

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Oturum bulunamadı. Lütfen giriş yapın.");
  return { Authorization: `Bearer ${token}` };
}

export async function syncUser(): Promise<void> {
  const auth = await getAuthHeader();
  await fetch(`${API_URL}/api/auth/sync`, { method: "POST", headers: auth });
}

export async function createSession(
  language: string,
  scenario: string,
  level = "intermediate"
): Promise<SessionResponse> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/session/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ language, scenario, level }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function sendTurn(
  sessionId: string,
  audioBlob: Blob
): Promise<TurnResponse> {
  const auth = await getAuthHeader();
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("audio", audioBlob, "recording.webm");

  const res = await fetch(`${API_URL}/api/conversation/turn`, {
    method: "POST",
    headers: auth,
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

export interface StreamEvent {
  type: "transcript" | "ai_chunk" | "audio" | "done" | "error";
  data: Record<string, unknown>;
}

export async function* sendTurnStream(
  sessionId: string,
  audioBlob: Blob,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const auth = await getAuthHeader();
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("audio", audioBlob, "recording.webm");

  const res = await fetch(`${API_URL}/api/conversation/turn/stream`, {
    method: "POST",
    headers: auth,
    body: form,
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Stream failed");
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        if (!part.trim()) continue;
        let type = "";
        let dataStr = "";
        for (const line of part.split("\n")) {
          if (line.startsWith("event: ")) type = line.slice(7).trim();
          else if (line.startsWith("data: ")) dataStr = line.slice(6);
        }
        if (type && dataStr) {
          try {
            yield { type: type as StreamEvent["type"], data: JSON.parse(dataStr) };
          } catch {
            // skip malformed event
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
