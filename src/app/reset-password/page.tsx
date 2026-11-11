"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "@/lib/auth-errors";
import { useT } from "@/lib/i18n/client";
import {
  AUTH_PHOTO,
  AuthAlert,
  AuthField,
  AuthShell,
  AuthSubmit,
  authHeadingClass,
  authInputClass,
  authIntroClass,
  authLinkClass,
  fieldProps,
  useHydrated,
} from "@/components/landing/auth-shell";

/* Nouveau mot de passe (lien reçu par e-mail), sur le gabarit commun des
   pages de compte. Une fois le mot de passe défini, on renvoie à la
   connexion : c'est elle qui dirige vers le bon espace selon le rôle. */

const PHOTO = AUTH_PHOTO("photo-1660557989695-14fac79c086d");

export default function ResetPasswordPage() {
  const t = useT();
  const hydrated = useHydrated();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const errors: typeof fieldErrors = {};
    if (password.length < 8) {
      errors.password = t(
        "Le mot de passe doit contenir au moins 8 caractères.",
        "Your password must be at least 8 characters long.",
      );
    }
    if (!errors.password && password !== confirm) {
      errors.confirm = t("Les deux mots de passe ne correspondent pas.", "The two passwords don't match.");
    }
    setFieldErrors(errors);
    if (errors.password || errors.confirm) {
      document.getElementById(errors.password ? "password" : "confirm")?.focus();
      return;
    }

    setLoading(true);
    const { error } = await createClient()
      .auth.updateUser({ password })
      .catch((err: unknown) => ({ error: err as { message?: string } }));
    setLoading(false);

    if (error) {
      setError(authErrorMessage(error, t));
      return;
    }
    setDone(true);
  };

  return (
    <AuthShell
      image={PHOTO}
      eyebrow={t("Votre espace", "Your workspace")}
      caption={t(
        "Un nouveau mot de passe, et vous retrouvez votre espace.",
        "A new password, and you're back in your workspace.",
      )}
    >
      {done ? (
        <div role="status">
          <h1 className={authHeadingClass}>{t("Mot de passe mis à jour.", "Password updated.")}</h1>
          <p className={authIntroClass}>
            {t(
              "Connectez-vous avec votre nouveau mot de passe pour retrouver votre espace.",
              "Log in with your new password to get back to your workspace.",
            )}
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
          >
            {t("Se connecter", "Log in")}
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          <h1 className={authHeadingClass}>{t("Nouveau mot de passe", "New password")}</h1>
          <p className={authIntroClass}>
            {t(
              "Choisissez le mot de passe avec lequel vous vous connecterez désormais.",
              "Choose the password you'll log in with from now on.",
            )}
          </p>

          <form onSubmit={handleSubmit} noValidate={hydrated} className="mt-10 space-y-6">
            {error && <AuthAlert>{error}</AuthAlert>}

            <AuthField
              id="password"
              label={t("Nouveau mot de passe", "New password")}
              hint={t("8 caractères minimum", "At least 8 characters")}
              error={fieldErrors.password}
            >
              <div className="relative">
                <input
                  {...fieldProps("password", fieldErrors.password)}
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${authInputClass} pr-24`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[13px] font-medium text-[var(--landing-ink)]/70 transition-colors hover:text-[var(--landing-ink)]"
                >
                  {showPassword ? t("Masquer", "Hide") : t("Afficher", "Show")}
                </button>
              </div>
            </AuthField>

            <AuthField
              id="confirm"
              label={t("Confirmer le mot de passe", "Confirm password")}
              error={fieldErrors.confirm}
            >
              <input
                {...fieldProps("confirm", fieldErrors.confirm)}
                required
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={authInputClass}
              />
            </AuthField>

            <AuthSubmit loading={loading}>{t("Définir le mot de passe", "Set password")}</AuthSubmit>
          </form>

          <p className="mt-8 text-[14px] text-[var(--landing-mute)]">
            {t("Lien expiré ?", "Link expired?")}{" "}
            <Link href="/forgot-password" className={authLinkClass}>
              {t("Demander un nouveau lien", "Request a new link")}
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
