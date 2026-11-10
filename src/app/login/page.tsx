"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

/* Connexion, même construction que la demande d'accès (/signup) : photo à
   gauche sur grand écran, formulaire sobre à droite, mêmes champs et même
   bouton. Sur mobile, le formulaire seul. */

const PHOTO =
  "https://images.unsplash.com/photo-1660557989695-14fac79c086d?auto=format&fit=crop&w=1400&q=80";

const inputClass =
  "h-12 w-full rounded-xl border border-black/[0.12] bg-white px-4 text-[15px] text-[var(--landing-ink)] outline-none transition-colors placeholder:text-black/30 hover:border-black/25 focus:border-[var(--landing-ink)]";

/* Supabase Auth n'accepte que des emails : une saisie sans arobase est un
   identifiant court (compte interne, ex. admin2026) que l'on traduit vers
   son email technique. Invisible pour l'utilisateur. */
const INTERNAL_ACCOUNT_DOMAIN = "admin.twocardspro.com";
const toAuthEmail = (identifier: string) => {
  const id = identifier.trim();
  return id.includes("@") ? id : `${id.toLowerCase()}@${INTERNAL_ACCOUNT_DOMAIN}`;
};

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 text-[24px] font-semibold leading-none tracking-tight ${
        light ? "text-white" : "text-[var(--landing-ink)]"
      }`}
    >
      <Image src="/logo-cards-transp.png" alt="" width={64} height={64} className="h-6 w-auto" />
      <span>
        twocards<span className={light ? "text-white/50" : "text-[var(--landing-mute)]"}>.</span>
      </span>
    </Link>
  );
}

export default function LoginPage() {
  const t = useT();
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
      email: toAuthEmail(email),
      password,
    });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? t("Identifiant ou mot de passe incorrect.", "Incorrect username or password.")
          : error.message === "Email not confirmed"
            ? t(
                "Adresse e-mail pas encore confirmée : cliquez sur le lien reçu par e-mail.",
                "Email address not confirmed yet: click the link we emailed you.",
              )
            : error.message
      );
      setPassword("");
      setLoading(false);
      return;
    }

    // Hard redirect based on role — must use window.location to trigger middleware
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

  return (
    <div className="landing-satoshi min-h-screen bg-[var(--landing-ivory)] font-body text-[var(--landing-ink)] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden lg:block">
        <div className="sticky top-0 h-screen overflow-hidden bg-[#1a1612]">
          {/* Conteneur absolu : next/image « fill » refuse un parent sticky. */}
          <div className="absolute inset-0">
            <Image src={PHOTO} alt="" fill priority sizes="45vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
          <div className="absolute left-10 top-8">
            <Wordmark light />
          </div>
          <div className="absolute inset-x-10 bottom-12 max-w-md text-white">
            <p className="text-[14px] text-white/60">{t("Votre espace", "Your workspace")}</p>
            <p className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
              {t(
                "Réservations, arrivées et commissions, suivies au même endroit.",
                "Reservations, arrivals and commissions, tracked in one place.",
              )}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <header className="flex h-10 items-center justify-between gap-4">
          <div className="lg:hidden">
            <Wordmark />
          </div>
          <p className="ml-auto hidden shrink-0 text-[14px] text-[var(--landing-mute)] sm:block">
            {t("Pas encore de compte ? ", "No account yet? ")}
            <Link
              href="/signup"
              className="font-medium text-[var(--landing-ink)] underline decoration-black/20 underline-offset-4 hover:decoration-black/60"
            >
              {t("Demander un accès", "Request access")}
            </Link>
          </p>
          <LanguageSwitcher className="shrink-0" />
        </header>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-[460px] py-12 lg:py-16">
            <h1 className="text-[36px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[48px]">
              {t(<>Bon <em className="font-light italic">retour</em>.</>, <>Welcome <em className="font-light italic">back</em>.</>)}
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/65">
              {t("Connectez-vous à votre espace twocards.", "Log in to your twocards workspace.")}
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div>
                <label htmlFor="email" className="mb-2 block text-[14px] font-medium">
                  {t("E-mail ou identifiant", "Email or username")}
                </label>
                {/* type=text : un identifiant interne sans arobase doit
                    passer la validation du champ. */}
                <input
                  id="email"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={t("nom@entreprise.com", "name@company.com")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <label htmlFor="password" className="text-[14px] font-medium">
                    {t("Mot de passe", "Password")}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[13px] text-[var(--landing-mute)] underline decoration-black/15 underline-offset-4 transition-colors hover:text-[var(--landing-ink)]"
                  >
                    {t("Mot de passe oublié ?", "Forgot password?")}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`${inputClass} pr-24`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[13px] font-medium text-[var(--landing-ink)]/55 transition-colors hover:text-[var(--landing-ink)]"
                  >
                    {showPassword ? t("Masquer", "Hide") : t("Afficher", "Show")}
                  </button>
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <>
                    {t("Se connecter", "Log in")}
                    <ArrowRight size={16} strokeWidth={1.75} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Sur mobile, le lien d'inscription quitte l'en-tête (trop
                étroit à côté du logo) et vient ici. */}
            <p className="mt-8 text-center text-[14px] text-[var(--landing-mute)] sm:hidden">
              {t("Pas encore de compte ? ", "No account yet? ")}
              <Link
                href="/signup"
                className="font-medium text-[var(--landing-ink)] underline decoration-black/20 underline-offset-4"
              >
                {t("Demander un accès", "Request access")}
              </Link>
            </p>
          </div>
        </div>

        <footer className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-black/35">
          <span>&copy; {new Date().getFullYear()} twocards.</span>
          <Link href="/legal/cgu" className="transition-colors hover:text-black/60">
            {t("Conditions", "Terms")}
          </Link>
          <Link href="/legal/confidentialite" className="transition-colors hover:text-black/60">
            {t("Confidentialité", "Privacy")}
          </Link>
        </footer>
      </main>
    </div>
  );
}
