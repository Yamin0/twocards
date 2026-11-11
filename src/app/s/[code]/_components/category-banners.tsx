"use client";

import { ArrowRight } from "lucide-react";
import { RemoteImage } from "@/components/booking/remote-image";
import type { GuestCategory, GuestCategoryKey } from "@/lib/guest-catalog";
import { useT } from "@/lib/i18n/client";

/* Bandeaux de catégories : la première vue du menu, une photo par
   catégorie. Sobres : pas d'ombre, un voile qui ne fonce que le bas de la
   photo, le nom en bas à gauche, le décompte en italique fin. */
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
      <div className="border-t border-[color:var(--rule)] px-1 py-12 text-center">
        <p className="text-base font-bold text-[color:var(--on-page)]">
          {t("Aucune adresse proposée pour le moment", "No places available yet")}
        </p>
        <p className="mt-1 text-sm text-[color:var(--on-page-muted)]">{emptyHint}</p>
      </div>
    );
  }
  return (
    <ul className="space-y-2 sm:space-y-3">
      {menu.map((c, i) => (
        <li key={c.key}>
          <button
            type="button"
            onClick={() => onPick(c.key)}
            className="group relative block h-40 w-full overflow-hidden rounded-md bg-neutral-300 text-left text-white sm:h-56 lg:h-64"
          >
            {/* Les deux premiers bandeaux sont visibles dès l'ouverture :
                préchargés, les suivants attendent le défilement. */}
            <RemoteImage
              src={c.image}
              fill
              preload={i < 2}
              sizes="(max-width: 1800px) 100vw, 1800px"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/5" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-4 sm:px-7 sm:pb-6 lg:px-9 lg:pb-7">
              <span>
                <span className="block text-[1.65rem] font-bold leading-none tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                  {c.label}
                </span>
                <span className="mt-2 block text-sm font-light italic text-white/85 sm:text-base">
                  {t(
                    `${c.offers.length} adresse${c.offers.length > 1 ? "s" : ""}`,
                    `${c.offers.length} place${c.offers.length === 1 ? "" : "s"}`
                  )}
                </span>
              </span>
              <ArrowRight
                size={22}
                strokeWidth={1.5}
                aria-hidden
                className="mb-1 shrink-0 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
              />
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
