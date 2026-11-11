"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
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
  fieldProps,
  useHydrated,
} from "@/components/landing/auth-shell";

/* Mot de passe oublié, sur le gabarit commun des pages de compte. */

const PHOTO = AUTH_PHOTO("photo-1660557989695-14fac79c086d");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ForgotPasswordPage() {
  const t = useT();
  const hydrated = useHydrated();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const address = email.trim();
    if (!EMAIL.test(address)) {
      setFieldError(
        address
          ? t("Cette adresse e-mail ne semble pas valide.", "This email address doesn't look valid.")
          : t("Indiquez l'e-mail de votre compte.", "Enter your account email."),
      );
      document.getElementById("email")?.focus();
      return;
    }
    setFieldError("");
    setLoading(true);

    const { error } = await createClient()
      .auth.resetPasswordForEmail(address, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })
      .catch((err: unknown) => ({ error: err as { message?: string } }));

    setLoading(false);
    if (error) {
      setError(authErrorMessage(error, t));
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell
      image={PHOTO}
      eyebrow={t("Votre espace", "Your workspace")}
      caption={t(
        "Un lien par e-mail, et vous retrouvez votre espace.",
        "One link by email, and you're back in your workspace.",
      )}
    >
      {sent ? (
        <div role="status">
          <h1 className={authHeadingClass}>{t("Vérifiez votre boîte mail.", "Check your inbox.")}</h1>
          <p className={authIntroClass}>
            {t(
              <>
                Si un compte existe pour{" "}
                <span className="font-medium text-[var(--landing-ink)]">{email.trim()}</span>, vous
                recevrez un lien pour définir un nouveau mot de passe.
              </>,
              <>
                If an account exists for{" "}
                <span className="font-medium text-[var(--landing-ink)]">{email.trim()}</span>,
                you&apos;ll receive a link to set a new password.
              </>,
            )}
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] px-7 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
          >
            {t("Retour à la connexion", "Back to log in")}
            <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          <h1 className={authHeadingClass}>{t("Mot de passe oublié ?", "Forgot your password?")}</h1>
          <p className={authIntroClass}>
            {t(
              "Indiquez l'e-mail de votre compte : nous vous envoyons un lien sécurisé pour en définir un nouveau.",
              "Enter your account email and we'll send you a secure link to set a new one.",
            )}
          </p>

          <form onSubmit={handleSubmit} noValidate={hydrated} className="mt-10 space-y-6">
            {error && <AuthAlert>{error}</AuthAlert>}

            <AuthField id="email" label={t("E-mail", "Email")} error={fieldError}>
              <input
                {...fieldProps("email", fieldError)}
                required
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={t("nom@entreprise.com", "name@company.com")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authInputClass}
              />
            </AuthField>

            <AuthSubmit loading={loading}>{t("Envoyer le lien", "Send the link")}</AuthSubmit>
          </form>

          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 text-[14px] text-[var(--landing-ink)]/70 transition-colors hover:text-[var(--landing-ink)]"
          >
            <ArrowLeft size={15} strokeWidth={1.75} aria-hidden />
            {t("Retour à la connexion", "Back to log in")}
          </Link>
        </>
      )}
    </AuthShell>
  );
}
