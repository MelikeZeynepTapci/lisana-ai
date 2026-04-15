import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: "auto_awesome",
    iconBg: "bg-primary-container",
    iconColor: "text-primary",
    image: "/Innovation-pana.png", 
    title: "A coach who actually knows you.",
    body: "Maya remembers every session. She tracks your recurring mistakes, adapts to your level, and brings up your interests naturally in conversation. Whether you're preparing for a job interview or practicing small talk, she adjusts. It feels like a private tutor, available 24 hours a day, 7 days a week.",
    details: [
      "Real-life scenario categories: office, shopping, travel, restaurant, job interview and more",
      "Instant feedback on grammar and vocabulary. Naturally, without interrupting the flow",
      "Long-term memory: Maya remembers what you struggled with last week",
    ],
  },
  {
    icon: "group",
    iconBg: "bg-tertiary-container",
    iconColor: "text-tertiary",
    image: "/connected_people.png", // TODO: replace with LinguaRooms screenshot
    title: "Practice with real people, matched to your level.",
    body: "LinguaRooms are 10-minute live group text chat sessions with 2–3 other learners at the same level and with similar interests. AI kicks off the conversation with a topic and fills any empty seats, so the room always works, even on day one.",
    details: [
      "Matched by language level (A1 to C1) and interests from your profile",
      "AI moderates and evaluates. No human required to run the room",
      "XP and streak rewards for every completed session",
    ],
  },
  {
    icon: "mic",
    iconBg: "bg-secondary-container",
    iconColor: "text-secondary",
    image: null, // TODO: replace with pronunciation exercise screenshot
    title: "Sound like you belong there.",
    body: "Every day, five curated sentences at your level, the same ones for everyone at your stage. Read them out loud, get an instant pronunciation score, and earn your daily XP. It takes five minutes and it keeps your streak alive.",
    details: [
      "Powered by Azure Pronunciation Assessment",
      "New sentences every day, calibrated to your CEFR level",
      "Scores on accuracy, fluency, and completeness",
    ],
  },
  {
    icon: "description",
    iconBg: "bg-surface-highest",
    iconColor: "text-on-surface",
    image: null, // TODO: replace with printables screenshot
    title: "A study plan built from your actual progress.",
    body: "Every two weeks, Lisana generates a personalised PDF study plan based on your real session history, vocabulary gaps, and recurring mistakes. Download it, print it, follow it. No generic plans, only what you actually need.",
    details: [
      "Generated from your real data — not a template",
      "Weekly and monthly formats available",
      "Available twice per month on Pro",
    ],
  },
];

const problems = [
  {
    icon: "sports_esports",
    title: "It feels like a game.",
    body: "You collect streaks, earn hearts, and memorize vocabulary. But when a real conversation happens, your mind goes blank. Duolingo doesn't prepare you to speak, it prepares you to play.",
  },
  {
    icon: "smart_toy",
    title: "The AI sounds like a robot.",
    body: "Existing AI apps give you stiff, scripted conversations with no memory of who you are. Every session starts from zero. There's no real coach, just a chatbot with a language learning skin.",
  },
  {
    icon: "payments",
    title: "Good tutors are too expensive.",
    body: "A quality language tutor costs €30–80 per hour, and you can only afford one or two sessions a week. That's not enough practice to make real progress.",
  },
];

const steps = [
  {
    icon: "💬",
    title: "Talk to Maya — no signup needed.",
    body: "Open the app and start a real conversation immediately. No account, no credit card, no form to fill out. Just pick a language and speak.",
  },
  {
    icon: "👤",
    title: "Tell Maya about yourself.",
    body: "A quick 5-question setup — your language, level, goals, and interests. Maya uses this to personalise every conversation from day one. Takes under a minute.",
  },
  {
    icon: "🔥",
    title: "Practice daily. Watch yourself improve.",
    body: "Twenty minutes a day with Maya, pronunciation drills, and LinguaRooms. Maya remembers everything. Your progress is tracked, your weaknesses addressed. This is how fluency actually happens.",
  },
];

