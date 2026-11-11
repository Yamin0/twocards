"use client";

import { Check, Music, Palmtree, RotateCcw, Sparkles, UtensilsCrossed } from "lucide-react";
import { Button, Card, Field, Switch, inputClass } from "@/components/app/ui";
import { CATEGORY_KEYS, categoryLabel, type GuestCategoryKey } from "@/lib/guest-catalog";
import { formatDate } from "@/lib/hotel/format";
import type { HotelQrCode } from "@/lib/hotel/store";
import type { QrDetail } from "@/lib/hotel/use-qr-detail";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

export const CATEGORY_ICONS = {
  restaurants: UtensilsCrossed,
  activites: Palmtree,
  clubs: Music,
  services: Sparkles,
} as const;

/* Libellé d'une catégorie enregistrée (clé inconnue : affichée telle quelle). */
const catName = (k: string, locale: Locale) =>
  (CATEGORY_KEYS as string[]).includes(k) ? categoryLabel(k as GuestCategoryKey, locale) : k;

/* Filtres du menu : une catégorie entière retirée de ce QR, le temps d'un
   séjour ou sans limite. */
export function QrFiltersCard({ qr, d, className }: { qr: HotelQrCode; d: QrDetail; className?: string }) {
  const t = useT();
  const locale = useLocale();
  return (
    <Card
      title={t("Filtres du menu", "Menu filters")}
      description={t(
        "Retirez une catégorie entière de ce QR, le temps d'un séjour ou pour de bon. Pour une famille, un geste : plus de clubs.",
        "Remove a whole category from this QR, for one stay or for good. For a family, one tap: no more clubs."
      )}
      actions={
        <>
          {d.rulesDirty && (
            <Button size="sm" variant="ghost" icon={RotateCcw} onClick={d.resetRules}>
              {t("Annuler", "Cancel")}
            </Button>
          )}
          <Button
            size="sm"
            variant={d.rulesDirty ? "primary" : "secondary"}
            icon={Check}
            onClick={d.saveRules}
            loading={d.savingRules}
            disabled={!d.rulesDirty}
          >
            {t("Enregistrer", "Save")}
          </Button>
        </>
      }
      className={className}
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {CATEGORY_KEYS.map((key) => {
          const Icon = CATEGORY_ICONS[key];
          const off = d.catSet.has(key);
          const name = categoryLabel(key, locale);
          return (
            <li
              key={key}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-2.5",
                off ? "border-danger/25 bg-danger-soft" : "border-line bg-fill"
              )}
            >
              <Icon size={16} strokeWidth={1.75} className={off ? "text-danger" : "text-ink-2"} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm font-bold text-ink", off && "line-through")}>{name}</span>
                <span className={cn("block text-xs", off ? "text-danger" : "text-ink-3")}>
                  {off ? t("Retirée de ce QR", "Removed from this QR") : t("Proposée", "Offered")}
                </span>
              </span>
              <Switch
                size="sm"
                checked={!off}
                onChange={() => d.toggleCat(key)}
                label={t(`Proposer ${name}`, `Offer ${name}`)}
              />
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" icon={Music} disabled={d.catSet.has("clubs")} onClick={() => d.hideCat("clubs")}>
            {t("Famille : retirer les clubs", "Family: remove clubs")}
          </Button>
          {d.catSet.size > 0 && (
            <Button size="sm" variant="ghost" onClick={d.showAllCats}>
              {t("Tout proposer", "Offer all")}
            </Button>
          )}
        </div>
        <div className="flex items-end gap-2">
          <Field label={t("Jusqu'au", "Until")} htmlFor="qr-until" className="w-44">
            <input
              id="qr-until"
              type="date"
              value={d.until ?? ""}
              min={d.today}
              onChange={(e) => d.setUntil(e.target.value || null)}
              className={cn(inputClass, "h-11 py-0")}
            />
          </Field>
          <Button variant="ghost" disabled={!d.until} onClick={() => d.setUntil(null)}>
            {t("Sans limite", "No limit")}
          </Button>
        </div>
      </div>

      {qr.hidden_categories.length > 0 && (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
          {d.rulesExpired
            ? t(
                "L'échéance est passée : le menu de ce QR est de nouveau complet.",
                "The end date has passed: this QR's menu is complete again."
              )
            : t(
                `Actuellement retiré : ${qr.hidden_categories.map((k) => catName(k, "fr")).join(", ")}${qr.hidden_until ? ` · jusqu'au ${formatDate(qr.hidden_until, "long")}` : " · sans limite"}.`,
                `Currently removed: ${qr.hidden_categories.map((k) => catName(k, "en")).join(", ")}${qr.hidden_until ? ` · until ${formatDate(qr.hidden_until, "long", "en")}` : " · no limit"}.`
              )}
        </p>
      )}
    </Card>
  );
}
