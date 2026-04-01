interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20">
      <div className="flex items-center justify-between px-6 py-3.5">
        {title && <h1 className="font-lexend font-bold text-xl text-on-surface">{title}</h1>}
        {!title && <div />}
        <div className="flex items-center gap-2.5">
          {/* Streak */}
          <div className="flex items-center gap-1.5 bg-secondary-container px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined ms-filled text-[16px] text-secondary">local_fire_department</span>
            <span className="font-manrope font-bold text-sm text-secondary">14 Day Streak</span>
          </div>
          {/* XP */}
          <div className="flex items-center gap-1.5 bg-primary-container/60 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined ms-filled text-[16px] text-primary">bolt</span>
            <span className="font-manrope font-bold text-sm text-primary">120 / 200 XP</span>
          </div>
          {/* Avatar + name */}
          <div className="flex items-center gap-2 ml-1">
            <div className="text-right hidden sm:block">
              <p className="font-manrope font-semibold text-xs text-on-surface leading-tight">Alex M.</p>
              <p className="font-manrope text-[10px] text-on-surface-variant leading-tight">B1 Intermediate</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white font-lexend font-bold text-sm shadow-ambient-sm">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