const testimonials = [
  {
    quote: "I moved to Germany and my German was nowhere near good enough for work. After two months of daily Maya sessions I started attending meetings without panic. Nothing else worked for me like this.",
    name: "Ahmet K.",
    role: "Turkish expat living in Berlin",
  },
  {
    quote: "I had a 300-day Duolingo streak and still couldn't hold a real conversation. Three weeks with Lisana and I gave my first full presentation in German at work.",
    name: "Priya S.",
    role: "Expat in London",
  },
  {
    quote: "I'm preparing for IELTS. Maya simulates the speaking section exactly and gives me feedback on every single turn. My band score went from 6.0 to 7.5 in six weeks.",
    name: "Marco L.",
    role: "Preparing for IELTS in Milan",
  },
  {
    quote: "As an ERASMUS student in Vienna, I needed German fast. LinguaRooms is the only place I found other people at exactly my level to practice with. The AI feedback after each session is actually useful.",
    name: "Yuki T.",
    role: "ERASMUS student in Vienna",
  },
];

const faqs = [
  {
    q: "Do I really not need a credit card to start?",
    a: "Correct. The Test Drive is completely free — no account, no card, no form. You have one real conversation with Maya before committing to anything.",
  },
  {
    q: "How is Lisana different from just using ChatGPT?",
    a: "ChatGPT has no memory of your learning history, doesn't evaluate your language performance, and isn't designed around conversation practice. Maya remembers every session, tracks your mistakes, adapts to your level, and gives you structured feedback. It's built for learning, not just chatting.",
  },
  {
    q: "What happens after the 7-day trial?",
    a: "If you don't cancel before the trial ends, you'll be charged €15 for your first month. You can cancel anytime from your account settings — no hoops, no emails required.",
  },
  {
    q: "Can I switch languages?",
    a: "Yes. You can learn multiple languages independently. Each language has its own progress tracker, vocabulary list, streak, and Maya history.",
  },
  {
    q: "Is my conversation data private?",
    a: "Yes. Your conversations with Maya are used only to personalise your learning experience. We don't share your data with third parties. Lisana is built and hosted in the EU, compliant with GDPR.",
  },
  {
    q: "I'm a complete beginner. Can I still use Lisana?",
    a: "Yes. Maya adapts to A1 level — she speaks slowly, uses simple vocabulary, and guides you step by step. The onboarding will set your starting level and Maya will calibrate from there.",
  },
];

