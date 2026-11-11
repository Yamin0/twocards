"use client";

import { ChevronRight } from "lucide-react";
import { RemoteImage } from "@/components/booking/remote-image";
import type { GuestOffer } from "@/lib/guest-catalog";
import { useT } from "@/lib/i18n/client";

/* Carte d'une adresse : la photo, le nom, le prix si l'hôtel l'affiche. Toute
   la carte est le bouton ; l'étiquette et la description attendent la fiche. */
export function OfferCard({
  offer: o,
  showPrice,
  onPick,
}: {
  offer: GuestOffer;
  showPrice: boolean;
  /* Reçoit la carte cliquée : la feuille lui rendra le focus en se fermant. */
  onPick: (card: HTMLElement) => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={(e) => onPick(e.currentTarget)}
      aria-haspopup="dialog"
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.05] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-30px_rgba(0,0,0,0.45)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        <RemoteImage
          src={o.image}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        {o.source === "hotel" && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--on-accent)]">
            {t("Par l'hôtel", "Hotel pick")}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5 sm:px-5 sm:pb-4 sm:pt-4">
        <p className="font-display text-lg font-black leading-tight tracking-tight text-neutral-900 sm:text-xl">{o.name}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2.5">
          <span className="num text-sm font-light italic text-neutral-600">{showPrice && o.price ? o.price : ""}</span>
          <span className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-[var(--on-accent)] transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
            {t("Réserver", "Book")}
            <ChevronRight size={14} strokeWidth={2.5} aria-hidden />
          </span>
        </div>
      </div>
    </button>
  );
}
