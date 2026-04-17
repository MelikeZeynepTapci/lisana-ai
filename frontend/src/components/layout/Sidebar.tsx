"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const dailyModeItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/speaking", label: "Speaking", icon: "record_voice_over" },
  { href: "/listening", label: "Listening", icon: "headphones" },
  { href: "/vocabulary", label: "Vocabulary", icon: "menu_book" },
  { href: "/grammar", label: "Grammar", icon: "auto_stories" },
  { href: "/progress", label: "Progress", icon: "bar_chart" },
];


export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string>("");
  const [initial, setInitial] = useState<string>("?");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      const username = user.user_metadata?.username;
      const email = user.email ?? "";
      const name = username ? `@${username}` : email;
      setDisplayName(name);
      setInitial((username ?? email)[0]?.toUpperCase() ?? "?");
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/landing");
  }

  return (
    <aside className="hidden md:flex flex-col w-52 min-h-screen bg-surface-lowest border-r border-outline-variant/20 fixed left-0 top-0 bottom-0 z-40" style={{ boxShadow: "4px 0 24px rgba(27,31,59,0.08)" }}>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined ms-filled text-[18px] text-white">language</span>
          </div>
          <span className="font-lexend font-bold text-base text-on-surface">Lisana <span className="text-primary">AI</span></span>
        </Link>
      </div>


      <div className="px-3 mb-2">
        <nav className="space-y-0.5">
          {dailyModeItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl font-manrope font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary-container text-primary"
                    : "text-on-surface-variant hover:bg-surface-high hover:text-on-surface"
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
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-manrope font-semibold text-sm text-on-surface truncate">{displayName || "..."}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
