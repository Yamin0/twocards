"use client";

import { useState } from "react";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useLocale, useSetLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/* Sélecteur FR / EN des pages clients (menu QR, portail, avis). Même dessin
   que celui du site, mais chaque langue offre une cible tactile de 44 px :
   ces pages sont ouvertes au pouce, sur un téléphone.

   `viaUrl` : dans une iframe posée sur le site d'un établissement, le cookie
   de langue est un cookie tiers que le navigateur refuse. La langue voyage
   alors dans l'adresse (`?lang=en`), que le proxy lit sans rediriger. */
export function LanguageToggle({
  tone = "light",
  viaUrl = false,
  className,
}: {
  tone?: "light" | "dark";
  viaUrl?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const { setLocale, pending: cookiePending } = useSetLocale();
  const [leaving, setLeaving] = useState(false);
  const pending = cookiePending || leaving;
  const onDark = tone === "dark";

  const choose = (next: Locale) => {
    if (!viaUrl) {
      setLocale(next);
      return;
    }
    /* Rechargement complet : la langue est lue par le proxy puis descend du
       layout racine, qu'une navigation côté client ne rend pas à nouveau. */
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    setLeaving(true);
    window.location.assign(url.pathname + url.search);
  };

  return (
    <div
      role="group"
      aria-label={locale === "en" ? "Language" : "Langue"}
      className={cn("inline-flex items-center", pending && "opacity-60", className)}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={active}
            aria-label={l === "fr" ? "Français" : "English"}
            disabled={active || pending}
            onClick={() => choose(l)}
            className="group flex h-11 min-w-11 items-center justify-center px-0.5 text-[12px] font-medium uppercase tracking-[0.14em]"
          >
            <span
              className={cn(
                "rounded-full px-2.5 py-1.5 leading-none ring-1 transition-colors",
                active
                  ? onDark
                    ? "bg-white text-black ring-white"
                    : "bg-neutral-900 text-white ring-neutral-900"
                  : onDark
                    ? "bg-black/20 text-white/85 ring-white/25 group-hover:text-white"
                    : "bg-white/85 text-neutral-700 ring-black/15 group-hover:text-black"
              )}
            >
              {l}
            </span>
          </button>
        );
      })}
    </div>
  );
}
