"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ResetOnboardingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    async function reset() {
      setStatus("loading");
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        // Reset DB onboarding data
        if (token) {
          await fetch(`${API_URL}/api/onboarding/reset`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        // Reset Supabase user_metadata flag
        await supabase.auth.updateUser({ data: { onboarding_completed: false } });

        setStatus("done");
        setTimeout(() => router.push("/onboarding"), 1000);
      } catch {
        setStatus("error");
      }
    }
    reset();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-manrope">
      <div className="text-center">
        {status === "loading" && <p className="text-on-surface-variant">Resetting onboarding…</p>}
        {status === "done"    && <p className="text-secondary font-semibold">Done! Redirecting to onboarding…</p>}
        {status === "error"   && <p className="text-error">Something went wrong.</p>}
      </div>
    </div>
  );
}
