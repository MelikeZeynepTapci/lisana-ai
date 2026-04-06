"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { syncUser } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function resolveEmail(identifier: string): Promise<string> {
  if (identifier.includes("@")) return identifier;

  // Username → email lookup
  const res = await fetch(`${API_URL}/api/auth/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: identifier }),
  });
  if (!res.ok) throw new Error("Kullanıcı adı bulunamadı.");
  const data = await res.json();
  return data.email;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const email = await resolveEmail(identifier.trim());
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      await syncUser().catch(() => {});
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Giriş yapılamadı.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined ms-filled text-[20px] text-white">language</span>
          </div>
          <span className="font-lexend font-bold text-xl text-on-surface">LinguaTutor</span>
        </div>

        <div className="bg-surface-lowest rounded-4xl p-8 shadow-ambient-sm">
          <h1 className="font-lexend font-bold text-2xl text-on-surface mb-1">Hoş geldin</h1>
          <p className="font-manrope text-sm text-on-surface-variant mb-6">Hesabına giriş yap</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-manrope font-semibold text-xs text-on-surface-variant uppercase tracking-wide block mb-1.5">
                E-posta veya kullanıcı adı
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="sen@example.com veya @kullanici_adi"
                className="w-full bg-surface-low border border-outline-variant/40 rounded-2xl px-4 py-3 font-manrope text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            <div>
              <label className="font-manrope font-semibold text-xs text-on-surface-variant uppercase tracking-wide block mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-surface-low border border-outline-variant/40 rounded-2xl px-4 py-3 font-manrope text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-error-container text-error font-manrope text-sm px-4 py-3 rounded-2xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-manrope font-bold text-sm py-3.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <p className="font-manrope text-sm text-on-surface-variant text-center mt-5">
            Hesabın yok mu?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
