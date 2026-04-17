"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UserInfo {
  username: string | null;
  full_name: string | null;
  active_level: string | null;
}

const LEVEL_LABELS: Record<string, string> = {
  A1: "A1 Beginner",
  A2: "A2 Elementary",
  B1: "B1 Intermediate",
  B2: "B2 Upper-Intermediate",
  C1: "C1 Advanced",
  C2: "C2 Proficient",
};

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [initial, setInitial] = useState("?");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const info: UserInfo = await res.json();
        setUserInfo(info);
        const name = info.username ?? info.full_name ?? data.session?.user.email ?? "";
        setInitial(name[0]?.toUpperCase() ?? "?");
      } catch {
        // Backend unreachable — fall back to Supabase session data
        const email = data.session?.user.email ?? "";
        setInitial(email[0]?.toUpperCase() ?? "?");
      }
    });
  }, []);

  const displayName = userInfo?.username ?? userInfo?.full_name ?? "...";

  const levelLabel = userInfo?.active_level
    ? LEVEL_LABELS[userInfo.active_level] ?? userInfo.active_level
    : null;

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20" style={{ boxShadow: "0 4px 24px rgba(27,31,59,0.07)" }}>
      <div className="flex items-center justify-between px-6 py-3.5">
        {title && <h1 className="font-lexend font-bold text-xl text-on-surface">{title}</h1>}
        {!title && <div />}
        <div className="flex items-center gap-2.5">
          {/* Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ background: "var(--orange-pale)", borderColor: "rgba(244,163,64,0.3)" }}>
            <span className="material-symbols-outlined ms-filled text-[16px]" style={{ color: "#B5702A" }}>local_fire_department</span>
            <span className="font-manrope font-bold text-sm" style={{ color: "#B5702A" }}>14 Day Streak</span>
          </div>
          {/* XP */}
          <div className="flex items-center gap-1.5 bg-primary-container/60 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined ms-filled text-[16px] text-primary">bolt</span>
            <span className="font-manrope font-bold text-sm text-primary">120 / 200 XP</span>
          </div>
          {/* Avatar + name */}
          <div className="flex items-center gap-2 ml-1">
            <div className="text-right hidden sm:block">
              <p className="font-manrope font-semibold text-xs text-on-surface leading-tight">{displayName}</p>
              {levelLabel && (
                <p className="font-manrope text-[10px] text-on-surface-variant leading-tight">{levelLabel}</p>
              )}
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-white font-lexend font-bold text-sm shadow-ambient-sm">
              {initial}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
