"use client";

import { LanguageToggle } from "@/components/booking/language-toggle";
import { cn } from "@/lib/utils";

/* Page de titre. Pas de bannière : les photos des catégories, juste en
   dessous et presque bord à bord, font déjà tout le travail d'image. Ici on
   annonce : où l'on se trouve, chez qui, et ce que contient la sélection. */
export function GuestHeader({
  label,
  hotelName,
  welcome,
  metaItems,
  highlightFirst,
  darkPage,
}: {
  /* Le libellé du QR, tel que l'hôtel l'a saisi : « Chambre 129 », « Lobby ». */
  label: string | null;
  hotelName: string;
  welcome: string;
  metaItems: string[];
  /* Le premier élément est le décompte d'adresses : il prend l'accent. */
  highlightFirst: boolean;
  darkPage: boolean;
}) {
  return (
    <header className="relative mx-auto w-full max-w-[1800px] px-3 pb-2 pt-12 sm:px-4 sm:pt-14 lg:px-5 lg:pt-16">
      <LanguageToggle tone={darkPage ? "dark" : "light"} className="absolute right-1.5 top-1 sm:right-2.5 sm:top-2 lg:right-3.5" />
      {label && (
        <p className="text-sm font-bold text-[color:var(--accent-ink)] duration-700 animate-in fade-in motion-reduce:animate-none sm:text-base">
          {label}
        </p>
      )}

      {/* Le nom pèse, le chapô respire : deux colonnes posées sur la même
          ligne de pied en grand écran, empilées sur téléphone. */}
      <div
        className={cn(
          "grid gap-x-12 gap-y-5 duration-700 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none lg:grid-cols-12 lg:items-end lg:gap-y-0",
          label && "mt-2 sm:mt-3"
        )}
      >
        <h1 className="font-display text-[clamp(2.4rem,8.5vw,5.25rem)] font-black leading-[0.88] tracking-[-0.045em] text-[color:var(--on-page)] lg:col-span-7">
          {hotelName}
        </h1>
        <p className="max-w-lg text-base font-light leading-[1.6] text-[color:var(--on-page)] opacity-90 sm:text-lg lg:col-span-5 lg:pb-[0.4em]">
          {welcome}
        </p>
      </div>

      {metaItems.length > 0 && (
        <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[color:var(--rule)] pt-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--on-page-muted)] duration-700 animate-in fade-in motion-reduce:animate-none sm:mt-9 sm:text-xs">
          {metaItems.map((item, i) => (
            /* Au-delà de deux mentions ça passe à la ligne sur téléphone et
               le losange se retrouve en tête de ligne : on garde l'essentiel. */
            <span key={item} className={cn("items-center gap-3", i > 1 ? "hidden sm:flex" : "flex")}>
              {i > 0 && <span aria-hidden className="h-[3px] w-[3px] rotate-45 bg-current opacity-60" />}
              <span className={cn(i === 0 && highlightFirst && "num text-[color:var(--accent-ink)]")}>{item}</span>
            </span>
          ))}
        </div>
      )}
    </header>
  );
}
