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
  type: "transcript" | "ai_chunk" | "audio" | "done" | "error"
    | "session_created" | "turn_update" | "session_ended" | "demo_ended" | "chips" | "corrections";
  data: Record<string, unknown>;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: string;
  reasoning: string[];
}

export interface DailyNewsData {
  title: string;
  body: string;
  language: string;
  level: string;
  quiz_questions: QuizQuestion[];
  for_date: string;
}

export interface ProgressData {
  current_level: string;
  current_streak: number;
  sessions_this_week: number;
  last_session_score: number | null;
  total_xp: number;
  watch_out_topic: string | null;
}

export async function getProgress(): Promise<ProgressData> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/user/progress`, { headers: auth });
  if (!res.ok) throw new Error("Failed to fetch progress");
  return res.json();
}

export async function getDailyNews(signal?: AbortSignal, force = false): Promise<DailyNewsData> {
  const auth = await getAuthHeader();
  const url = `${API_URL}/api/news/daily${force ? "?force=true" : ""}`;
  const res = await fetch(url, { headers: auth, signal });
  if (!res.ok) throw new Error("Failed to fetch daily news");
  return res.json();
}

async function* _parseSSEStream(res: Response): AsyncGenerator<StreamEvent> {
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
          } catch { /* skip malformed */ }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function endSpeakingSession(sessionId: string): Promise<{ feedback: unknown }> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/speaking/session/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Failed to end session");
  }
  return res.json();
}

export async function* startSpeakingSession(
  scenarioId: string,
  language: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/speaking/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ scenario_id: scenarioId, language }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Failed to start session");
  }
  yield* _parseSSEStream(res);
}

export async function* sendSpeakingTurnText(
  sessionId: string,
  text: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const auth = await getAuthHeader();
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("text", text);
  const res = await fetch(`${API_URL}/api/speaking/turn/text/stream`, {
    method: "POST",
    headers: auth,
    body: form,
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Text turn failed");
  }
  yield* _parseSSEStream(res);
}

export async function* sendSpeakingTurn(
  sessionId: string,
  audioBlob: Blob,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const auth = await getAuthHeader();
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("audio", audioBlob, "recording.webm");
  const res = await fetch(`${API_URL}/api/speaking/turn/stream`, {
    method: "POST",
    headers: auth,
    body: form,
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Stream failed");
  }
  yield* _parseSSEStream(res);
}

// ─── Collection ───────────────────────────────────────────────────────────────

export interface SavedItemData {
  id: string;
  text: string;
  source_type: string;
  source_id: string | null;
  language: string;
  enrichment_status: "pending" | "done" | "failed";
  definition: string | null;
  example: string | null;
  part_of_speech: string | null;
  created_at: string;
}

export async function saveItem(payload: {
  text: string;
  source_type: string;
  source_id?: string;
  language: string;
}): Promise<SavedItemData> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/collection`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Failed to save item");
  }
  return res.json();
}

export async function getSavedItems(sourceType?: string): Promise<SavedItemData[]> {
  const auth = await getAuthHeader();
  const url = sourceType
    ? `${API_URL}/api/collection?source_type=${encodeURIComponent(sourceType)}`
    : `${API_URL}/api/collection`;
  const res = await fetch(url, { headers: auth });
  if (!res.ok) throw new Error("Failed to fetch saved items");
  return res.json();
}

export async function getSavedItem(id: string): Promise<SavedItemData> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/collection/${id}`, { headers: auth });
  if (!res.ok) throw new Error("Failed to fetch saved item");
  return res.json();
}

export async function deleteSavedItem(id: string): Promise<void> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/collection/${id}`, {
    method: "DELETE",
    headers: auth,
  });
  if (!res.ok) throw new Error("Failed to delete saved item");
}

export interface LookupData {
  definition: string;
  example: string | null;
  part_of_speech: string | null;
  synonyms: string[];
}

export interface MistakeItem {
  location: string;
  explanation: string;
}

export interface SentenceCheckResult {
  correct: boolean;
  corrected: string | null;
  feedback: string;
  mistakes: MistakeItem[];
  xp: number;
}

// ─── Vocab / Word of the Day ──────────────────────────────────────────────────

export interface WordOfDayData {
  id: string;
  word: string;
  part_of_speech: string | null;
  language: string;
  level: string | null;
}

export async function getWordOfDay(): Promise<WordOfDayData> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/vocab/word-of-day`, { headers: auth });
  if (!res.ok) throw new Error("Failed to fetch word of the day");
  return res.json();
}

export async function updateWordProgress(
  wordId: string,
  status: "seen" | "learning" | "known"
): Promise<void> {
  const auth = await getAuthHeader();
  await fetch(`${API_URL}/api/vocab/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ word_id: wordId, status }),
  });
}

export async function checkSentence(
  word: string,
  sentence: string,
  language: string
): Promise<SentenceCheckResult> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/collection/check-sentence`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ word, sentence, language }),
  });
  if (!res.ok) throw new Error("Sentence check failed");
  return res.json();
}

export async function lookupText(text: string, language: string): Promise<LookupData> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/collection/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error("Lookup failed");
  return res.json();
}

export async function speakText(text: string, language: string): Promise<ArrayBuffer> {
  const auth = await getAuthHeader();
  const res = await fetch(`${API_URL}/api/collection/tts/speak`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new Error("TTS failed");
  return res.arrayBuffer();
}

// ─── Demo (no auth) ───────────────────────────────────────────────────────────

export async function* startDemoSession(
  name: string,
  level: string,
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${API_URL}/api/demo/session/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, level }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Failed to start demo session");
  }
  yield* _parseSSEStream(res);
}

export async function* sendDemoTurn(
  sessionId: string,
  audioBlob: Blob,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("audio", audioBlob, "recording.webm");
  const res = await fetch(`${API_URL}/api/demo/turn/stream`, {
    method: "POST",
    body: form,
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Demo stream failed");
  }
  yield* _parseSSEStream(res);
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
  yield* _parseSSEStream(res);
}
