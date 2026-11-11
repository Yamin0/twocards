"use client";

import { ArrowRight } from "lucide-react";
import { RemoteImage } from "@/components/booking/remote-image";
import type { GuestOffer } from "@/lib/guest-catalog";
import { useT } from "@/lib/i18n/client";

/* Carte d'une adresse, sans cadre ni ombre : la photo, le nom, le prix si
   l'hôte l'affiche, l'appel à réserver. Toute la carte est le bouton ;
   l'étiquette et la description attendent la fiche. */
export function OfferCard({
  offer: o,
  showPrice,
  pickBadge,
  onPick,
}: {
  offer: GuestOffer;
  showPrice: boolean;
  /* Pastille d'une adresse maison, selon l'hôte : « Par l'hôtel », « Coup de cœur ». */
  pickBadge: string;
  /* Reçoit la carte cliquée : la feuille lui rendra le focus en se fermant. */
  onPick: (card: HTMLElement) => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={(e) => onPick(e.currentTarget)}
      aria-haspopup="dialog"
      className="group flex h-full w-full flex-col text-left"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-neutral-200">
        <RemoteImage
          src={o.image}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {o.source === "hotel" && (
          <span className="absolute left-3 top-3 rounded-full bg-[#FFFDF9] px-2.5 py-1 text-[11px] font-medium text-neutral-900">
            {pickBadge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col pt-3">
        <p className="text-lg font-bold leading-snug tracking-[-0.02em] text-[color:var(--on-page)]">{o.name}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-sm font-light italic text-[color:var(--on-page-muted)]">
            {showPrice && o.price ? o.price : ""}
          </span>
          <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-[13px] font-medium text-[var(--on-accent)]">
            {t("Réserver", "Book")}
            <ArrowRight
              size={14}
              strokeWidth={1.75}
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </span>
        </div>
      </div>
    </button>
  );
}
