"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "German",  label: "German",  flag: "🇩🇪" },
  { code: "English", label: "English", flag: "🇬🇧" },
  { code: "Spanish", label: "Spanish", flag: "🇪🇸" },
  { code: "French",  label: "French",  flag: "🇫🇷" },
  { code: "Italian", label: "Italian", flag: "🇮🇹" },
];

const LEVELS = [
  { code: "A1", label: "Complete beginner",  desc: "Starting from scratch" },
  { code: "A2", label: "I know a little",    desc: "A few words and basic sentences" },
  { code: "B1", label: "Intermediate",       desc: "I can handle everyday conversations" },
  { code: "B2", label: "Good but rusty",     desc: "I understand well but struggle to speak" },
];

const REASONS = [
  { code: "living_abroad", label: "Living in the country", emoji: "🏙" },
  { code: "work",          label: "Work",                  emoji: "💼" },
  { code: "travel",        label: "Travel",                emoji: "✈️" },
  { code: "personal",      label: "Personal interest",     emoji: "❤️" },
];

const GOALS = [
  { value: 10, label: "10 min", desc: "A quick daily coffee break" },
  { value: 20, label: "20 min", desc: "Most popular choice", recommended: true },
  { value: 30, label: "30 min", desc: "Serious progress" },
  { value: 60, label: "1 hour", desc: "Intensive practice" },
];

