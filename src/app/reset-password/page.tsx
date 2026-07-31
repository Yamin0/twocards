"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(
        error.message === "Auth session missing!"
          ? "Le lien a expiré. Demandez un nouveau lien de réinitialisation."
          : error.message
      );
      setLoading(false);
      return;
    }
    setDone(true);
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
            Nouveau mot de passe
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.08] bg-white/60 p-8 sm:p-10">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                <CheckCircle size={32} strokeWidth={1.5} className="text-emerald-600" />
              </div>
              <h1 className="mb-3 font-title text-2xl font-normal">
                Mot de passe mis à jour
              </h1>
              <p className="mb-6 text-sm leading-relaxed text-[var(--landing-ink)]/60">
                Vous pouvez maintenant accéder à votre espace.
              </p>
              <Link
                href="/dashboard"
                className="inline-block rounded-full bg-[var(--landing-ink)] px-6 py-3 text-sm font-semibold text-[var(--landing-ivory)] transition-opacity hover:opacity-85"
              >
                Aller à mon espace
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertCircle size={16} strokeWidth={1.5} className="shrink-0" />
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                {[
                  {
                    id: "password",
                    label: "Nouveau mot de passe",
                    value: password,
                    set: setPassword,
                  },
                  {
                    id: "confirm",
                    label: "Confirmer le mot de passe",
                    value: confirm,
                    set: setConfirm,
                  },
                ].map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label
                      htmlFor={field.id}
                      className="block text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--landing-mute)]"
                    >
                      {field.label}
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                        size={16}
                        strokeWidth={1.5}
                      />
                      <input
                        id={field.id}
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 caractères"
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        required
                        minLength={8}
                        className="w-full rounded-xl border border-black/15 bg-white px-11 py-3.5 pr-12 text-sm text-[var(--landing-ink)] outline-none transition-all placeholder:text-black/30 focus:border-black/40 focus:ring-1 focus:ring-black/10"
                      />
                      {field.id === "password" && (
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
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] py-3.5 text-sm font-semibold text-[var(--landing-ivory)] transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Mise à jour..." : "Définir le mot de passe"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-[var(--landing-ink)]/45">
                Lien expiré ?{" "}
                <Link
                  href="/forgot-password"
                  className="font-medium text-[var(--landing-ink)] underline decoration-black/20 underline-offset-4"
                >
                  Demander un nouveau lien
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
