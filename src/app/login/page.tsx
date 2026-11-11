"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage, authQueryErrorMessage } from "@/lib/auth-errors";
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

/* Connexion, sur le gabarit commun des pages de compte (AuthShell). */

const PHOTO = AUTH_PHOTO("photo-1660557989695-14fac79c086d");

/* Supabase Auth n'accepte que des emails : une saisie sans arobase est un
   identifiant court (compte interne, ex. admin2026) que l'on traduit vers
   son email technique. Invisible pour l'utilisateur. */
const INTERNAL_ACCOUNT_DOMAIN = "admin.twocardspro.com";
const toAuthEmail = (identifier: string) => {
  const id = identifier.trim();
  return id.includes("@") ? id : `${id.toLowerCase()}@${INTERNAL_ACCOUNT_DOMAIN}`;
};

function LoginForm() {
  const t = useT();
  const hydrated = useHydrated();
  /* /auth/callback renvoie ici avec ?error=auth quand un lien de
     confirmation ou de réinitialisation est refusé (expiré, déjà utilisé). */
  const queryError = authQueryErrorMessage(useSearchParams().get("error"), t);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitted(true);

    const missing: typeof fieldErrors = {};
    if (!email.trim()) {
      missing.email = t("Indiquez votre e-mail ou votre identifiant.", "Enter your email or username.");
    }
    if (!password) {
      missing.password = t("Indiquez votre mot de passe.", "Enter your password.");
    }
    setFieldErrors(missing);
    if (missing.email || missing.password) {
      document.getElementById(missing.email ? "email" : "password")?.focus();
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth
      .signInWithPassword({ email: toAuthEmail(email), password })
      .catch((err: unknown) => ({ data: null, error: err as { message?: string } }));

    if (error || !data) {
      setError(authErrorMessage(error, t));
      setPassword("");
      setLoading(false);
      return;
    }

    // Redirection complète selon le rôle : window.location déclenche le proxy.
    const role = data.user?.app_metadata?.role ?? data.user?.user_metadata?.role;
    window.location.href =
      role === "admin"
        ? "/admin"
        : role === "concierge"
          ? "/concierge"
          : role === "hotel"
            ? "/hotel"
            : "/dashboard";
  };

  const shownError = error || (!submitted ? queryError : null);

  return (
    <>
      <h1 className={authHeadingClass}>
        {t(
          <>
            Bon <em className="font-light italic">retour</em>.
          </>,
          <>
            Welcome <em className="font-light italic">back</em>.
          </>,
        )}
      </h1>
      <p className={authIntroClass}>
        {t("Connectez-vous à votre espace twocards.", "Log in to your twocards workspace.")}
      </p>

      <form onSubmit={handleSubmit} noValidate={hydrated} className="mt-10 space-y-6">
        {shownError && <AuthAlert>{shownError}</AuthAlert>}

        <AuthField id="email" label={t("E-mail ou identifiant", "Email or username")} error={fieldErrors.email}>
          {/* type=text : un identifiant interne sans arobase doit passer. */}
          <input
            {...fieldProps("email", fieldErrors.email)}
            required
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t("nom@entreprise.com", "name@company.com")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
        </AuthField>

        <AuthField
          id="password"
          label={t("Mot de passe", "Password")}
          error={fieldErrors.password}
          hint={
            <Link
              href="/forgot-password"
              className="underline decoration-black/25 underline-offset-4 transition-colors hover:text-[var(--landing-ink)]"
            >
              {t("Mot de passe oublié ?", "Forgot password?")}
            </Link>
          }
        >
          <div className="relative">
            <input
              {...fieldProps("password", fieldErrors.password)}
              required
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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

        <AuthSubmit loading={loading}>{t("Se connecter", "Log in")}</AuthSubmit>
      </form>

      {/* Sur mobile, le lien d'inscription quitte l'en-tête (trop étroit à
          côté du logo) et vient ici. */}
      <p className="mt-8 text-center text-[14px] text-[var(--landing-mute)] sm:hidden">
        {t("Pas encore de compte ? ", "No account yet? ")}
        <Link href="/signup" className={authLinkClass}>
          {t("Demander un accès", "Request access")}
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  const t = useT();
  return (
    <AuthShell
      image={PHOTO}
      caption={t(
        "Réservations, arrivées et commissions, suivies au même endroit.",
        "Reservations, arrivals and commissions, tracked in one place.",
      )}
      headerLink={
        <span className="hidden sm:inline">
          {t("Pas encore de compte ? ", "No account yet? ")}
          <Link href="/signup" className={authLinkClass}>
            {t("Demander un accès", "Request access")}
          </Link>
        </span>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
