"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Home", icon: "dashboard" },
  { href: "/speaking", label: "Speak", icon: "record_voice_over" },
  { href: "/vocabulary", label: "Vocab", icon: "menu_book" },
  { href: "/grammar", label: "Grammar", icon: "auto_stories" },
  { href: "/progress", label: "Progress", icon: "bar_chart" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-lowest/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-ambient">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200"
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-all duration-200 ${
                  isActive ? "ms-filled text-primary" : "text-on-surface-variant"
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`font-manrope text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
