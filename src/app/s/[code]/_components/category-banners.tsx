"use client";

import { RemoteImage } from "@/components/booking/remote-image";
import type { GuestCategory, GuestCategoryKey } from "@/lib/guest-catalog";
import { useT } from "@/lib/i18n/client";

/* Bandeaux de catégories : la première vue du menu. Presque bord à bord, ils
   portent les images de la page. */
export function CategoryBanners({
  menu,
  emptyHint,
  onPick,
}: {
  menu: GuestCategory[];
  /* Vers qui se tourner quand rien n'est proposé (réception, ou la personne
     qui a partagé le lien). */
  emptyHint: string;
  onPick: (key: GuestCategoryKey) => void;
}) {
  const t = useT();
  if (menu.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-12 text-center">
        <p className="text-base font-bold text-neutral-900">{t("Aucune adresse proposée pour le moment", "No places available yet")}</p>
        <p className="mt-1 text-sm text-neutral-600">{emptyHint}</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3 sm:space-y-4">
      {menu.map((c, i) => (
        <li key={c.key}>
          <button
            type="button"
            onClick={() => onPick(c.key)}
            className="group relative block h-40 w-full overflow-hidden rounded-2xl text-white shadow-[0_20px_50px_-30px_rgba(0,0,0,0.6)] transition-transform active:scale-[0.99] motion-reduce:transition-none sm:h-52 lg:h-64"
          >
            {/* Les deux premiers bandeaux sont visibles dès l'ouverture :
                préchargés, les suivants attendent le défilement. */}
            <RemoteImage
              src={c.image}
              fill
              preload={i < 2}
              sizes="(max-width: 1800px) 100vw, 1800px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <span className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/45" />
            <span className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <span className="font-display text-xl font-bold uppercase tracking-[0.35em] [text-shadow:0_2px_14px_rgba(0,0,0,0.6)] sm:text-2xl lg:text-3xl">
                {c.label}
              </span>
              <span className="num mt-2 text-xs font-medium uppercase tracking-[0.2em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
                {t(
                  `${c.offers.length} adresse${c.offers.length > 1 ? "s" : ""}`,
                  `${c.offers.length} place${c.offers.length === 1 ? "" : "s"}`
                )}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
