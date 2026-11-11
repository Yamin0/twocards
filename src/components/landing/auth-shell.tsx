"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

/* Gabarit commun des pages de compte (connexion, demande d'accès, mot de
   passe oublié, nouveau mot de passe) : photo à gauche sur grand écran,
   formulaire sobre à droite, mêmes champs, mêmes messages, même bouton.
   Sur mobile, le formulaire seul. */

export const AUTH_PHOTO = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

export const authInputClass =
  "h-12 w-full rounded-xl border border-black/20 bg-white px-4 text-[16px] text-[var(--landing-ink)] outline-none transition-colors placeholder:text-black/40 hover:border-black/35 focus:border-[var(--landing-ink)] focus-visible:ring-2 focus-visible:ring-[var(--landing-ink)]/15 aria-[invalid=true]:border-red-600";

export const authHeadingClass =
  "text-[36px] font-bold leading-[1.05] tracking-[-0.03em] outline-none md:text-[48px]";

export const authIntroClass = "mt-4 text-[16px] leading-relaxed text-[var(--landing-ink)]/70";

export const authLinkClass =
  "font-medium text-[var(--landing-ink)] underline decoration-black/30 underline-offset-4 hover:decoration-black/70";

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 text-[24px] font-semibold leading-none tracking-tight ${
        light ? "text-white" : "text-[var(--landing-ink)]"
      }`}
    >
      <Image src="/logo-cards-transp.png" alt="" width={64} height={64} className="h-6 w-auto" />
      <span>
        twocards<span className={light ? "text-white/55" : "text-[var(--landing-mute)]"}>.</span>
      </span>
    </Link>
  );
}

/* Champ étiqueté, avec son message d'erreur relié au champ : l'enfant
   reçoit l'id du message par aria-describedby (voir fieldProps). */
export function AuthField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14px] font-medium">
          {label}
        </label>
        {hint && <span className="text-[13px] font-normal text-[var(--landing-mute)]">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-[14px] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/* Attributs d'accessibilité d'un champ selon son erreur. */
export function fieldProps(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}

/* Vrai une fois la page hydratée. Les formulaires gardent la validation
   native du navigateur (attributs required) tant que le script n'a pas pris
   la main, puis passent aux messages champ par champ :
   <form noValidate={useHydrated()}>. Un envoi parti avant l'hydratation
   n'est donc jamais un formulaire vide. */
const subscribeNever = () => () => {};
export function useHydrated() {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}

export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-[14px] leading-relaxed text-red-800">
      {children}
    </p>
  );
}

export function AuthSubmit({ loading, children }: { loading?: boolean; children: ReactNode }) {
  const t = useT();
  return (
    <button
      type="submit"
      disabled={loading}
      className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--landing-ink)] text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2 size={17} className="animate-spin" aria-hidden />
          <span className="sr-only">{t("Envoi en cours", "Sending")}</span>
        </>
      ) : (
        <>
          {children}
          <ArrowRight
            size={16}
            strokeWidth={1.75}
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          />
        </>
      )}
    </button>
  );
}

export function AuthShell({
  image,
  caption,
  headerLink,
  maxWidth = "max-w-[460px]",
  children,
}: {
  /* Photo du panneau (grand écran). Une seule image est montée à la fois :
     quand elle change, la nouvelle arrive en fondu. */
  image: string;
  caption: string;
  /* Lien de l'en-tête (« Pas encore de compte ? … »). */
  headerLink?: ReactNode;
  maxWidth?: string;
  children: ReactNode;
}) {
  const t = useT();
  /* La première photo s'affiche sans effet ; seules les suivantes (survol
     d'un métier dans la demande d'accès) arrivent en fondu. */
  const [firstImage] = useState(image);
  return (
    <div className="landing-satoshi min-h-screen bg-[var(--landing-ivory)] font-body text-[var(--landing-ink)] lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden lg:block">
        <div className="sticky top-0 h-screen overflow-hidden bg-[#1a1612]">
          {/* Conteneur absolu : next/image « fill » refuse un parent sticky. */}
          <div className="absolute inset-0">
            <Image
              key={image}
              src={image}
              alt=""
              fill
              sizes="(min-width: 1024px) 45vw, 1px"
              className={`object-cover ${image === firstImage ? "" : "landing-fade"}`}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
          <div className="absolute left-10 top-8">
            <Wordmark light />
          </div>
          <div className="absolute inset-x-10 bottom-12 max-w-md text-white">
            <p className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
              {caption}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <header className="flex h-10 items-center justify-between gap-4">
          <div className="lg:hidden">
            <Wordmark />
          </div>
          {headerLink && (
            <p className="ml-auto shrink-0 text-[14px] text-[var(--landing-mute)]">{headerLink}</p>
          )}
          <LanguageSwitcher className={`shrink-0 ${headerLink ? "" : "ml-auto"}`} />
        </header>

        <div className="flex flex-1 items-center">
          <div className={`mx-auto w-full ${maxWidth} py-12 lg:py-16`}>{children}</div>
        </div>

        <footer className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[var(--landing-mute)]">
          <span>&copy; {new Date().getFullYear()} twocards.</span>
          <Link href="/legal/cgu" className="transition-colors hover:text-[var(--landing-ink)]">
            {t("Conditions", "Terms")}
          </Link>
          <Link href="/legal/confidentialite" className="transition-colors hover:text-[var(--landing-ink)]">
            {t("Confidentialité", "Privacy")}
          </Link>
        </footer>
      </main>
    </div>
  );
}
