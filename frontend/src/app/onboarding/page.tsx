"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── Data ───────────────────────────────────────────────
const LANGUAGES = [
  { code: "German", label: "German", flag: "🇩🇪" },
  { code: "English", label: "English", flag: "🇬🇧" },
  { code: "Spanish", label: "Spanish", flag: "🇪🇸" },
  { code: "French", label: "French", flag: "🇫🇷" },
  { code: "Italian", label: "Italian", flag: "🇮🇹" },
];

const LEVELS = [
  { code: "A1", label: "Complete beginner", desc: "Starting from scratch" },
  { code: "A2", label: "I know a little", desc: "A few words and basic sentences" },
  { code: "B1", label: "Intermediate", desc: "I can handle everyday conversations" },
  { code: "B2", label: "Good but rusty", desc: "I understand well but struggle to speak" },
];

const REASONS = [
  { code: "living_abroad", label: "Living in the country", emoji: "🏙" },
  { code: "work", label: "Work", emoji: "💼" },
  { code: "travel", label: "Travel", emoji: "✈️" },
  { code: "personal", label: "Personal interest", emoji: "❤️" },
];

const GOALS = [
  { value: 10, label: "10 min", desc: "A quick daily coffee break" },
  { value: 20, label: "20 min", desc: "Most popular choice", recommended: true },
  { value: 30, label: "30 min", desc: "Serious progress" },
  { value: 60, label: "1 hour", desc: "Intensive practice" },
];

const INTERESTS = [
  { code: "film_tv", label: "Film & TV", emoji: "🎬" },
  { code: "music", label: "Music", emoji: "🎵" },
  { code: "food", label: "Food & Cooking", emoji: "🍕" },
  { code: "sports", label: "Sports", emoji: "⚽" },
  { code: "technology", label: "Technology", emoji: "💻" },
  { code: "books", label: "Books & Literature", emoji: "📚" },
  { code: "travel", label: "Travel", emoji: "✈️" },
  { code: "gaming", label: "Gaming", emoji: "🎮" },
  { code: "animals", label: "Animals", emoji: "🐾" },
  { code: "business", label: "Business", emoji: "💼" },
  { code: "nature", label: "Nature", emoji: "🌿" },
  { code: "art", label: "Art", emoji: "🎨" },
];

// ─── Types ───────────────────────────────────────────────
interface OnboardingData {
  language: string;
  level: string;
  focus: string;
  daily_goal_minutes: number;
  interests: string[];
  intro_sentence: string;
  city: string;
}

// ─── Typewriter ──────────────────────────────────────────
function Typewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 22);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}</span>;
}

