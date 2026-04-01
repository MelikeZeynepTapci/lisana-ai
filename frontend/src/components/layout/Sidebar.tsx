"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const dailyModeItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/speaking", label: "Speaking", icon: "record_voice_over" },
  { href: "/listening", label: "Listening", icon: "headphones" },
  { href: "/vocabulary", label: "Vocabulary", icon: "menu_book" },
  { href: "/grammar", label: "Grammar", icon: "auto_stories" },
  { href: "/progress", label: "Progress", icon: "bar_chart" },
];

const examModeItems = [
  { href: "/ielts", label: "IELTS", icon: "school" },
  { href: "/toefl", label: "TOEFL", icon: "school" },
  { href: "/testdaf", label: "TestDAF", icon: "school" },
  { href: "/goethe", label: "Goethe-Zertifikat", icon: "school" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-52 min-h-screen bg-background border-r border-outline-variant/30 fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined ms-filled text-[18px] text-white">language</span>
          </div>
          <span className="font-lexend font-bold text-base text-on-surface">LinguaTutor</span>
        </Link>
      </div>

      {/* Daily Mode */}
      <div className="px-3 mb-2">
        <p className="font-manrope font-semibold text-[10px] text-on-surface-variant uppercase tracking-widest px-2 mb-1.5">Daily Mode</p>
        <nav className="space-y-0.5">
          {dailyModeItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl font-manrope font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-surface-lowest text-primary shadow-ambient-sm"
                    : "text-on-surface-variant hover:bg-surface-highest/60 hover:text-on-surface"
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? "ms-filled text-primary" : ""}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Exam Mode */}
      <div className="px-3 mt-3">
        <p className="font-manrope font-semibold text-[10px] text-on-surface-variant uppercase tracking-widest px-2 mb-1.5">Exam Mode</p>
        <nav className="space-y-0.5">
          {examModeItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl font-manrope font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-surface-lowest text-primary shadow-ambient-sm"
                    : "text-on-surface-variant hover:bg-surface-highest/60 hover:text-on-surface"
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? "ms-filled text-primary" : ""}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="mt-auto px-3 py-4 border-t border-outline-variant/20">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white font-lexend font-bold text-sm flex-shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-manrope font-semibold text-sm text-on-surface truncate">Alex Meier</p>
            <p className="font-manrope text-xs text-on-surface-variant">Pro Plan</p>
          </div>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
