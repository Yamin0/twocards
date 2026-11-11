"use client";

import { useRef, useState } from "react";
import { RetryPanel } from "@/components/booking/retry-panel";
import type { GuestMenuResult } from "@/lib/booking/load";
import type { GuestCategory, GuestCategoryKey, GuestOffer } from "@/lib/guest-catalog";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { CategoryBanners } from "./_components/category-banners";
import { CategoryView } from "./_components/category-view";
import { GuestFooter, InactiveMenu } from "./_components/guest-footer";
import { GuestHeader } from "./_components/guest-header";
import { ReservationSheet } from "./_components/reservation-sheet";
import { useGuestTheme } from "./_hooks/use-guest-theme";
import { useTrackScan } from "./_hooks/use-track-scan";

/* Menu client après scan — style « widget de réservation » à la SevenRooms :
   fond clair, blanc, typographie noire en Satoshi, une seule couleur
   d'accent (celle de l'hôtel), beaucoup d'air.

   Deux mises en page pour un même contenu. Sur téléphone (le QR est scanné
   avec), une colonne : titre, bandeaux, liste. Sur grand écran (lien reçu
   par e-mail ou WhatsApp), une vraie page web : titre sur deux colonnes,
   grille d'adresses.

   Le menu arrive déjà chargé du serveur (`page.tsx`) : ce composant ne fait
   plus que l'afficher et ouvrir la feuille de réservation. Parcours en trois
   temps — choisir une adresse, régler personnes / date / heure, laisser ses
   coordonnées — puis confirmation. Sans compte, sans paiement. */

const DEFAULT_ACCENT = "#13305c";
const DEFAULT_BACKGROUND = "#f4f3ef";

export function GuestExperience({
  code,
  result,
  fallbackHotelName,
  fallbackCity,
  preview = false,
}: {
  code: string;
  result: GuestMenuResult;
  /* Secours des anciens QR (`?h=` et `?c=`), quand le profil n'a pas de nom. */
  fallbackHotelName: string | null;
  fallbackCity: string | null;
  preview?: boolean;
}) {
  const t = useT();
  const ready = result.status === "ready";
  const hotel = ready ? result.hotel : null;
  const menu = ready ? result.menu : [];
  const [category, setCategory] = useState<GuestCategoryKey | "tous">("tous");
  const [open, setOpen] = useState<{ offer: GuestOffer; category: GuestCategory } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  /* La carte d'où la feuille a été ouverte, pour lui rendre le focus. */
  const openerRef = useRef<HTMLElement | null>(null);

  useTrackScan(code, !preview);
  const { style, darkPage } = useGuestTheme(hotel?.accent ?? DEFAULT_ACCENT, hotel?.background ?? DEFAULT_BACKGROUND);

  const city = hotel?.city ?? fallbackCity;
  const hotelName = hotel?.hotelName ?? fallbackHotelName ?? t("Votre hôtel", "Your hotel");
  const welcome =
    hotel?.welcome ??
    (city
      ? t(
          `Les meilleures adresses de ${city}, réservées en quelques secondes, nous nous occupons du reste.`,
          `The best places in ${city}, booked in seconds. We take care of the rest.`
        )
      : t(
          "Réservez vos plus belles sorties en quelques secondes, nous nous occupons du reste.",
          "Book your finest outings in seconds. We take care of the rest."
        ));

  const total = menu.reduce((s, c) => s + c.offers.length, 0);
  const counted = ready && total > 0;
  /* Ourlet du titre. QR désactivé ou panne : annoncer une sélection qu'on ne
     montre pas serait absurde. */
  const metaItems = ready
    ? [
        counted ? t(`${total} adresse${total > 1 ? "s" : ""}`, `${total} place${total === 1 ? "" : "s"}`) : null,
        city,
        t("Sélection de l'hôtel", "Curated by the hotel"),
      ].filter((v): v is string => Boolean(v))
    : [];

  /* Une catégorie retirée entre-temps (changement de langue, rechargement)
     ramène à la vue d'ensemble. */
  const current = category === "tous" ? null : (menu.find((c) => c.key === category) ?? null);

  const pick = (key: GuestCategoryKey | "tous") => {
    setCategory(key);
    /* À chaque changement de vue, on ramène la liste en haut de l'écran, sans
       repasser par le titre — et sans animation si le client l'a demandé. */
    if (listRef.current) {
      const top = listRef.current.getBoundingClientRect().top + window.scrollY - 12;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (window.scrollY > top) window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    }
  };

  return (
    <div
      data-guest=""
      className="satoshi min-h-screen bg-[var(--page)] text-neutral-900 selection:bg-[var(--accent)] selection:text-[var(--on-accent)]"
      style={style}
    >
      {/* Anneau de focus visible au clavier, à la couleur de l'hôtel quand elle
          se lit, et pas d'animation pour qui n'en veut pas. */}
      <style>{`
        [data-guest] :focus-visible:not([tabindex="-1"]) { outline: 2px solid var(--accent-ink); outline-offset: 2px; }
        [data-guest] [role="dialog"] :focus-visible:not([tabindex="-1"]) { outline-color: var(--accent-on-white); }
        @media (prefers-reduced-motion: reduce) { [data-guest] * { scroll-behavior: auto !important; } }
      `}</style>

      <GuestHeader
        label={hotel?.label ?? null}
        hotelName={hotelName}
        welcome={welcome}
        metaItems={metaItems}
        highlightFirst={counted}
        darkPage={darkPage}
      />

      {result.status === "inactive" ? (
        <InactiveMenu reception={null} hotelName={hotelName} />
      ) : result.status === "error" ? (
        <main className="px-3 py-6">
          <RetryPanel
            title={t("Le menu ne s'est pas chargé", "The menu didn't load")}
            className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.05]"
          >
            {t(
              "La connexion a été interrompue. Réessayez dans un instant, ou adressez-vous à la réception.",
              "The connection was interrupted. Try again in a moment, or ask at reception."
            )}
          </RetryPanel>
        </main>
      ) : (
        <main
          ref={listRef}
          className={cn(
            "mx-auto w-full pb-2 pt-3 sm:pt-6 lg:pt-8",
            /* Les bandeaux de catégories s'étirent presque bord à bord, sur
               la même gouttière que le titre ; les listes d'adresses gardent
               la largeur de lecture. */
            current ? "max-w-6xl px-3 sm:px-8 lg:px-10" : "max-w-[1800px] px-3 sm:px-4 lg:px-5"
          )}
        >
          {current ? (
            <CategoryView
              key={current.key}
              menu={menu}
              current={current}
              total={total}
              showPrices={hotel?.showPrices ?? true}
              onPick={pick}
              onOpen={(offer, cat, card) => {
                openerRef.current = card;
                setOpen({ offer, category: cat });
              }}
            />
          ) : (
            <CategoryBanners menu={menu} onPick={pick} />
          )}
        </main>
      )}

      <GuestFooter hotelName={hotelName} reception={hotel?.reception ?? null} darkPage={darkPage} />

      {open && (
        <ReservationSheet
          code={code}
          category={open.category}
          offer={open.offer}
          hotelName={hotelName}
          preview={preview}
          openerRef={openerRef}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
