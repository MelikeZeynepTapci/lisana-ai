"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/speaking", label: "Speaking", icon: "record_voice_over" },
  { href: "/listening", label: "Listening", icon: "headphones" },
  { href: "/vocabulary", label: "Vocabulary", icon: "menu_book" },
  { href: "/grammar", label: "Grammar", icon: "auto_stories" },
  { href: "/progress", label: "My Progress", icon: "bar_chart" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-surface-low fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <Link href="/" className="block">
          <span className="font-lexend font-bold text-2xl text-primary">
            Lingua<span className="text-on-surface">Tutor</span>
          </span>
          <p className="font-manrope text-xs text-on-surface-variant mt-0.5">Premium Learning</p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-manrope font-medium text-sm transition-all duration-200 ${
                isActive
                  ? "bg-surface-lowest text-tertiary shadow-ambient-sm"
                  : "text-on-surface-variant hover:bg-surface-highest/60 hover:text-on-surface"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${isActive ? "ms-filled text-tertiary" : ""}`}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="p-4 m-3">
        <div className="bg-gradient-to-br from-primary to-primary-dim rounded-4xl p-4 text-white">
          <p className="font-lexend font-semibold text-sm mb-1">Go Premium</p>
          <p className="font-manrope text-xs opacity-80 mb-3">Unlock all lessons and AI features</p>
          <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-manrope font-semibold text-xs py-2 rounded-full transition-all duration-200">
            Upgrade Now
          </button>
        </div>
      </div>
    </aside>
  );
}
