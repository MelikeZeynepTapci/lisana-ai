import Header from "@/components/layout/Header";

const scenarios = [
  {
    emoji: "☕",
    title: "Ordering Coffee",
    level: "A1",
    levelColor: "bg-tertiary-container text-tertiary-on-container",
    desc: "Practice ordering drinks and snacks at a café in natural, everyday Spanish.",
    locked: false,
  },
  {
    emoji: "✈️",
    title: "Airport Check-in",
    level: "B1",
    levelColor: "bg-secondary-container text-secondary",
    desc: "Navigate check-in counters, security, and boarding gate conversations with confidence.",
    locked: false,
  },
  {
    emoji: "🏪",
    title: "At the Market",
    level: "A2",
    levelColor: "bg-tertiary-container text-tertiary-on-container",
    desc: "Haggle, ask for prices, and describe what you need in a local market setting.",
    locked: false,
  },
  {
    emoji: "👔",
    title: "Job Interview",
    level: "C1",
    levelColor: "bg-error-container text-error",
    desc: "Master formal vocabulary, answer competency questions, and discuss your experience professionally.",
    locked: false,
  },
  {
    emoji: "🚑",
    title: "Emergency Room",
    level: "B2",
    levelColor: "bg-secondary-container text-secondary",
    desc: "Describe symptoms, understand medical instructions, and communicate in urgent healthcare situations.",
    locked: false,
  },
  {
    emoji: "🎭",
    title: "Improv Sandbox",
    level: "Free",
    levelColor: "bg-surface-highest text-on-surface-variant",
    desc: "Open-ended roleplay — choose any scenario and practice freely with the AI.",
    locked: true,
  },
];

const history = [
  { scenario: "Ordering Coffee", time: "Today, 10:24 AM", score: 92, scoreLabel: "Excellent", color: "text-tertiary", barColor: "bg-tertiary" },
  { scenario: "At the Market", time: "Yesterday, 3:15 PM", score: 78, scoreLabel: "Improving", color: "text-secondary", barColor: "bg-secondary" },
  { scenario: "Daily Greetings", time: "2 days ago", score: 84, scoreLabel: "Good", color: "text-primary", barColor: "bg-primary" },
];

export default function SpeakingPage() {
  return (
    <div className="page-transition">
      <Header title="Speaking" />

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Scenarios Grid */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-lexend font-semibold text-lg text-on-surface">Choose a Scenario</h2>
              <span className="font-manrope text-xs text-on-surface-variant">{scenarios.filter((s) => !s.locked).length} available</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((sc, i) => (
                <div
                  key={i}
                  className={`group relative bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm transition-all duration-300 ${
                    sc.locked ? "opacity-60" : "hover:shadow-ambient hover:-translate-y-1 cursor-pointer"
                  }`}
                >
                  {sc.locked && (
                    <div className="absolute top-4 right-4">
                      <span className="material-symbols-outlined ms-filled text-[18px] text-on-surface-variant">lock</span>
                    </div>
                  )}
                  <div className="text-5xl mb-4">{sc.emoji}</div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-lexend font-semibold text-sm text-on-surface">{sc.title}</h3>
                    <span className={`text-[10px] font-manrope font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${sc.levelColor}`}>
                      {sc.level}
                    </span>
                  </div>
                  <p className="font-manrope text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-5">{sc.desc}</p>
                  {!sc.locked && (
                    <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dim text-white font-manrope font-bold text-xs py-2.5 rounded-full shadow-ambient-sm hover:shadow-ambient transition-all duration-200 group-hover:scale-[1.02]">
                      <span className="material-symbols-outlined ms-filled text-[16px]">play_circle</span>
                      Start Session
                    </button>
                  )}
                  {sc.locked && (
                    <button className="w-full flex items-center justify-center gap-2 bg-surface-highest text-on-surface-variant font-manrope font-bold text-xs py-2.5 rounded-full">
                      <span className="material-symbols-outlined text-[16px]">lock</span>
                      Premium Only
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* History Sidebar */}
          <div className="space-y-4">
            <div className="bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined ms-filled text-[20px] text-on-surface-variant">history</span>
                <h3 className="font-lexend font-semibold text-base text-on-surface">Recent History</h3>
              </div>
              <div className="space-y-5">
                {history.map((h, i) => (
                  <div key={i} className={`pl-4 border-l-4 ${h.barColor.replace("bg-", "border-")}`}>
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-manrope font-semibold text-sm text-on-surface">{h.scenario}</p>
                      <span className={`font-lexend font-bold text-sm ${h.color}`}>{h.score}%</span>
                    </div>
                    <p className="font-manrope text-xs text-on-surface-variant mb-2">{h.time}</p>
                    <div className="w-full bg-surface-highest rounded-full h-1.5">
                      <div
                        className={`${h.barColor} h-1.5 rounded-full transition-all duration-500`}
                        style={{ width: `${h.score}%` }}
                      />
                    </div>
                    <p className={`font-manrope text-xs font-semibold mt-1.5 ${h.color}`}>
                      Fluency: {h.scoreLabel}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Goal */}
            <div className="bg-surface-low rounded-4xl p-6 border-2 border-dashed border-outline-variant/60">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined ms-filled text-[20px] text-primary">equalizer</span>
                <h3 className="font-lexend font-semibold text-sm text-on-surface">Weekly Speaking Goal</h3>
              </div>
              <p className="font-manrope text-sm font-bold text-on-surface mb-1">3/5 sessions completed</p>
              <div className="w-full bg-surface-highest rounded-full h-2 mb-3">
                <div className="bg-tertiary h-2 rounded-full transition-all duration-500" style={{ width: "60%" }} />
              </div>
              <button className="font-manrope text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                View detailed analysis
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
