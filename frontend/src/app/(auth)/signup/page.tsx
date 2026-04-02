"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-tertiary-container rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined ms-filled text-[28px] text-tertiary">mark_email_read</span>
          </div>
          <h2 className="font-lexend font-bold text-xl text-on-surface mb-2">E-postanı kontrol et</h2>
          <p className="font-manrope text-sm text-on-surface-variant mb-6">
            <span className="font-semibold text-on-surface">{email}</span> adresine doğrulama linki gönderdik.
          </p>
          <Link href="/login" className="font-manrope font-semibold text-sm text-primary hover:underline">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined ms-filled text-[20px] text-white">language</span>
          </div>
          <span className="font-lexend font-bold text-xl text-on-surface">LinguaTutor</span>
        </div>

        <div className="bg-surface-lowest rounded-4xl p-8 shadow-ambient-sm">
          <h1 className="font-lexend font-bold text-2xl text-on-surface mb-1">Hesap oluştur</h1>
          <p className="font-manrope text-sm text-on-surface-variant mb-6">Ücretsiz başla, istediğin zaman yükselt</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="font-manrope font-semibold text-xs text-on-surface-variant uppercase tracking-wide block mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="sen@example.com"
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

            <div>
              <label className="font-manrope font-semibold text-xs text-on-surface-variant uppercase tracking-wide block mb-1.5">
                Şifre Tekrar
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {loading ? "Hesap oluşturuluyor..." : "Kayıt Ol"}
            </button>
          </form>

          <p className="font-manrope text-sm text-on-surface-variant text-center mt-5">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