// ─── Main ────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animating, setAnimating] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    language: "",
    level: "",
    focus: "",
    daily_goal_minutes: 0,
    interests: [],
    intro_sentence: "",
    city: "",
  });
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [welcomeLoading, setWelcomeLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const TOTAL = 7;

  function goTo(next: number, dir: "forward" | "backward" = "forward") {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 220);
  }

  function next() { goTo(step + 1, "forward"); }
  function back() { if (step > 1 && step < 7) goTo(step - 1, "backward"); }

  function pick<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    if (step < 5) setTimeout(next, 180);
  }

  // Fetch welcome message when reaching step 7
  useEffect(() => {
    if (step !== 7 || welcomeMsg || welcomeLoading) return;
    setWelcomeLoading(true);

    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: s }) => {
      const token = s.session?.access_token;
      if (!token) return;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`${API_URL}/api/onboarding/welcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            language: data.language,
            level: data.level,
            focus: data.focus,
            interests: data.interests,
            intro_sentence: data.intro_sentence,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const json = await res.json();
        setWelcomeMsg(json.message);
      } catch {
        setWelcomeMsg("Great, I've been waiting for you! Let's get started.");
      } finally {
        setWelcomeLoading(false);
      }
    });
  }, [step]);

  async function handleComplete() {
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;
    if (!token) {
      setSaveError("Session not found. Please sign in again.");
      setSaving(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      await fetch(`${API_URL}/api/onboarding/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
    } catch {
      // Backend unreachable — continue anyway, data will sync on next login
    }

    try {
      await supabase.auth.updateUser({ data: { onboarding_completed: true } });
      router.push("/");
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const slideOut = animating
    ? direction === "forward"
      ? "-translate-x-8 opacity-0"
      : "translate-x-8 opacity-0"
    : "translate-x-0 opacity-100";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-surface-highest w-full">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${((step - 1) / (TOTAL - 1)) * 100}%` }}
        />
      </div>

      {/* Back button */}
      <div className="h-12 flex items-center px-6">
        {step > 1 && step < 7 && (
          <button onClick={back} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        )}
      </div>

      {/* Step content */}
      <div className={`flex-1 flex flex-col items-center justify-center px-6 transition-all duration-200 ${slideOut}`}>

        {/* ── Step 1: Language ── */}
        {step === 1 && (
          <div className="w-full max-w-md">
            <h1 className="font-lexend font-bold text-3xl text-on-surface mb-2 text-center">Which language do you want to learn?</h1>
            <p className="font-manrope text-sm text-on-surface-variant text-center mb-8">You can change this anytime</p>
            <div className="grid grid-cols-1 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => pick("language", lang.code)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-150 ${
                    data.language === lang.code
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/30 bg-surface-lowest hover:border-primary/40"
                  }`}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className="font-manrope font-semibold text-base text-on-surface">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Level ── */}
        {step === 2 && (
          <div className="w-full max-w-md">
            <h1 className="font-lexend font-bold text-3xl text-on-surface mb-2 text-center">What's your {data.language} level?</h1>
            <p className="font-manrope text-sm text-on-surface-variant text-center mb-8">Be honest — Maya will adjust to you</p>
            <div className="grid grid-cols-1 gap-3">
              {LEVELS.map((lvl) => (
                <button
                  key={lvl.code}
                  onClick={() => pick("level", lvl.code)}
                  className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-150 ${
                    data.level === lvl.code
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/30 bg-surface-lowest hover:border-primary/40"
                  }`}
                >
                  <div className="text-left">
                    <p className="font-manrope font-semibold text-sm text-on-surface">{lvl.label}</p>
                    <p className="font-manrope text-xs text-on-surface-variant">{lvl.desc}</p>
                  </div>
                  <span className="font-lexend font-bold text-sm text-primary">{lvl.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Focus ── */}
        {step === 3 && (
          <div className="w-full max-w-md">
            <h1 className="font-lexend font-bold text-3xl text-on-surface mb-2 text-center">What should Maya help you with most?</h1>
            <p className="font-manrope text-sm text-on-surface-variant text-center mb-6">This shapes every conversation and exercise</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { code: "local_life",  emoji: "🏙", label: "Live like a local",          desc: "Daily life, bureaucracy, real-world situations" },
                { code: "relocate",    emoji: "🧳", label: "Prepare to move there",      desc: "Settling in, housing, first weeks, culture" },
                { code: "work",        emoji: "💼", label: "Work confidently",            desc: "Meetings, emails, professional talk" },
                { code: "travel",      emoji: "✈️", label: "Travel with ease",            desc: "Ordering, directions, casual interactions" },
                { code: "connect",     emoji: "❤️", label: "Connect with people",         desc: "Friends, dating, natural conversations" },
                { code: "culture",     emoji: "🌍", label: "Learn the language & culture", desc: "How people really speak and live" },
                { code: "exam",        emoji: "📝", label: "Prepare for an exam",         desc: "IELTS, TestDAF, DELE, Goethe, and more" },
              ].map((f) => (
                <button
                  key={f.code}
                  onClick={() => pick("focus", f.code)}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all duration-150 text-left ${
                    data.focus === f.code
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/30 bg-surface-lowest hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl flex-shrink-0">{f.emoji}</span>
                  <div>
                    <p className="font-manrope font-semibold text-sm text-on-surface">{f.label}</p>
                    <p className="font-manrope text-xs text-on-surface-variant">{f.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Daily goal ── */}
        {step === 4 && (
          <div className="w-full max-w-md">
            <h1 className="font-lexend font-bold text-3xl text-on-surface mb-2 text-center">What's your daily goal?</h1>
            <p className="font-manrope text-sm text-on-surface-variant text-center mb-8">Pick something realistic — small consistent steps work</p>
            <div className="grid grid-cols-1 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => pick("daily_goal_minutes", g.value)}
                  className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all duration-150 ${
                    data.daily_goal_minutes === g.value
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/30 bg-surface-lowest hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-lexend font-bold text-base text-on-surface">{g.label}</span>
                    {g.recommended && (
                      <span className="font-manrope font-bold text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="font-manrope text-xs text-on-surface-variant">{g.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 5: Interests ── */}
        {step === 5 && (
          <div className="w-full max-w-lg">
            <h1 className="font-lexend font-bold text-3xl text-on-surface mb-2 text-center">What are you into?</h1>
            <p className="font-manrope text-sm text-on-surface-variant text-center mb-8">Maya picks conversation topics from these</p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {INTERESTS.map((interest) => {
                const selected = data.interests.includes(interest.code);
                return (
                  <button
                    key={interest.code}
                    onClick={() => {
                      setData((d) => ({
                        ...d,
                        interests: selected
                          ? d.interests.filter((i) => i !== interest.code)
                          : [...d.interests, interest.code],
                      }));
                    }}
                    className={`flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border-2 transition-all duration-150 ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant/30 bg-surface-lowest hover:border-primary/40"
                    }`}
                  >
                    <span className="text-2xl">{interest.emoji}</span>
                    <span className="font-manrope text-xs text-on-surface text-center leading-tight">{interest.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={next}
              disabled={data.interests.length === 0}
              className="w-full bg-primary text-white font-manrope font-bold text-sm py-3.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 6: Intro ── */}
        {step === 6 && (
          <div className="w-full max-w-md">
            <div className="w-14 h-14 bg-primary-container/60 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined ms-filled text-[28px] text-primary">smart_toy</span>
            </div>
            <h1 className="font-lexend font-bold text-2xl text-on-surface mb-3 text-center">I'd love to get to know you.</h1>
            <p className="font-manrope text-sm text-on-surface-variant text-center mb-6">
              The more you share, the more personalized your experience becomes.
            </p>
            <div className="mb-4">
              <label className="font-manrope font-semibold text-sm text-on-surface mb-0.5 flex items-center gap-1.5">
                Which city should we prepare you for?
                <span className="font-normal text-xs text-on-surface-variant/60">(optional)</span>
              </label>
              <p className="font-manrope text-xs text-on-surface-variant mb-2">Recommended for local language, culture, and real-life scenarios.</p>
              <div className="flex flex-wrap gap-2 mb-2.5">
                {[
                  { flag: "🇦🇹", city: "Vienna" },
                  { flag: "🇩🇪", city: "Berlin" },
                  { flag: "🇩🇪", city: "Hamburg" },
                  { flag: "🇳🇱", city: "Amsterdam" },
                  { flag: "🇪🇸", city: "Barcelona" },
                  { flag: "🇫🇷", city: "Paris" },
                  { flag: "🇨🇭", city: "Zurich" },
                  { flag: "🇬🇧", city: "London" },
                ].map(({ flag, city }) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setData((d) => ({ ...d, city: d.city === city ? "" : city }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-manrope font-semibold transition-all duration-150 ${
                      data.city === city
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-outline-variant/40 bg-surface-low text-on-surface hover:border-primary/40"
                    }`}
                  >
                    <span>{flag}</span>{city}
                  </button>
                ))}
              </div>
              {/* Free-text input with datalist autocomplete */}
              <input
                type="text"
                list="city-suggestions"
                value={data.city}
                onChange={(e) => setData((d) => ({ ...d, city: e.target.value }))}
                placeholder="Or type any city or country..."
                className="w-full bg-surface-low border border-outline-variant/40 rounded-2xl px-4 py-3 font-manrope text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 transition-colors"
              />
              <datalist id="city-suggestions">
                {["Vienna", "Berlin", "Hamburg", "Munich", "Frankfurt", "Cologne", "Amsterdam", "Rotterdam", "Barcelona", "Madrid", "Paris", "Zurich", "Geneva", "London", "Rome", "Milan", "Lisbon", "Brussels", "Prague", "Warsaw"].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="mb-4">
              <label className="font-manrope font-semibold text-sm text-on-surface mb-0.5 block">
                What should Maya know about you?
                <span className="font-normal text-xs text-on-surface-variant/60 ml-1.5">(optional)</span>
              </label>
              <p className="font-manrope text-xs text-on-surface-variant mb-2">Your job, interests, goals, or anything that helps Maya tailor conversations to you.</p>
            <textarea
              value={data.intro_sentence}
              onChange={(e) => setData((d) => ({ ...d, intro_sentence: e.target.value }))}
                placeholder="e.g. I'm a software engineer moving to Vienna for work, and I love hiking and coffee shops."
              rows={3}
                className="w-full bg-surface-low border border-outline-variant/40 rounded-2xl px-4 py-3 font-manrope text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 resize-none transition-colors"
            />
            </div>
            <div className="flex gap-3">
              <button
                onClick={next}
                className="flex-1 bg-primary text-white font-manrope font-bold text-sm py-3.5 rounded-full hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => { setData((d) => ({ ...d, intro_sentence: "" })); next(); }}
                className="flex-1 border border-outline-variant/40 text-on-surface-variant font-manrope font-semibold text-sm py-3.5 rounded-full hover:bg-surface-highest/40 transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Step 7: Welcome ── */}
        {step === 7 && (
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-primary-container/60 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined ms-filled text-[32px] text-primary">smart_toy</span>
            </div>
            <div className="bg-surface-lowest border border-outline-variant/20 rounded-3xl px-6 py-6 mb-8 text-left shadow-ambient-sm min-h-[120px] flex items-center">
              {welcomeLoading ? (
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
              ) : (
                <p className="font-manrope text-sm text-on-surface leading-relaxed whitespace-pre-line">
                  <Typewriter text={welcomeMsg} />
                </p>
              )}
            </div>
            <button
              onClick={handleComplete}
              disabled={saving || welcomeLoading}
              className="w-full bg-primary text-white font-manrope font-bold text-sm py-4 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Start talking with Maya
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
            {saveError && (
              <p className="font-manrope text-xs text-error text-center mt-3">{saveError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
