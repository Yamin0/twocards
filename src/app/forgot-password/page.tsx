"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, AlertCircle, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--landing-ivory)] px-4 py-12 font-body text-[var(--landing-ink)]">
      <div className="relative w-full max-w-md">
        <div className="mb-10 flex flex-col items-center">
          <Link href="/" className="font-title text-3xl font-medium tracking-tight">
            twocards<span className="text-[var(--landing-mute)]">.</span>
          </Link>
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--landing-mute)]">
            Mot de passe oublié
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.08] bg-white/60 p-8 sm:p-10">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                <CheckCircle size={32} strokeWidth={1.5} className="text-emerald-600" />
              </div>
              <h1 className="mb-3 font-title text-2xl font-normal">
                Email envoyé
              </h1>
              <p className="mb-6 text-sm leading-relaxed text-[var(--landing-ink)]/60">
                Si un compte existe pour{" "}
                <strong className="text-[var(--landing-ink)]">{email}</strong>,
                vous recevrez un lien pour définir un nouveau mot de passe.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-full bg-[var(--landing-ink)] px-6 py-3 text-sm font-semibold text-[var(--landing-ivory)] transition-opacity hover:opacity-85"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm leading-relaxed text-[var(--landing-ink)]/60">
                Indiquez l&apos;email de votre compte : nous vous enverrons un
                lien sécurisé pour définir un nouveau mot de passe.
              </p>

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
                      className="w-full rounded-xl border border-black/15 bg-white px-11 py-3.5 text-sm text-[var(--landing-ink)] outline-none transition-all placeholder:text-black/30 focus:border-black/40 focus:ring-1 focus:ring-black/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] py-3.5 text-sm font-semibold text-[var(--landing-ivory)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Envoi..." : "Envoyer le lien"}
                </button>
              </form>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--landing-ink)]/55 transition-colors hover:text-[var(--landing-ink)]"
              >
                <ArrowLeft size={14} />
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
