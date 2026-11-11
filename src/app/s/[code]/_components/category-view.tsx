"use client";

import { useId, useState } from "react";
import { ArrowLeft, Music, Palmtree, Search, Sparkles, UtensilsCrossed, type LucideIcon } from "lucide-react";
import { RemoteImage } from "@/components/booking/remote-image";
import type { GuestCategory, GuestCategoryKey, GuestOffer } from "@/lib/guest-catalog";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { OfferCard } from "./offer-card";

const CATEGORY_ICONS: Record<GuestCategoryKey, LucideIcon> = {
  restaurants: UtensilsCrossed,
  activites: Palmtree,
  clubs: Music,
  services: Sparkles,
};

function CategoryChip({
  active,
  onClick,
  label,
  count,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors",
        active ? "bg-[var(--accent)] text-[var(--on-accent)]" : "bg-white text-neutral-800 ring-1 ring-black/[0.08] hover:bg-neutral-50"
      )}
    >
      {Icon && <Icon size={15} strokeWidth={2} aria-hidden />}
      {label}
      <span className={cn("num text-xs font-bold", active ? "opacity-80" : "text-neutral-600")}>{count}</span>
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
  const Icon = CATEGORY_ICONS[current.key];
  const q = search.trim().toLowerCase();
  const offers = q
    ? current.offers.filter(
        (o) => o.name.toLowerCase().includes(q) || o.tag.toLowerCase().includes(q) || o.description.toLowerCase().includes(q)
      )
    : current.offers;
  const searchLabel = t(`Rechercher dans ${current.label.toLowerCase()}`, `Search ${current.label.toLowerCase()}`);

  return (
    <div>
      <div className="relative h-36 overflow-hidden rounded-2xl text-white sm:h-44 lg:h-52">
        <RemoteImage src={current.image} fill preload sizes="(max-width: 1152px) 100vw, 1152px" className="object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <button
          type="button"
          onClick={() => onPick("tous")}
          aria-label={t("Retour aux catégories", "Back to categories")}
          className="absolute left-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-neutral-900 shadow transition-colors hover:bg-white sm:left-4 sm:top-4"
        >
          <ArrowLeft size={19} strokeWidth={2.25} aria-hidden />
        </button>
        {/* Le calque du titre couvre tout le bandeau : il laisse passer les clics. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h2 className="font-display flex items-center gap-2 text-xl font-bold uppercase tracking-[0.35em] [text-shadow:0_2px_14px_rgba(0,0,0,0.6)] sm:text-2xl lg:text-3xl">
            <Icon size={18} strokeWidth={2} className="hidden sm:block" aria-hidden />
            {current.label}
          </h2>
          <p className="mt-2 text-xs font-medium text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] sm:text-sm">{current.tagline}</p>
        </div>
      </div>

      <nav
        aria-label={t("Catégories", "Categories")}
        className="no-scrollbar -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 py-1 sm:mx-0 sm:mt-4 sm:px-0"
      >
        <CategoryChip active={false} onClick={() => onPick("tous")} label={t("Tout", "All")} count={total} />
        {menu.map((c) => (
          <CategoryChip
            key={c.key}
            active={c.key === current.key}
            onClick={() => onPick(c.key)}
            label={c.label}
            count={c.offers.length}
            icon={CATEGORY_ICONS[c.key]}
          />
        ))}
      </nav>

      {current.offers.length > 4 && (
        <div className="relative mt-3">
          <label htmlFor={searchId} className="sr-only">
            {searchLabel}
          </label>
          <Search size={16} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
          <input
            id={searchId}
            type="search"
            enterKeyHint="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${searchLabel}…`}
            className="h-12 w-full rounded-xl border border-black/[0.12] bg-white pl-10 pr-4 text-base text-neutral-900 placeholder:text-neutral-500 focus:border-[var(--accent-on-white)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-on-white)]/25"
          />
        </div>
      )}

      {offers.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-black/15 bg-white px-6 py-12 text-center" role="status">
          <p className="text-base font-bold text-neutral-900">{t("Aucune adresse ne correspond", "No matching places")}</p>
          <p className="mt-1 text-sm text-neutral-600">{t("Essayez un autre mot.", "Try another word.")}</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
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
