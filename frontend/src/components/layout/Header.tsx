interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="font-lexend font-bold text-xl text-on-surface">{title}</h1>
        <div className="flex items-center gap-3">
          {/* Streak */}
          <div className="flex items-center gap-1.5 bg-secondary-container px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined ms-filled text-[16px] text-secondary">local_fire_department</span>
            <span className="font-manrope font-bold text-sm text-secondary">7</span>
          </div>
          {/* XP */}
          <div className="flex items-center gap-1.5 bg-primary-container/60 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined ms-filled text-[16px] text-primary">stars</span>
            <span className="font-manrope font-bold text-sm text-primary">12.4k</span>
          </div>
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white font-lexend font-bold text-sm shadow-ambient-sm">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
