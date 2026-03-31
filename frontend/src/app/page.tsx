import Header from "@/components/layout/Header";
import Link from "next/link";

const quickStart = [
  {
    href: "/speaking",
    icon: "record_voice_over",
    iconBg: "bg-tertiary-container",
    iconColor: "text-tertiary",
    title: "Speaking",
    desc: "Practice real-world conversations with AI",
  },
  {
    href: "/listening",
    icon: "headphones",
    iconBg: "bg-primary-container/60",
    iconColor: "text-primary",
    title: "Listening",
    desc: "Sharpen your comprehension with audio tests",
  },
  {
    href: "/vocabulary",
    icon: "menu_book",
    iconBg: "bg-secondary-container",
    iconColor: "text-secondary",
    title: "Vocabulary",
    desc: "Build your word bank with smart flashcards",
  },
  {
    href: "/grammar",
    icon: "auto_stories",
    iconBg: "bg-surface-highest",
    iconColor: "text-on-surface",
    title: "Grammar",
    desc: "Master the rules with guided exercises",
  },
];

const weekDays = [
  { day: "MON", height: 40, active: false },
  { day: "TUE", height: 60, active: false },
  { day: "WED", height: 55, active: false },
  { day: "THU", height: 90, active: true },
  { day: "FRI", height: 70, active: false },
  { day: "SAT", height: 45, active: false },
  { day: "SUN", height: 30, active: false },
];

const recentActivities = [
  { icon: "check_circle", iconColor: "text-tertiary", label: "Completed Speaking Test", sub: "Score: 92% Fluency", time: "2h ago" },
  { icon: "military_tech", iconColor: "text-secondary", label: "Earned Badge: Streak Master", sub: "7-day streak achieved", time: "Yesterday" },
];

export default function DashboardPage() {
  return (
    <div className="page-transition">
      <Header title="Dashboard" />

      <div className="px-6 py-6 space-y-6">
        {/* Hero + Recent Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Hero */}
          <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-primary to-primary-dim rounded-4xl p-8 text-white shadow-ambient-lg">
            {/* Decorative blurs */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 right-8 w-32 h-32 bg-primary-container/20 rounded-full blur-2xl translate-y-1/3" />

            <div className="relative z-10">
              <p className="font-manrope text-white/70 text-sm mb-1">Good morning ☀️</p>
              <h2 className="font-lexend font-bold text-4xl mb-2">Hi, Alex!</h2>
              <p className="font-manrope text-white/80 text-sm mb-6">
                You&apos;re on a 7-day streak. Keep the momentum going!
              </p>

              {/* Daily Goal Card */}
              <div className="bg-white/15 backdrop-blur-sm rounded-3xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-manrope font-semibold text-sm text-white/90">Daily Goal Progress</p>
                    <p className="font-manrope text-xs text-white/60 mt-0.5">4 of 5 lessons completed</p>
                  </div>
                  <span className="font-lexend font-bold text-2xl">80%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5">
                  <div className="bg-tertiary-container h-2.5 rounded-full transition-all duration-700" style={{ width: "80%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface-low rounded-4xl p-6 shadow-ambient-sm">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined ms-filled text-[20px] text-on-surface-variant">history</span>
              <h3 className="font-lexend font-semibold text-base text-on-surface">Recent Activity</h3>
            </div>
            <div className="space-y-4">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-surface-highest flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className={`material-symbols-outlined ms-filled text-[18px] ${a.iconColor}`}>{a.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-manrope font-semibold text-sm text-on-surface">{a.label}</p>
                    <p className="font-manrope text-xs text-on-surface-variant mt-0.5">{a.sub}</p>
                  </div>
                  <span className="font-manrope text-xs text-on-surface-variant flex-shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-5 py-2.5 rounded-full border border-outline-variant/40 font-manrope font-semibold text-xs text-on-surface-variant hover:bg-surface-highest/60 transition-colors duration-200">
              View All History
            </button>
          </div>
        </div>

        {/* Quick Start Grid */}
        <div>
          <h3 className="font-lexend font-semibold text-lg text-on-surface mb-4">Quick Start</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStart.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm hover:shadow-ambient hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 ${card.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
                  <span className={`material-symbols-outlined ms-filled text-[22px] ${card.iconColor}`}>{card.icon}</span>
                </div>
                <h4 className="font-lexend font-semibold text-sm text-on-surface mb-1">{card.title}</h4>
                <p className="font-manrope text-xs text-on-surface-variant leading-relaxed">{card.desc}</p>
                <div className="flex items-center gap-1 mt-4">
                  <span className="font-manrope font-bold text-xs text-primary uppercase tracking-wide">Start Lesson</span>
                  <span className="material-symbols-outlined text-[14px] text-primary group-hover:translate-x-0.5 transition-transform duration-200">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Weekly Progress + Promo Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Weekly Chart */}
          <div className="lg:col-span-3 bg-surface-lowest rounded-4xl p-6 shadow-ambient-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-lexend font-semibold text-base text-on-surface">Weekly Progress</h3>
                <p className="font-manrope text-xs text-on-surface-variant mt-0.5">Learning hours per day</p>
              </div>
              <span className="font-manrope text-xs text-on-surface-variant bg-surface-highest px-3 py-1.5 rounded-full">This Week</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-28">
              {weekDays.map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "96px" }}>
                    <div
                      className={`w-full rounded-full transition-all duration-500 ${
                        d.active
                          ? "bg-gradient-to-t from-primary to-primary-dim shadow-ambient"
                          : "bg-primary/30"
                      }`}
                      style={{ height: `${d.height}%` }}
                    />
                  </div>
                  <span className={`font-manrope text-[10px] font-semibold ${d.active ? "text-primary" : "text-on-surface-variant"}`}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Promo Card */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-4xl shadow-ambient-sm min-h-[220px]">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-on-surface via-on-surface-variant to-primary-dim" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

            <div className="relative z-10 p-6 h-full flex flex-col justify-between">
              <div className="inline-flex items-center gap-1.5 bg-tertiary-container/90 px-3 py-1 rounded-full w-fit">
                <span className="material-symbols-outlined ms-filled text-[14px] text-tertiary">lightbulb</span>
                <span className="font-manrope font-bold text-xs text-tertiary">Learning Tip</span>
              </div>
              <div>
                <h3 className="font-lexend font-bold text-xl text-white mb-2">
                  Immersion is the key to fluency
                </h3>
                <p className="font-manrope text-white/70 text-xs mb-4">
                  Surround yourself with the language every day — even 15 minutes counts.
                </p>
                <Link
                  href="/listening"
                  className="inline-flex items-center gap-2 bg-white text-on-surface font-manrope font-bold text-xs px-4 py-2.5 rounded-full hover:bg-surface-lowest transition-colors duration-200"
                >
                  <span className="material-symbols-outlined ms-filled text-[16px] text-primary">headphones</span>
                  Listen Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
