"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Table, Tag, Td, Th, Tr } from "@/components/app/ui";
import { RatingStars } from "@/components/shared/mini-charts";
import { useIntlLocale, useLocale, useT } from "@/lib/i18n/client";
import { fmtGuestDate, sourceLabel, type GuestProfile } from "@/lib/venue/guests";
import { SegmentBadges } from "./segment-badges";

/* Liste des clients. Toute la ligne ouvre la fiche à la souris ; au
   clavier, le nom est un vrai lien. Sous 768 px, chaque ligne se replie
   en carte. */
export function GuestsTable({ guests }: { guests: GuestProfile[] }) {
  const t = useT();
  const locale = useLocale();
  const intl = useIntlLocale();
  const router = useRouter();
  const mad = (n: number) => `${Math.round(n).toLocaleString(intl)} MAD`;

  return (
    <Table stack>
      <thead>
        <tr>
          <Th>{t("Client", "Guest")}</Th>
          <Th align="right">{t("Visites", "Visits")}</Th>
          <Th align="right">{t("Total dépensé", "Total spent")}</Th>
          <Th align="right">{t("Panier moyen", "Average spend")}</Th>
          <Th>{t("Dernière visite", "Last visit")}</Th>
          <Th>{t("Prochaine résa", "Next booking")}</Th>
          <Th>{t("Note", "Rating")}</Th>
          <Th>{t("Canaux", "Channels")}</Th>
          <Th>{t("Segment", "Segment")}</Th>
        </tr>
      </thead>
      <tbody>
        {guests.map((g) => {
          const href = `/dashboard/guests/${encodeURIComponent(g.id)}`;
          return (
            <Tr key={g.id} onClick={() => router.push(href)}>
              <Td head>
                <Link
                  href={href}
                  onClick={(e) => e.stopPropagation()}
                  className="block rounded-md font-bold text-ink hover:text-link"
                >
                  {g.name}
                </Link>
                <span className="num block text-xs text-ink-3">{g.phone}</span>
              </Td>
              <Td label={t("Visites", "Visits")} align="right" className="num">
                {g.visits}
              </Td>
              <Td
                label={t("Total dépensé", "Total spent")}
                align="right"
                className="num whitespace-nowrap"
              >
                {g.totalSpent > 0 ? mad(g.totalSpent) : "—"}
              </Td>
              <Td
                label={t("Panier moyen", "Average spend")}
                align="right"
                muted
                className="num whitespace-nowrap"
              >
                {g.avgBasket !== null ? mad(g.avgBasket) : "—"}
              </Td>
              <Td label={t("Dernière visite", "Last visit")} muted className="whitespace-nowrap">
                {g.lastVisit ? fmtGuestDate(g.lastVisit, locale) : "—"}
              </Td>
              <Td label={t("Prochaine résa", "Next booking")} muted className="whitespace-nowrap">
                {g.nextReservation
                  ? fmtGuestDate(g.nextReservation.reservation_date, locale)
                  : "—"}
              </Td>
              <Td label={t("Note", "Rating")} className="whitespace-nowrap">
                {g.avgRating !== null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <RatingStars value={g.avgRating} size={12} />
                    <span className="num text-xs text-ink-2">
                      {g.avgRating.toLocaleString(intl, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </span>
                  </span>
                ) : (
                  <span className="text-ink-3">—</span>
                )}
              </Td>
              <Td label={t("Canaux", "Channels")}>
                <span className="flex flex-wrap gap-1">
                  {g.sources.map((s) => (
                    <Tag key={s} className="whitespace-nowrap">
                      {sourceLabel(s, t)}
                    </Tag>
                  ))}
                </span>
              </Td>
              <Td label={t("Segment", "Segment")}>
                <SegmentBadges segments={g.segments} />
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
