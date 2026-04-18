import Header from "@/components/layout/Header";

const heatmapData = Array.from({ length: 7 * 12 }, (_, i) => {
  const levels = [0, 0, 1, 2, 3, 2, 1, 0, 3, 2, 1, 0, 2, 3, 1, 0, 2, 1, 3, 2, 0, 1, 2, 3];
  return levels[i % levels.length];
});

const radarPoints = (() => {
  const skills = [78, 65, 82, 70, 55];
  const cx = 80;
  const cy = 80;
  const r = 65;
  const angles = [-90, -18, 54, 126, 198].map((a) => (a * Math.PI) / 180);
  return skills.map((s, i) => {
    const ratio = s / 100;
    return {
      x: cx + r * ratio * Math.cos(angles[i]),
      y: cy + r * ratio * Math.sin(angles[i]),
    };
  });
})();

const radarGridPoints = (ratio: number) => {
  const cx = 80;
  const cy = 80;
  const r = 65;
  const angles = [-90, -18, 54, 126, 198].map((a) => (a * Math.PI) / 180);
  return angles.map((a) => ({
    x: cx + r * ratio * Math.cos(a),
    y: cy + r * ratio * Math.sin(a),
  }));
};

const badges = [
  { icon: "wb_sunny", bg: "bg-primary-container", color: "text-primary", label: "Early Bird", earned: true },
  { icon: "auto_awesome", bg: "bg-secondary-container", color: "text-secondary", label: "Verb Master", earned: true },
  { icon: "local_fire_department", bg: "bg-tertiary-container", color: "text-tertiary", label: "30-Day Streak", earned: true },
  { icon: "translate", bg: "bg-surface-highest", color: "text-on-surface-variant", label: "Polyglot", earned: false },
];

