"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, MapPin, RotateCcw } from "lucide-react";
import { Badge, Button, Card, SearchInput, Switch } from "@/components/app/ui";
import { CATEGORY_ICONS } from "@/components/hotel/qr/qr-filters-card";
import type { QrDetail } from "@/lib/hotel/use-qr-detail";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

/* Menu proposé sur ce QR : chaque adresse du catalogue de la ville et des
   adresses maison se propose ou se retire, pour cet emplacement seulement. */
export function QrMenuCard({ d, className }: { d: QrDetail; className?: string }) {
  const t = useT();
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const { menuCatalog, hiddenSet, globalHidden, hotelCity } = d;
  const total = menuCatalog.reduce((s, c) => s + c.offers.length, 0);
  const shownTotal = menuCatalog.reduce((s, c) => s + c.offers.filter((o) => !hiddenSet.has(o.id)).length, 0);
  const link = "font-bold text-link underline";

  const blocks = menuCatalog
    .map((cat) => ({
      cat,
      offers: q
        ? cat.offers.filter((o) => o.name.toLowerCase().includes(q) || o.tag.toLowerCase().includes(q))
        : cat.offers,
    }))
    .filter((b) => !q || b.offers.length > 0);

  return (
    <Card
      title={t("Menu proposé sur ce QR", "Menu offered on this QR")}
      description={
        hotelCity
          ? t(
              <>
                Catalogue twocards de {hotelCity} et vos{" "}
                <Link href="/hotel/adresses" className={link}>
                  adresses maison
                </Link>{" "}
                · {shownTotal}/{total} proposées. Retirez ce que vous ne souhaitez pas suggérer à ce client.
              </>,
              <>
                The twocards catalogue for {hotelCity} and your{" "}
                <Link href="/hotel/adresses" className={link}>
                  own places
                </Link>{" "}
                · {shownTotal}/{total} offered. Remove anything you don&apos;t want to suggest to this guest.
              </>
            )
          : t(
              <>
                Indiquez la ville de l&apos;hôtel dans les{" "}
                <Link href="/hotel/settings" className={link}>
                  paramètres
                </Link>{" "}
                pour limiter le catalogue à votre ville. En attendant, tout est proposé.
              </>,
              <>
                Add the hotel&apos;s city in{" "}
                <Link href="/hotel/settings" className={link}>
                  settings
                </Link>{" "}
                to limit the catalogue to your city. Until then, everything is offered.
              </>
            )
      }
      actions={
        <>
          {d.menuDirty && (
            <Button size="sm" variant="ghost" icon={RotateCcw} onClick={d.resetMenu}>
              {t("Annuler", "Cancel")}
            </Button>
          )}
          <Button
            size="sm"
            variant={d.menuDirty ? "primary" : "secondary"}
            icon={Check}
            onClick={d.saveMenu}
            loading={d.savingMenu}
            disabled={!d.menuDirty}
          >
            {t("Enregistrer le menu", "Save menu")}
          </Button>
        </>
      }
      className={className}
    >
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t("Rechercher une adresse…", "Search for a place…")}
        className="mb-4"
      />
      {blocks.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-3">
          {total === 0
            ? t("Aucune adresse au catalogue pour le moment.", "No places in the catalogue yet.")
            : t("Aucune adresse ne correspond.", "No places match.")}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {blocks.map(({ cat, offers }) => {
            const Icon = CATEGORY_ICONS[cat.key];
            const ids = cat.offers.map((o) => o.id).filter((oid) => !globalHidden.has(oid));
            const shown = ids.filter((oid) => !hiddenSet.has(oid)).length;
            const all = shown === ids.length;
            return (
              <section key={cat.key} className="rounded-xl border border-line">
                <div className="flex items-center justify-between gap-2 rounded-t-xl border-b border-line bg-fill px-3.5 py-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Icon size={16} strokeWidth={1.75} className="shrink-0 text-ink-2" aria-hidden />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-ink">{cat.label}</h3>
                      <p className="num text-xs text-ink-3">
                        {shown}/{ids.length} {t(`proposée${shown > 1 ? "s" : ""}`, "offered")}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" disabled={ids.length === 0} onClick={() => d.setOffers(ids, !all)}>
                    {all ? t("Tout retirer", "Remove all") : t("Tout proposer", "Offer all")}
                  </Button>
                </div>
                <ul className="divide-y divide-line">
                  {offers.map((o) => {
                    const global = globalHidden.has(o.id);
                    const on = !global && !hiddenSet.has(o.id);
                    return (
                      <li key={o.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5">
                            <span className={cn("truncate text-sm font-bold", on ? "text-ink" : "text-ink-3 line-through")}>
                              {o.name}
                            </span>
                            {o.source === "hotel" && <Badge tone="info">{t("Maison", "Own")}</Badge>}
                            {global && <Badge>{t("Retirée pour tout l'hôtel", "Removed hotel-wide")}</Badge>}
                          </p>
                          <p className="flex items-center gap-1 truncate text-xs text-ink-3">
                            {o.city && (
                              <>
                                <MapPin size={11} strokeWidth={1.75} aria-hidden /> {o.city} ·
                              </>
                            )}{" "}
                            {o.tag}
                            {o.price ? ` · ${o.price}` : ""}
                          </p>
                        </div>
                        <Switch
                          size="sm"
                          checked={on}
                          disabled={global}
                          onChange={() => d.toggleOffer(o.id)}
                          label={t(`Proposer ${o.name}`, `Offer ${o.name}`)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </Card>
  );
}
