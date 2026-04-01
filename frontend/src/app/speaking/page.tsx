import Header from "@/components/layout/Header";
import Link from "next/link";

const scenarios = [
  {
    emoji: "🛒",
    title: "At the Supermarket",
    level: "A1",
    levelColor: "bg-tertiary-container text-tertiary-on-container",
    desc: "Navigate the aisles, ask for specific items, and handle the checkout process smoothly.",
  },
  {
    emoji: "💬",
    title: "Daily Conversation",
    level: "A1",
    levelColor: "bg-tertiary-container text-tertiary-on-container",
    desc: "Practice small talk, introducing yourself, and basic everyday interactions with strangers.",
  },
  {
    emoji: "☕",
    title: "At a Café",
    level: "A1",
    levelColor: "bg-tertiary-container text-tertiary-on-container",
    desc: "Order drinks, ask about specific ingredients, and pay the bill politely.",
  },
  {
    emoji: "🏥",
    title: "At the Doctor",
    level: "B1",
    levelColor: "bg-secondary-container text-secondary",
    desc: "Describe your symptoms, understand medical instructions, and book follow-up appointments.",
  },
  {
    emoji: "🏛️",
    title: "At the Amt",
    level: "B1",
    levelColor: "bg-secondary-container text-secondary",
    desc: "Register your new address, ask about required documents, and handle bureaucratic hurdles.",
  },
  {
    emoji: "👔",
    title: "Job Interview",
    level: "B2",
    levelColor: "bg-secondary-container text-secondary",
    desc: "Present your professional experience, answer behavioral questions, and negotiate salary.",
  },
  {
    emoji: "🐛",
    title: "Reporting a Bug",
    level: "B2",
    levelColor: "bg-secondary-container text-secondary",
    desc: "Explain technical issues to a colleague, describe reproduction steps, and propose a fix.",
  },
  {
    emoji: "🤝",
    title: "Networking Event",
    level: "C1",
    levelColor: "bg-error-container text-error",
    desc: "Introduce your profession, exchange contacts, and engage in advanced professional small talk.",
  },
  {
    emoji: "🌍",
    title: "Debating Climate Change",
    level: "C2",
    levelColor: "bg-error-container text-error",
    desc: "Express complex opinions, agree or disagree politely, and provide structured arguments.",
  },
];

export default function SpeakingPage() {
  return (
    <div className="page-transition">
      <Header />

      <div className="px-6 py-6">
        {/* Page heading */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined ms-filled text-[16px] text-primary">record_voice_over</span>
              <span className="font-manrope font-semibold text-sm text-primary">Daily speaking practice</span>
            </div>
            <h1 className="font-lexend font-bold text-3xl text-on-surface">Practice Your Speaking</h1>
            <p className="font-manrope text-sm text-on-surface-variant mt-1">
              Choose a real-world scenario and start talking. Maya keeps it conversational, corrects naturally, and helps you build confidence without turning practice into homework.
            </p>
          </div>
          <div className="flex gap-6 flex-shrink-0 mt-1">
            <div className="text-right">
              <p className="font-lexend font-bold text-2xl text-on-surface">9</p>
              <p className="font-manrope text-xs text-on-surface-variant">Fresh scenarios<br />matched to your level</p>
            </div>
            <div className="text-right">
              <p className="font-lexend font-bold text-2xl text-on-surface">10 min</p>
              <p className="font-manrope text-xs text-on-surface-variant">Ready to speak<br />before work or class</p>
            </div>
          </div>
        </div>

        {/* Pronunciation Assessment Banner */}
        <div className="flex items-center gap-5 bg-surface-lowest rounded-3xl p-5 shadow-ambient-sm mb-5">
          <div className="w-10 h-10 bg-primary-container/60 rounded-2xl flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined ms-filled text-[22px] text-primary">mic</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-lexend font-semibold text-sm text-on-surface">Pronunciation Assessment</h3>
              <span className="font-manrope font-bold text-[10px] bg-tertiary-container text-tertiary px-2 py-0.5 rounded-full">Coming Soon</span>
              <span className="font-manrope text-xs text-on-surface-variant">Separate page soon</span>
            </div>
            <p className="font-manrope text-xs text-on-surface-variant leading-relaxed">
              Get AI scoring for clarity, rhythm, and sound accuracy by reading short guided sentences aloud. This preview stays compact so your scenario library still fits comfortably on one desktop screen.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="font-manrope text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">article</span>
                Read 3 short sentences
              </span>
              <span className="font-manrope text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined ms-filled text-[14px] text-primary">auto_awesome</span>
                AI score + feedback
              </span>
              <span className="font-manrope text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                3 min check-in
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <p className="font-manrope text-xs text-on-surface-variant mb-0.5">Sample score</p>
              <p className="font-lexend font-bold text-2xl text-on-surface">87<span className="text-base font-manrope text-on-surface-variant">/100</span></p>
            </div>
            <button className="bg-primary text-white font-manrope font-bold text-sm px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors whitespace-nowrap">
              Try pronunciation preview
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Search scenarios..."
              className="w-full bg-surface-lowest border border-outline-variant/40 rounded-2xl pl-10 pr-4 py-2.5 font-manrope text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary/60"
            />
          </div>
          <button className="flex items-center gap-2 bg-surface-lowest border border-outline-variant/40 rounded-2xl px-4 py-2.5 font-manrope text-sm text-on-surface hover:border-primary/40 transition-colors">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">tune</span>
            Level: All
          </button>
          <button className="flex items-center gap-2 bg-surface-lowest border border-outline-variant/40 rounded-2xl px-4 py-2.5 font-manrope text-sm text-on-surface hover:border-primary/40 transition-colors">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">folder</span>
            Topic: All
          </button>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-3 gap-4">
          {scenarios.map((sc, i) => (
            <div
              key={i}
              className="group relative bg-surface-lowest rounded-3xl p-5 shadow-ambient-sm hover:shadow-ambient hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{sc.emoji}</span>
                <span className={`text-[10px] font-manrope font-bold px-2 py-0.5 rounded-full ${sc.levelColor}`}>
                  {sc.level}
                </span>
              </div>
              <h3 className="font-lexend font-semibold text-sm text-on-surface mb-1.5">{sc.title}</h3>
              <p className="font-manrope text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4">{sc.desc}</p>
              <Link
                href={`/conversation?scenario=${encodeURIComponent(sc.title)}&language=German`}
                className="flex items-center gap-1 font-manrope font-semibold text-xs text-primary hover:gap-2 transition-all duration-200"
              >
                Start session
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