export default function ProgressPage() {
  const heatLevels = ["bg-surface-highest", "bg-tertiary/20", "bg-tertiary/50", "bg-tertiary"];

  return (
    <div className="page-transition">
      <Header title="My Progress" />

      <div className="px-6 py-6 space-y-6">
        {/* Header Stats */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-manrope font-bold text-xs uppercase tracking-widest text-tertiary mb-1">Learning Journey</p>
            <h2 className="font-lexend font-bold text-4xl lg:text-5xl text-on-surface">Your Progress</h2>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="font-lexend font-bold text-2xl text-secondary">342</p>
              <p className="font-manrope font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Day Streak</p>
            </div>
            <div className="w-px bg-outline-variant/60" />
            <div className="text-center">
              <p className="font-lexend font-bold text-2xl text-primary">12.4k</p>
              <p className="font-manrope font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">XP Points</p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Current Level Card */}
          <div className="lg:col-span-8 relative overflow-hidden bg-surface-lowest border border-outline-variant/60 rounded-4xl p-8" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
            <div className="absolute bottom-0 right-0 w-56 h-56 bg-primary-container/30 rounded-full blur-3xl translate-y-1/3 translate-x-1/4" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
              {/* Circle Progress */}
              <div className="flex-shrink-0 relative w-36 h-36">
                <svg width="144" height="144" className="-rotate-90">
                  <circle cx="72" cy="72" r="62" fill="none" stroke="#e7edb1" strokeWidth="10" />
                  <circle
                    cx="72"
                    cy="72"
                    r="62"
                    fill="none"
                    stroke="#725991"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 62}
                    strokeDashoffset={2 * Math.PI * 62 * 0.25}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-lexend font-bold text-3xl text-primary">B2</span>
                  <span className="font-manrope font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Upper Int.</span>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-lexend font-bold text-2xl text-on-surface mb-2">B2 Upper Intermediate</h3>
                <p className="font-manrope text-sm text-on-surface-variant leading-relaxed mb-4">
                  You&apos;re making excellent progress! You are currently in the{" "}
                  <strong className="text-on-surface">top 5%</strong> of learners this month.{" "}
                  <span className="text-primary font-semibold">42 more hours</span> to reach C1.
                </p>
                <div className="flex gap-3">
                  <div className="bg-surface border border-outline-variant/60 rounded-2xl px-4 py-2">
                    <p className="font-manrope text-xs text-on-surface-variant">Fluency</p>
                    <p className="font-manrope font-bold text-sm text-on-surface">78%</p>
                  </div>
                  <div className="bg-surface border border-outline-variant/60 rounded-2xl px-4 py-2">
                    <p className="font-manrope text-xs text-on-surface-variant">Accuracy</p>
                    <p className="font-manrope font-bold text-sm text-on-surface">84%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="bg-surface-lowest border border-outline-variant/60 rounded-4xl p-5" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-tertiary-container rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined ms-filled text-[20px] text-tertiary">menu_book</span>
                </div>
                <p className="font-manrope text-xs text-on-surface-variant">Vocabulary</p>
              </div>
              <p className="font-lexend font-bold text-3xl text-on-surface">4,821</p>
              <p className="font-manrope font-bold text-xs text-tertiary mt-1">+124 this week</p>
            </div>
            <div className="bg-surface-lowest border border-outline-variant/60 rounded-4xl p-5" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-secondary-container rounded-2xl flex items-center justify-center">
                  <span className="material-symbols-outlined ms-filled text-[20px] text-secondary">schedule</span>
                </div>
                <p className="font-manrope text-xs text-on-surface-variant">Hours Studied</p>
              </div>
              <p className="font-lexend font-bold text-3xl text-on-surface">186.5</p>
              <p className="font-manrope font-bold text-xs text-secondary mt-1">Daily avg: 45m</p>
            </div>
          </div>
        </div>

        {/* Skills + Heatmap Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Radar Chart */}
          <div className="lg:col-span-5 bg-surface-lowest border border-outline-variant/60 rounded-4xl p-6" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined ms-filled text-[20px] text-primary">radar</span>
              <h3 className="font-lexend font-semibold text-base text-on-surface">Skills Proficiency</h3>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg width="160" height="160" viewBox="0 0 160 160">
                  {[0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
                    const pts = radarGridPoints(ratio);
                    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
                    return <path key={ratio} d={d} fill="none" stroke="#b8be86" strokeWidth="0.8" strokeOpacity="0.3" />;
                  })}
                  {radarGridPoints(1).map((p, i) => (
                    <line key={i} x1="80" y1="80" x2={p.x} y2={p.y} stroke="#b8be86" strokeWidth="0.8" strokeOpacity="0.3" />
                  ))}
                  <polygon
                    points={radarPoints.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="#725991"
                    fillOpacity="0.35"
                    stroke="#725991"
                    strokeWidth="2"
                  />
                </svg>
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 font-manrope text-[10px] font-bold text-on-surface-variant">Speaking</span>
                <span className="absolute top-[30%] right-0 translate-x-2 font-manrope text-[10px] font-bold text-on-surface-variant">Listening</span>
                <span className="absolute bottom-[10%] right-[5%] font-manrope text-[10px] font-bold text-on-surface-variant">Vocab</span>
                <span className="absolute bottom-[10%] left-[5%] font-manrope text-[10px] font-bold text-on-surface-variant">Grammar</span>
                <span className="absolute top-[30%] left-0 -translate-x-2 font-manrope text-[10px] font-bold text-on-surface-variant">Writing</span>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="lg:col-span-7 bg-surface-lowest border border-outline-variant/60 rounded-4xl p-6" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined ms-filled text-[20px] text-secondary">calendar_month</span>
              <h3 className="font-lexend font-semibold text-base text-on-surface">Learning Consistency</h3>
            </div>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
              {heatmapData.map((level, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-md ${heatLevels[level]} transition-colors duration-200`}
                  title={`Activity level: ${level}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="font-manrope text-[10px] text-on-surface-variant">Less Active</span>
              {heatLevels.map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
              ))}
              <span className="font-manrope text-[10px] text-on-surface-variant">High Focus</span>
            </div>
          </div>
        </div>

        {/* Badges + Weekly Focus Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Badges */}
          <div className="lg:col-span-5 bg-surface-lowest border border-outline-variant/60 rounded-4xl p-6" style={{ boxShadow: "0 2px 8px rgba(27,31,59,0.07)" }}>
            <p className="font-manrope font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-5">
              Achievement Badges
            </p>
            <div className="grid grid-cols-4 gap-3">
              {badges.map((b, i) => (
                <div key={i} className={`flex flex-col items-center gap-2 ${!b.earned ? "opacity-30" : ""}`}>
                  <div className={`w-14 h-14 ${b.bg} border border-outline-variant/40 rounded-3xl flex items-center justify-center shadow-ambient-sm`}>
                    <span className={`material-symbols-outlined ms-filled text-[26px] ${b.color}`}>{b.icon}</span>
                  </div>
                  <p className="font-manrope text-[10px] font-semibold text-center text-on-surface-variant leading-tight">
                    {b.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Focus Recommendation */}
          <div className="lg:col-span-7 relative overflow-hidden bg-gradient-to-br from-primary to-primary-dim rounded-4xl p-6 shadow-ambient-lg">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined ms-filled text-[28px] text-white">psychology</span>
                </div>
                <div className="flex-1">
                  <p className="font-manrope font-bold text-xs text-white/60 uppercase tracking-widest mb-1">AI Recommendation</p>
                  <h3 className="font-lexend font-bold text-xl text-white mb-1">
                    Focus: Conditional Tense
                  </h3>
                  <p className="font-manrope text-sm text-white/70 leading-relaxed">
                    Our AI noticed you&apos;re struggling with &ldquo;If&rdquo; clauses. Try our curated module today.
                  </p>
                </div>
              </div>
              <button className="flex-shrink-0 w-full sm:w-auto bg-white text-primary font-manrope font-bold text-sm px-5 py-3 rounded-full hover:scale-105 active:scale-95 transition-all duration-200 shadow-ambient text-center">
                Start Lesson
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
