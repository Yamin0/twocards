"use client";

import { LanguageToggle } from "@/components/booking/language-toggle";
import { cn } from "@/lib/utils";

/* Page de titre. Pas de bannière : les photos des catégories, juste en
   dessous, font déjà tout le travail d'image. Ici on annonce, sur papier
   ivoire : où l'on se trouve, chez qui, et ce que contient la sélection. */
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
  /* Le premier élément est le décompte d'adresses : il passe en gras. */
  highlightFirst: boolean;
  darkPage: boolean;
}) {
  return (
    <header className="mx-auto w-full max-w-[1800px] px-4 pb-2 pt-4 sm:px-6 sm:pt-5 lg:px-8">
      <div className="flex min-h-9 items-center justify-between gap-4">
        <p className="truncate text-[13px] font-medium text-[color:var(--on-page-muted)]">{label}</p>
        <LanguageToggle tone={darkPage ? "dark" : "light"} className="shrink-0" />
      </div>

      {/* Le nom pèse, le chapô respire : deux colonnes posées sur la même
          ligne de pied en grand écran, empilées sur téléphone. */}
      <div className="mt-10 grid gap-x-12 gap-y-4 duration-700 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none sm:mt-14 lg:mt-20 lg:grid-cols-12 lg:items-end lg:gap-y-0">
        <h1 className="text-[clamp(2.5rem,9vw,5.5rem)] font-bold leading-[0.92] tracking-[-0.045em] text-[color:var(--on-page)] lg:col-span-7">
          {hotelName}
        </h1>
        <p className="max-w-md text-base font-light leading-relaxed text-[color:var(--on-page-muted)] sm:text-lg lg:col-span-5 lg:pb-[0.35em]">
          {welcome}
        </p>
      </div>

      {metaItems.length > 0 && (
        <p className="mt-8 flex flex-wrap items-baseline gap-x-2 border-t border-[color:var(--rule)] pt-3 text-[13px] text-[color:var(--on-page-muted)] sm:mt-12 sm:text-sm">
          {metaItems.map((item, i) => (
            /* Au-delà de deux mentions, la ligne déborde sur téléphone : on
               garde l'essentiel. */
            <span key={item} className={cn("items-baseline gap-2", i > 1 ? "hidden sm:inline-flex" : "inline-flex")}>
              {i > 0 && <span aria-hidden>·</span>}
              <span
                className={cn(
                  i === 0 && highlightFirst && "num font-bold text-[color:var(--on-page)]",
                  i > 0 && "font-light italic"
                )}
              >
                {item}
              </span>
            </span>
          ))}
        </p>
      )}
    </header>
  );
}
