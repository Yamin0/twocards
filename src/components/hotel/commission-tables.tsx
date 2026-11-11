"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { Badge, Button, Table, Td, Th, Tr } from "@/components/app/ui";
import { reservationCategoryLabel } from "@/lib/hotel/analytics";
import { formatDate, formatMad, formatNumber, formatRate, monthLabel } from "@/lib/hotel/format";
import type { HotelReservation } from "@/lib/hotel/store";
import { useLocale, useT } from "@/lib/i18n/client";

export type MonthStatement = {
  key: string;
  rows: HotelReservation[];
  spent: number;
  commission: number;
  current: boolean;
};

/* Relevé mensuel : un mois par ligne, avec son export CSV. */
export function StatementTable({
  months,
  onExport,
}: {
  months: MonthStatement[];
  onExport: (m: MonthStatement) => void;
}) {
  const t = useT();
  const locale = useLocale();
  return (
    <Table stack>
      <thead>
        <tr>
          <Th>{t("Mois", "Month")}</Th>
          <Th>{t("Statut", "Status")}</Th>
          <Th align="right">{t("Sorties", "Outings")}</Th>
          <Th align="right">{t("Montant dépensé", "Amount spent")}</Th>
          <Th align="right">{t("Commissions", "Commissions")}</Th>
          <Th align="right">
            <span className="sr-only">{t("Export", "Export")}</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {months.map((m) => (
          <Tr key={m.key}>
            <Td head className="font-bold first-letter:uppercase">
              {monthLabel(m.key, true, locale)}
            </Td>
            <Td label={t("Statut", "Status")}>
              <Badge tone={m.current ? "info" : "ok"}>
                {m.current ? t("En cours", "In progress") : t("Clôturé", "Closed")}
              </Badge>
            </Td>
            <Td label={t("Sorties", "Outings")} align="right" className="num" muted>
              {formatNumber(m.rows.length, locale)}
            </Td>
            <Td label={t("Montant dépensé", "Amount spent")} align="right" className="num whitespace-nowrap" muted>
              {formatMad(m.spent, false, locale)}
            </Td>
            <Td label={t("Commissions", "Commissions")} align="right" className="num whitespace-nowrap font-bold">
              {formatMad(m.commission, false, locale)}
            </Td>
            <Td actions align="right">
              <Button
                size="sm"
                icon={Download}
                onClick={() => onExport(m)}
                aria-label={t(
                  `Exporter ${monthLabel(m.key, true, "fr")} en CSV`,
                  `Export ${monthLabel(m.key, true, "en")} as CSV`
                )}
              >
                CSV
              </Button>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

/* Détail : une ligne par sortie commissionnée, avec le taux porté par la
   réservation (commission_rate). */
export function CommissionDetailTable({ rows }: { rows: HotelReservation[] }) {
  const t = useT();
  const locale = useLocale();
  return (
    <Table stack>
      <thead>
        <tr>
          <Th>{t("Client", "Guest")}</Th>
          <Th>{t("Date", "Date")}</Th>
          <Th>{t("Sortie", "Outing")}</Th>
          <Th>{t("Emplacement", "Location")}</Th>
          <Th align="right">{t("Montant", "Amount")}</Th>
          <Th align="right">{t("Taux", "Rate")}</Th>
          <Th align="right">{t("Commission", "Commission")}</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Tr key={r.id}>
            <Td head>
              <Link href={`/hotel/reservations?id=${r.id}`} className="font-bold text-ink hover:underline">
                {r.guest_name}
              </Link>
            </Td>
            <Td label={t("Date", "Date")} muted className="num whitespace-nowrap">
              {formatDate(r.reservation_date, "medium", locale)}
            </Td>
            <Td label={t("Sortie", "Outing")}>
              <div>
                <p className="font-bold">{r.venue_name}</p>
                <p className="text-xs text-ink-3">{reservationCategoryLabel(r.category, locale)}</p>
              </div>
            </Td>
            <Td label={t("Emplacement", "Location")} muted>
              {r.qr_label ?? "—"}
            </Td>
            <Td label={t("Montant", "Amount")} align="right" muted className="num whitespace-nowrap">
              <span>
                {formatMad(r.amount_spent ?? 0, false, locale)}
                {r.amount_source === "pos" && (
                  <Badge className="ml-1.5">{t("Caisse", "Till")}</Badge>
                )}
              </span>
            </Td>
            <Td label={t("Taux", "Rate")} align="right" muted className="num">
              {formatRate(r.commission_rate, locale)}
            </Td>
            <Td label={t("Commission", "Commission")} align="right" className="num whitespace-nowrap font-bold">
              {formatMad(r.commission, false, locale)}
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}
