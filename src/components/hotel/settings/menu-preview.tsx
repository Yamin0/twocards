"use client";

import { Card } from "@/components/app/ui";
import { categoryLabel } from "@/lib/guest-catalog";
import { isDarkHex } from "@/lib/hotel/format";
import type { MenuForm } from "@/lib/hotel/use-settings-form";
import { useLocale, useT } from "@/lib/i18n/client";

/* Aperçu du menu client. Il garde les couleurs de l'hôtel (accent, fond)
   et celles du menu public, pas celles du back-office : toutes les teintes
   sont donc posées en dur ici, à dessein. */
const INK = "#171717";
const MUTED = "#525252";

export function MenuPreview({
  menu,
  hotelName,
  city,
  samples,
}: {
  menu: MenuForm;
  hotelName: string;
  city: string;
  /* Adresses réelles du menu de l'hôtel ; vide : lignes neutres. */
  samples: { name: string; meta: string; price: string | null }[];
}) {
  const t = useT();
  const locale = useLocale();
  const darkAccent = isDarkHex(menu.accent);
  const darkPage = isDarkHex(menu.background);
  const onAccent = darkAccent ? "#ffffff" : "#0a0a0a";
  const onPage = darkPage ? "#ffffff" : INK;
  const rows =
    samples.length > 0
      ? samples
      : [
          { name: t("Nom de l'adresse", "Name of the place"), meta: t("Catégorie · Ville", "Category · City"), price: null },
          { name: t("Nom de l'adresse", "Name of the place"), meta: t("Catégorie · Ville", "Category · City"), price: null },
        ];
  const chips = [
    t("Tout", "All"),
    categoryLabel("restaurants", locale),
    categoryLabel("activites", locale),
    categoryLabel("clubs", locale),
  ];

  return (
    <Card
      title={t("Aperçu", "Preview")}
      description={t(
        "Rendu simplifié sur téléphone, mis à jour en direct.",
        "Simplified phone rendering, updated live."
      )}
    >
      <div
        aria-hidden
        className="satoshi mx-auto w-full max-w-[300px] overflow-hidden rounded-[1.75rem] border-[5px] border-neutral-900 shadow-pop"
        style={{ background: menu.background }}
      >
        <div className="px-4 pb-3 pt-5" style={{ color: onPage }}>
          <p className="text-xs font-bold" style={{ color: darkAccent !== darkPage ? menu.accent : "inherit" }}>
            {t("Chambre 129", "Room 129")}
          </p>
          <p className="mt-1 text-xl font-black leading-[0.95] tracking-[-0.03em]">
            {hotelName || t("Votre hôtel", "Your hotel")}
          </p>
          <p className="mt-1.5 line-clamp-3 text-xs font-light leading-snug opacity-80">
            {menu.welcome ||
              t(
                "Réservez vos plus belles sorties en quelques secondes — notre conciergerie s'occupe du reste.",
                "Book the best outings in seconds — our concierge desk takes care of the rest."
              )}
          </p>
          <p
            className="mt-2.5 border-t pt-1.5 text-xs font-bold opacity-70"
            style={{ borderColor: darkPage ? "rgba(255,255,255,0.16)" : "rgba(23,23,23,0.16)" }}
          >
            {city ? `${city} — ` : ""}
            {t("Sélection de l'hôtel", "Hotel's selection")}
          </p>
        </div>
        <div style={{ background: "#ffffff" }}>
          <div className="flex gap-1.5 overflow-hidden px-3 py-2.5">
            {chips.map((c, i) => (
              <span
                key={c}
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                style={i === 0 ? { background: menu.accent, color: onAccent } : { background: "#f1f0ec", color: "#333333" }}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="space-y-2 px-3 pb-3">
            {rows.map((o, i) => (
              <div
                key={i}
                className="flex items-stretch gap-2.5 rounded-xl border p-2"
                style={{ borderColor: "rgba(0,0,0,0.08)", background: "#ffffff" }}
              >
                <div className="w-12 shrink-0 rounded-lg" style={{ background: "#e5e5e5" }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold" style={{ color: INK }}>
                    {o.name}
                  </p>
                  <p className="truncate text-xs" style={{ color: MUTED }}>
                    {o.meta}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold" style={{ color: INK }}>
                      {menu.prices && o.price ? o.price : ""}
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: menu.accent, color: onAccent }}
                    >
                      {t("Réserver", "Book")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p
          className="py-2 text-center text-xs"
          style={{ color: darkPage ? "rgba(255,255,255,0.7)" : MUTED }}
        >
          {t("Propulsé par twocards.", "Powered by twocards.")}
        </p>
      </div>
      <p className="mt-3 text-center text-xs leading-relaxed text-ink-3">
        {t(
          "Sur ordinateur, le menu s'affiche en pleine page, avec une colonne de navigation.",
          "On desktop, the menu shows full-page, with a navigation column."
        )}
      </p>
    </Card>
  );
}