const INTERESTS = [
  { code: "film_tv",     label: "Film & TV",       emoji: "🎬" },
  { code: "music",       label: "Music",            emoji: "🎵" },
  { code: "food",        label: "Food & Cooking",   emoji: "🍕" },
  { code: "sports",      label: "Sports",           emoji: "⚽" },
  { code: "technology",  label: "Technology",       emoji: "💻" },
  { code: "books",       label: "Books & Lit.",     emoji: "📚" },
  { code: "travel",      label: "Travel",           emoji: "✈️" },
  { code: "gaming",      label: "Gaming",           emoji: "🎮" },
  { code: "animals",     label: "Animals",          emoji: "🐾" },
  { code: "business",    label: "Business",         emoji: "💼" },
  { code: "nature",      label: "Nature",           emoji: "🌿" },
  { code: "art",         label: "Art",              emoji: "🎨" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface DemoSetupData {
  name: string;
  language: string;
  level: string;
  reason: string;
  daily_goal_minutes: number;
  interests: string[];
  intro_sentence: string;
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

function Typewriter({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else clearInterval(iv);
    }, 22);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{displayed}</span>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const TOTAL = 7;

export default function DemoSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animating, setAnimating] = useState(false);

  const [data, setData] = useState<DemoSetupData>({
    name: "",
    language: "",
    level: "",
    reason: "",
    daily_goal_minutes: 0,
    interests: [],
    intro_sentence: "",
  });

  function goTo(next: number, dir: "forward" | "backward" = "forward") {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => { setStep(next); setAnimating(false); }, 220);
  }

  function next() { goTo(step + 1, "forward"); }
  function back() { if (step > 1 && step < 7) goTo(step - 1, "backward"); }

  function pick<K extends keyof DemoSetupData>(key: K, value: DemoSetupData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    // auto-advance for single-select steps
    if (["language", "level", "reason", "daily_goal_minutes"].includes(key as string)) {
      setTimeout(next, 180);
    }
  }

  function handleStart() {
    // Save full profile to sessionStorage so demo page can read it
    sessionStorage.setItem("demoProfile", JSON.stringify(data));
    const params = new URLSearchParams({ name: data.name.trim(), level: data.level });
    router.push(`/demo?${params.toString()}`);
  }

  const slideOut = animating
    ? direction === "forward" ? "-translate-x-8 opacity-0" : "translate-x-8 opacity-0"
    : "translate-x-0 opacity-100";

  return (
    <div className="min-h-screen bg-background flex flex-col font-manrope">

      {/* Nav */}
      <nav className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-surface-lowest border-b border-outline-variant/20">
        <Link href="/landing" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined ms-filled text-[15px] text-white">language</span>
          </div>
          <span className="font-lora font-bold text-sm text-on-surface">
            Lisana <span className="text-primary">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="text-xs text-on-surface-variant hover:text-on-surface transition-colors px-3 py-1.5">
            Log in
          </Link>
          <Link href="/signup" className="text-xs font-semibold text-white bg-primary px-4 py-1.5 rounded-full hover:bg-primary/90 transition-colors">
            Sign up free
          </Link>
        </div>
      </nav>

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
      <div className={`flex-1 flex flex-col items-center justify-center px-6 pb-10 transition-all duration-200 ${slideOut}`}>

        {/* ── Step 1: Name ── */}
        {step === 1 && (
          <div className="w-full max-w-md">
            <h1 className="font-lexend font-bold text-3xl text-on-surface mb-2 text-center">What's your first name?</h1>
            <p className="font-manrope text-sm text-on-surface-variant text-center mb-8">So Maya can greet you properly</p>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && data.name.trim() && next()}
              placeholder="e.g. Sarah"
              maxLength={40}
              autoFocus
              className="w-full px-5 py-4 rounded-2xl border-2 border-outline-variant/60 bg-surface-lowest text-base text-on-surface placeholder-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition mb-4"
            />
            <button
              onClick={next}
              disabled={!data.name.trim()}
              className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 2: Language ── */}
        {step === 2 && (
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
                  <span className="font-semibold text-base text-on-surface">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Level ── */}
        {step === 3 && (
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
                    <p className="font-semibold text-sm text-on-surface">{lvl.label}</p>
                    <p className="text-xs text-on-surface-variant">{lvl.desc}</p>
                  </div>
                  <span className="font-lexend font-bold text-sm text-primary">{lvl.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Reason ── */}
        {step === 4 && (
          <div className="w-full max-w-md">
            <h1 className="font-lexend font-bold text-3xl text-on-surface mb-2 text-center">Why are you learning?</h1>
            <p className="font-manrope text-sm text-on-surface-variant text-center mb-8">Maya adjusts her tone based on your goal</p>
            <div className="grid grid-cols-1 gap-3">
              {REASONS.map((r) => (
                <button
                  key={r.code}
                  onClick={() => pick("reason", r.code)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-150 ${
                    data.reason === r.code
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/30 bg-surface-lowest hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <span className="font-semibold text-sm text-on-surface">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 5: Daily goal ── */}
        {step === 5 && (
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
                      <span className="font-bold text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant">{g.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 6: Interests ── */}
        {step === 6 && (
          <div className="w-full max-w-lg">
            <h1 className="font-lexend font-bold text-3xl text-on-surface mb-2 text-center">What are you into?</h1>
            <p className="font-manrope text-sm text-on-surface-variant text-center mb-8">Maya picks conversation topics from these</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
              {INTERESTS.map((interest) => {
                const selected = data.interests.includes(interest.code);
                return (
                  <button
                    key={interest.code}
                    onClick={() =>
                      setData((d) => ({
                        ...d,
                        interests: selected
                          ? d.interests.filter((i) => i !== interest.code)
                          : [...d.interests, interest.code],
                      }))
                    }
                    className={`flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border-2 transition-all duration-150 ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant/30 bg-surface-lowest hover:border-primary/40"
                    }`}
                  >
                    <span className="text-2xl">{interest.emoji}</span>
                    <span className="text-xs text-on-surface text-center leading-tight">{interest.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={next}
              disabled={data.interests.length === 0}
              className="w-full bg-primary text-white font-bold text-sm py-3.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 7: Intro + Start ── */}
        {step === 7 && (
          <div className="w-full max-w-md">
            <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-6">
              <img src="/maya_icon.svg" alt="Maya" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-lexend font-bold text-2xl text-on-surface mb-3 text-center">
              One last thing, {data.name || "there"}.
            </h1>
            <p className="font-manrope text-sm text-on-surface-variant text-center mb-6">
              Tell Maya a bit about yourself — your job, a show you love, the city you live in…
            </p>
            <textarea
              value={data.intro_sentence}
              onChange={(e) => setData((d) => ({ ...d, intro_sentence: e.target.value }))}
              placeholder="Write something..."
              rows={4}
              className="w-full bg-surface border border-outline-variant/60 rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 resize-none mb-4 transition-colors"
            />

            {/* Scenario hint */}
            <div className="flex items-center gap-3 bg-surface border border-outline-variant/60 rounded-xl px-4 py-3 mb-5">
              <span className="text-lg">🏙️</span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                You&apos;re at a language exchange meetup in Berlin — Maya just walked up to say hi.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleStart}
                className="flex-1 text-white font-bold text-sm py-3.5 rounded-full transition-colors hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #A07DD6 0%, #7C5CBF 100%)", boxShadow: "0 4px 14px rgba(124,92,191,0.30)" }}
              >
                Start talking with Maya →
              </button>
              <button
                onClick={() => { setData((d) => ({ ...d, intro_sentence: "" })); handleStart(); }}
                className="border border-outline-variant/60 text-on-surface-variant font-semibold text-sm px-5 py-3.5 rounded-full hover:bg-surface transition-colors whitespace-nowrap"
              >
                Skip
              </button>
            </div>

            <p className="text-xs text-on-surface-variant/60 text-center mt-4">
              3 free turns · No account needed
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
