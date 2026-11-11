"use client";

import { useId, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { RemoteImage } from "@/components/booking/remote-image";
import type { GuestCategory, GuestCategoryKey, GuestOffer } from "@/lib/guest-catalog";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { OfferCard } from "./offer-card";

/* Onglet de catégorie : du texte posé sur le filet, souligné quand il est
   actif. Pas d'icône, pas de pastille. */
function CategoryTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "-mb-px inline-flex h-11 shrink-0 items-baseline gap-1.5 border-b-2 pt-3 text-sm transition-colors",
        active
          ? "border-[color:var(--on-page)] font-bold text-[color:var(--on-page)]"
          : "border-transparent font-medium text-[color:var(--on-page-muted)] hover:text-[color:var(--on-page)]"
      )}
    >
      {label}
      <span className="text-xs font-light italic">{count}</span>
    </button>
  );
}

/* Une catégorie ouverte : son bandeau, les onglets pour passer à une autre,
   la recherche (au-delà de quatre adresses) et la grille. La recherche vit
   ici : elle repart de zéro à chaque changement de catégorie. */
export function CategoryView({
  menu,
  current,
  total,
  showPrices,
  pickBadge,
  onPick,
  onOpen,
}: {
  menu: GuestCategory[];
  current: GuestCategory;
  total: number;
  showPrices: boolean;
  /* Pastille des adresses maison : « Par l'hôtel », « Coup de cœur »… */
  pickBadge: string;
  onPick: (key: GuestCategoryKey | "tous") => void;
  onOpen: (offer: GuestOffer, category: GuestCategory, card: HTMLElement) => void;
}) {
  const t = useT();
  const searchId = useId();
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const offers = q
    ? current.offers.filter(
        (o) => o.name.toLowerCase().includes(q) || o.tag.toLowerCase().includes(q) || o.description.toLowerCase().includes(q)
      )
    : current.offers;
  const searchLabel = t(`Rechercher dans ${current.label.toLowerCase()}`, `Search ${current.label.toLowerCase()}`);

  return (
    <div>
      <div className="relative h-36 overflow-hidden rounded-md bg-neutral-300 text-white sm:h-48 lg:h-56">
        <RemoteImage src={current.image} fill preload sizes="(max-width: 1152px) 100vw, 1152px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/10" />
        <button
          type="button"
          onClick={() => onPick("tous")}
          aria-label={t("Retour aux catégories", "Back to categories")}
          className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFDF9] text-neutral-900 transition-opacity hover:opacity-90 sm:left-4 sm:top-4"
        >
          <ArrowLeft size={18} strokeWidth={1.75} aria-hidden />
        </button>
        {/* Le calque du titre laisse passer les clics. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-4 sm:px-7 sm:pb-6">
          <h2 className="text-[1.65rem] font-bold leading-none tracking-[-0.03em] sm:text-4xl">{current.label}</h2>
          <p className="mt-2 text-sm font-light italic text-white/85 sm:text-base">{current.tagline}</p>
        </div>
      </div>

      <nav
        aria-label={t("Catégories", "Categories")}
        className="no-scrollbar mt-4 flex gap-6 overflow-x-auto border-b border-[color:var(--rule)] sm:mt-6 sm:gap-8"
      >
        <CategoryTab active={false} onClick={() => onPick("tous")} label={t("Tout", "All")} count={total} />
        {menu.map((c) => (
          <CategoryTab
            key={c.key}
            active={c.key === current.key}
            onClick={() => onPick(c.key)}
            label={c.label}
            count={c.offers.length}
          />
        ))}
      </nav>

      {current.offers.length > 4 && (
        <div className="relative mt-4">
          <label htmlFor={searchId} className="sr-only">
            {searchLabel}
          </label>
          <Search
            size={16}
            strokeWidth={1.75}
            className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-[color:var(--on-page-muted)]"
            aria-hidden
          />
          <input
            id={searchId}
            type="search"
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${searchLabel}…`}
            className="h-12 w-full border-b border-[color:var(--rule)] bg-transparent pl-7 pr-2 text-base text-[color:var(--on-page)] placeholder:text-[color:var(--on-page-muted)] focus:border-[color:var(--on-page)] focus:outline-none"
          />
        </div>
      )}

      {offers.length === 0 ? (
        <div className="py-14 text-center" role="status">
          <p className="text-base font-bold text-[color:var(--on-page)]">{t("Aucune adresse ne correspond", "No matching places")}</p>
          <p className="mt-1 text-sm text-[color:var(--on-page-muted)]">{t("Essayez un autre mot.", "Try another word.")}</p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-x-5 gap-y-9 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
          {offers.map((o) => (
            <li key={o.id}>
              <OfferCard offer={o} showPrice={showPrices} pickBadge={pickBadge} onPick={(card) => onOpen(o, current, card)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