const segments = [
  {
    icon: "🏙",
    title: "Expats and immigrants",
    body: "You're not learning a language as a hobby. You need it to navigate daily life — doctors, landlords, colleagues, bureaucracy. Maya is designed for exactly this.",
  },
  {
    icon: "🎓",
    title: "International and ERASMUS students",
    body: "You're dropped into a new country with a new language and very little time. Lisana gets you conversational fast — and LinguaRooms connects you with students in the same situation.",
  },
  {
    icon: "💼",
    title: "Professionals",
    body: "You need the language for work — meetings, emails, presentations, negotiations. Maya focuses on the vocabulary and scenarios that matter for your career.",
  },
  {
    icon: "📝",
    title: "Exam candidates",
    body: "Preparing for IELTS, TOEFL, TestDAF, Goethe, DELE, or DELF? Maya practices the speaking sections with you, evaluates your answers against the real rubrics, and tracks where you need to improve.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined ms-filled text-[18px] text-white">language</span>
            </div>
            <span className="font-lexend font-bold text-base text-on-surface">Lisana <span className="text-primary">AI</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="font-manrope font-semibold text-sm text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="font-manrope font-bold text-sm bg-primary text-white px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="animate-fade-up delay-100 inline-flex items-center gap-2 bg-primary-container/40 text-primary font-manrope font-semibold text-xs px-4 py-2 rounded-full mb-6">
          <span className="material-symbols-outlined ms-filled text-[14px]">auto_awesome</span>
          No credit card required
        </div>
        <h1 className="animate-fade-up delay-200 font-lexend font-bold text-4xl md:text-5xl text-on-surface leading-tight mb-6 max-w-3xl mx-auto" style={{ textShadow: "1px 2px 0px rgba(114,89,145,0.12), 0 8px 24px rgba(114,89,145,0.10)" }}>
          Your first real conversation<br />starts here.
        </h1>
        <p className="animate-fade-up delay-300 font-manrope text-lg text-on-surface-variant leading-relaxed mb-10 max-w-2xl mx-auto">
          Lisana is an AI-powered language learning platform built around real conversation.
          At its core is Maya, your personal AI coach who remembers your mistakes, adapts to your goals, and helps you speak naturally.
        </p>
        <div className="animate-fade-up delay-400 flex flex-col items-center gap-1.5 mb-4">
          <Link
            href="/demo"
            className="animate-float font-manrope font-bold text-base bg-tertiary-container text-on-surface px-8 py-4 rounded-full hover:bg-tertiary-container/80 transition-colors flex items-center gap-2" style={{ boxShadow: "0 8px 24px rgba(34,112,95,0.20)" }}
          >
            <span className="material-symbols-outlined ms-filled text-[18px]">play_circle</span>
            Try Maya first
          </Link>
          <p className="font-manrope text-xs text-on-surface-variant text-center mt-2">Try a free conversation and<br />receive instant feedback from Maya.</p>
        </div>

        {/* Conversation preview */}
        <div className="animate-fade-up delay-500 mt-14 max-w-lg mx-auto bg-surface-lowest rounded-4xl shadow-ambient-lg p-6 text-left">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-outline-variant/20">
            <span className="material-symbols-outlined ms-filled text-[14px] text-on-surface-variant">location_on</span>
            <span className="font-manrope text-xs text-on-surface-variant">Scenario: Language exchange meetup in Berlin</span>
            <span className="ml-auto font-manrope font-semibold text-xs text-tertiary bg-tertiary-container/40 px-2.5 py-1 rounded-full">Daily Conversation</span>
          </div>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined ms-filled text-[18px] text-white">auto_awesome</span>
            </div>
            <div className="flex-1">
              <p className="font-manrope font-semibold text-xs text-primary mb-1">Lena · Maya</p>
              <div className="bg-primary-container/30 rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="font-manrope text-sm text-on-surface leading-relaxed">
                  Hey, ich bin Maya! Schön, dich kennenzulernen. Bist du das erste Mal bei so einem Sprachaustausch?
                </p>
                <p className="font-manrope text-xs text-on-surface-variant/70 italic mt-1.5">
                  Hey, I&apos;m Maya! Nice to meet you. Is this your first time at a language exchange?
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full">
              <span className="material-symbols-outlined ms-filled text-[18px]">mic</span>
              <span className="font-manrope font-bold text-sm">Speak</span>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="bg-surface-low border-y border-outline-variant/20 py-5">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined ms-filled text-[18px] text-secondary">language</span>
            <span className="font-manrope font-semibold text-sm text-on-surface">5 languages</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined ms-filled text-[18px] text-secondary">schedule</span>
            <span className="font-manrope font-semibold text-sm text-on-surface">Available 24/7</span>
          </div>
          <div className="hidden sm:block text-on-surface-variant font-manrope text-sm italic">
            &ldquo;The most natural AI conversation I&apos;ve tried.&rdquo;
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">
            Why most language apps don&apos;t make you fluent.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p) => (
            <div key={p.title} className="bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm">
              <div className="w-10 h-10 bg-error-container rounded-2xl flex items-center justify-center mb-4">
                <span className="material-symbols-outlined ms-filled text-[20px] text-error">{p.icon}</span>
              </div>
              <h3 className="font-lexend font-bold text-lg text-on-surface mb-2">{p.title}</h3>
              <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUTION INTRO */}
      <section className="bg-primary-container/20 border-y border-primary-container py-16 text-center px-6">
        <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface mb-3">
          Lisana is built differently.
        </h2>
        <p className="font-manrope text-base text-on-surface-variant max-w-xl mx-auto">
          Real conversation practice, a coach who knows you, and a community to practice with all in one place.
        </p>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-20 space-y-16">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-10 items-center`}
          >
            <div className="flex-1">
              <div className={`w-12 h-12 ${f.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                <span className={`material-symbols-outlined ms-filled text-[24px] ${f.iconColor}`}>{f.icon}</span>
              </div>
              <h3 className="font-lexend font-bold text-2xl text-on-surface mb-3">{f.title}</h3>
              <p className="font-manrope text-sm text-on-surface-variant leading-relaxed mb-5">{f.body}</p>
              <ul className="space-y-2">
                {f.details.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span className="material-symbols-outlined ms-filled text-[16px] text-tertiary mt-0.5 flex-shrink-0">check_circle</span>
                    <span className="font-manrope text-sm text-on-surface-variant">{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 bg-transparent rounded-4xl overflow-hidden min-h-[280px]">              
            {f.image ? (
                <Image
                  src={f.image}
                  alt={f.title}
                  width={600}
                  height={400}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className={`w-full h-full min-h-[280px] ${f.iconBg} flex flex-col items-center justify-center gap-3 opacity-60`}>
                  <span className={`material-symbols-outlined ms-filled text-[56px] ${f.iconColor}`}>{f.icon}</span>
                  <span className={`font-manrope text-xs font-semibold ${f.iconColor} uppercase tracking-widest`}>Coming soon</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* LANGUAGES */}
      <section className="bg-surface-low border-y border-outline-variant/20 py-16 text-center px-6">
        <h2 className="font-lexend font-bold text-3xl text-on-surface mb-4">Five languages. Every level.</h2>
        <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
          {["🇩🇪 German", "🇬🇧 English", "🇪🇸 Spanish", "🇫🇷 French", "🇮🇹 Italian"].map((lang) => (
            <span key={lang} className="font-manrope font-semibold text-base text-on-surface bg-surface-lowest px-5 py-2.5 rounded-full shadow-ambient-sm">
              {lang}
            </span>
          ))}
        </div>
        <p className="font-manrope text-sm text-on-surface-variant">
          From A1 to C1 · CEFR-aligned progress
        </p>
      </section>

      {/* COMPARISON */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">How Lisana compares.</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-surface-lowest rounded-4xl shadow-ambient-sm overflow-hidden">
            <thead>
              <tr className="border-b border-outline-variant/20">
                <th className="text-left font-manrope font-semibold text-sm text-on-surface-variant px-6 py-4">Feature</th>
                <th className="font-lexend font-bold text-sm text-primary px-6 py-4">Lisana AI</th>
                <th className="font-manrope font-semibold text-sm text-on-surface-variant px-6 py-4">X</th>
                <th className="font-manrope font-semibold text-sm text-on-surface-variant px-6 py-4">Y</th>
                <th className="font-manrope font-semibold text-sm text-on-surface-variant px-6 py-4">Z</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["No credit card to start", true, true, false, false],
                ["AI coach with long-term memory", true, false, false, false],
                ["Live peer practice rooms", true, false, false, false],
                ["Pronunciation assessment", true, false, false, false],
                ["Personalised PDF study plans", true, false, false, false],
                ["Real scenario conversations", true, false, true, true],
              ].map(([label, ...vals]) => (
                <tr key={label as string} className="border-b border-outline-variant/10 last:border-0">
                  <td className="font-manrope text-sm text-on-surface px-6 py-3.5">{label as string}</td>
                  {vals.map((v, i) => (
                    <td key={i} className="text-center px-6 py-3.5">
                      {v ? (
                        <span className="material-symbols-outlined ms-filled text-[18px] text-tertiary">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px] text-outline-variant">cancel</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="font-manrope text-sm text-on-surface px-6 py-3.5">Starting price</td>
                <td className="text-center px-6 py-3.5 font-manrope font-bold text-sm text-primary">€0</td>
                <td className="text-center px-6 py-3.5 font-manrope text-sm text-on-surface-variant">$0</td>
                <td className="text-center px-6 py-3.5 font-manrope text-sm text-on-surface-variant">$15/mo</td>
                <td className="text-center px-6 py-3.5 font-manrope text-sm text-on-surface-variant">$20/mo</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-primary-container/10 border-y border-primary-container/30 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">
              Three steps. Less than two minutes.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="w-14 h-14 bg-surface-lowest rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-ambient-sm text-2xl">
                  {s.icon}
                </div>
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="font-lexend font-bold text-xs text-white">{i + 1}</span>
                </div>
                <h3 className="font-lexend font-bold text-base text-on-surface mb-2">{s.title}</h3>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-4">
          <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface mb-3">
          Practice more. Pay less. Improve faster. 
          </h2>
          <p className="font-manrope text-sm text-on-surface-variant max-w-xl mx-auto">
            One private tutor session costs €50. Lisana Pro costs €15 per month — with unlimited practice, a coach who never forgets you, and a community to practice with.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-10">
          {/* Free */}
          <div className="bg-surface-lowest rounded-4xl p-8 shadow-ambient-sm border border-outline-variant/20">
            <p className="font-manrope font-semibold text-sm text-on-surface-variant mb-1">Free</p>
            <p className="font-lexend font-bold text-4xl text-on-surface mb-1">€0</p>
            <p className="font-manrope text-xs text-on-surface-variant mb-6">forever</p>
            <ul className="space-y-2.5 mb-8">
              {[
                "3 AI conversation sessions per day",
                "Daily pronunciation exercise",
                "Daily word and news quiz",
                "LinguaRooms — 3 sessions per week",
                "Basic progress dashboard",
                "1 Printable study plan per month",
                "150 XP daily cap",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="material-symbols-outlined ms-filled text-[16px] text-tertiary mt-0.5 flex-shrink-0">check_circle</span>
                  <span className="font-manrope text-sm text-on-surface">{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center font-manrope font-bold text-sm border-2 border-primary text-primary py-3.5 rounded-full hover:bg-primary-container/30 transition-colors"
            >
              Start Free
            </Link>
          </div>
          {/* Pro */}
          <div className="bg-primary rounded-4xl p-8 shadow-ambient-lg relative overflow-hidden">
            <div className="absolute top-5 right-5 bg-white/20 text-white font-manrope font-bold text-xs px-3 py-1 rounded-full">
              Recommended
            </div>
            <p className="font-manrope font-semibold text-sm text-white/70 mb-1">Pro</p>
            <div className="flex items-end gap-2 mb-1">
              <p className="font-lexend font-bold text-4xl text-white">€15</p>
              <p className="font-manrope text-sm text-white/70 mb-1.5">/ month</p>
            </div>
            <p className="font-manrope text-xs text-white/60 mb-6">or €120/year (save 33%)</p>
            <ul className="space-y-2.5 mb-8">
              {[
                "Everything in Free, plus:",
                "Unlimited AI conversation sessions",
                "Maya long-term memory",
                "LinguaRooms — unlimited + priority matching",
                "Detailed analytics and AI recommendations",
                "2 Printable study plans per month",
                "3 Streak Freeze tokens per month",
                "Real-time leaderboard",
                "No daily XP cap",
              ].map((item, i) => (
                <li key={item} className={`flex items-start gap-2 ${i === 0 ? "opacity-60" : ""}`}>
                  {i > 0 && <span className="material-symbols-outlined ms-filled text-[16px] text-white/80 mt-0.5 flex-shrink-0">check_circle</span>}
                  <span className={`font-manrope text-sm text-white ${i === 0 ? "font-semibold" : ""}`}>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center font-manrope font-bold text-sm bg-white text-primary py-3.5 rounded-full hover:bg-white/90 transition-colors"
            >
              Try Free for 7 Days →
            </Link>
          </div>
        </div>
        <p className="text-center font-manrope text-xs text-on-surface-variant mt-5">
          7-day free trial included. Cancel anytime before it ends and you won&apos;t be charged. No questions asked.
        </p>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-surface-low border-y border-outline-variant/20 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">What learners are saying.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined ms-filled text-[16px] text-secondary">star</span>
                  ))}
                </div>
                <p className="font-manrope text-sm text-on-surface leading-relaxed mb-4 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-manrope font-bold text-sm text-on-surface">{t.name}</p>
                  <p className="font-manrope text-xs text-on-surface-variant">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT FOR */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-lexend font-bold text-3xl md:text-4xl text-on-surface">
            Built for people who actually need the language.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {segments.map((s) => (
            <div key={s.title} className="bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm flex gap-4">
              <div className="text-3xl flex-shrink-0">{s.icon}</div>
              <div>
                <h3 className="font-lexend font-bold text-base text-on-surface mb-1">{s.title}</h3>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface-low border-y border-outline-variant/20 py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-lexend font-bold text-3xl text-on-surface">Questions? Here are the answers.</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-surface-lowest rounded-3xl p-6 shadow-ambient-sm">
                <h3 className="font-manrope font-bold text-sm text-on-surface mb-2">{faq.q}</h3>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 text-center bg-primary">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-lexend font-bold text-4xl md:text-5xl text-white mb-4">
            Start speaking today.
          </h2>
          <p className="font-manrope text-base text-white/80 mb-10">
            One conversation with Maya. No credit card. No account. See the difference in two minutes.
          </p>
          <Link
            href="/signup"
            className="inline-block font-manrope font-bold text-base bg-white text-primary px-10 py-4 rounded-full hover:bg-white/90 transition-colors shadow-ambient-xl"
          >
            Talk to Maya — It&apos;s Free →
          </Link>
          <p className="font-manrope text-xs text-white/60 mt-4">
            No credit card required · No account needed · Start in 2 minutes
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-background border-t border-outline-variant/20 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
            <div>
              <Link href="/landing" className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined ms-filled text-[15px] text-white">language</span>
                </div>
                <span className="font-lexend font-bold text-sm text-on-surface">Lisana <span className="text-primary">AI</span></span>
              </Link>
              <p className="font-manrope text-xs text-on-surface-variant max-w-xs">
                Real conversations, real progress.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["German", "English", "Spanish", "French", "Italian"].map((lang) => (
                  <span key={lang} className="font-manrope text-xs text-on-surface-variant bg-surface-high px-3 py-1 rounded-full">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-16">
              <div>
                <p className="font-manrope font-bold text-xs text-on-surface uppercase tracking-wide mb-3">Company</p>
                <div className="space-y-2">
                  {["About", "Blog", "Contact", "Careers"].map((link) => (
                    <p key={link} className="font-manrope text-sm text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors">
                      {link}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-manrope font-bold text-xs text-on-surface uppercase tracking-wide mb-3">Legal</p>
                <div className="space-y-2">
                  {["Privacy Policy", "Terms of Service", "GDPR", "Cookie Policy"].map((link) => (
                    <p key={link} className="font-manrope text-sm text-on-surface-variant hover:text-on-surface cursor-pointer transition-colors">
                      {link}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-outline-variant/20 pt-6">
            <p className="font-manrope text-xs text-on-surface-variant text-center">
              © 2026 Lisana · Vienna, Austria
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
