"use client";

import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-11 py-3.5 text-sm text-[var(--landing-ink)] outline-none transition-all placeholder:text-black/30 focus:border-black/40 focus:ring-1 focus:ring-black/10";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : error.message
      );
      setPassword("");
      setLoading(false);
      return;
    }

    // Hard redirect based on role — must use window.location to trigger middleware
    const role =
      data.user?.app_metadata?.role ?? data.user?.user_metadata?.role;
    window.location.href = role === "concierge" ? "/concierge" : "/dashboard";
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--landing-ivory)] px-4 py-12 font-body text-[var(--landing-ink)]">
      <div className="relative w-full max-w-md">
        {/* Wordmark */}
        <div className="mb-10 flex flex-col items-center">
          <Link
            href="/"
            className="font-title text-3xl font-medium tracking-tight"
          >
            twocards<span className="text-[var(--landing-mute)]">.</span>
          </Link>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Connexion à votre espace
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.08] bg-white/60 p-8 sm:p-10">
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-mute)]"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                  size={16}
                  strokeWidth={1.5}
                />
                <input
                  id="email"
                  type="email"
                  placeholder="nom@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-mute)]"
              >
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                  size={16}
                  strokeWidth={1.5}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 transition-colors hover:text-black/60"
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={1.5} />
                  ) : (
                    <Eye size={16} strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[var(--landing-ink)]/60 underline decoration-black/20 underline-offset-4 transition-colors hover:text-[var(--landing-ink)]"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] py-3.5 text-sm font-semibold text-[var(--landing-ivory)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/[0.08]" />
            <span className="text-[11px] text-black/30">ou</span>
            <div className="h-px flex-1 bg-black/[0.08]" />
          </div>

          <p className="text-center text-sm text-[var(--landing-ink)]/55">
            Vous n&apos;avez pas de compte ?{" "}
            <Link
              href="/signup"
              className="font-medium text-[var(--landing-ink)] underline decoration-black/20 underline-offset-4 transition-colors hover:decoration-black/60"
            >
              Créer un compte
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 space-x-4 text-center text-xs text-black/35">
          <span>&copy; {new Date().getFullYear()} twocards.</span>
          <Link
            href="/legal/cgu"
            className="transition-colors hover:text-black/60"
          >
            Conditions
          </Link>
          <Link
            href="/legal/confidentialite"
            className="transition-colors hover:text-black/60"
          >
            Confidentialité
          </Link>
        </div>
      </div>
    </div>
  );
}
