import type { VenueQrReservation } from "@/hooks/use-venue-qr-reservations";
import { intlLocale, makeT, type Locale, type Translate } from "@/lib/i18n";

/* Regroupements et export des commissions de l'établissement. Rien ici ne
   calcule une commission : les montants viennent de la base. */

export type Settlement = {
  period: string;
  hotel_id: string;
  amount: number;
  settled_at: string;
  note: string;
};

export const periodOf = (r: VenueQrReservation) => r.reservation_date.slice(0, 7);

export const fmtDate = (iso: string, locale: Locale = "fr") =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "short",
  });

export type HotelGroup = {
  key: string;
  hotelId: string | null;
  name: string;
  rows: VenueQrReservation[];
  spent: number;
  commission: number;
};

export type MonthGroup = {
  period: string;
  rows: VenueQrReservation[];
  commission: number;
  hotels: HotelGroup[];
};

export function groupByHotel(rows: VenueQrReservation[], t: Translate): HotelGroup[] {
  const map = new Map<string, HotelGroup>();
  for (const r of rows) {
    const key = r.referrer_id ?? "inconnu";
    const g = map.get(key) ?? {
      key,
      hotelId: r.referrer_id,
      name: r.referrer_name ?? t("Hôtel partenaire", "Partner hotel"),
      rows: [],
      spent: 0,
      commission: 0,
    };
    g.rows.push(r);
    g.spent += r.amount_spent ?? 0;
    g.commission += r.commission;
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => b.commission - a.commission);
}

export function exportCsv(rows: VenueQrReservation[], locale: Locale = "fr") {
  const t = makeT(locale);
  const header = [
    t("Mois", "Month"),
    t("Date sortie", "Outing date"),
    t("Client", "Guest"),
    t("Hôtel d'origine", "Referring hotel"),
    t("Prestation", "Service"),
    t("Montant dépensé (MAD)", "Amount spent (MAD)"),
    t("Taux", "Rate"),
    t("Commission reversée (MAD)", "Commission paid (MAD)"),
    t("Origine du montant", "Amount source"),
  ];
  const lines = rows.map((r) =>
    [
      periodOf(r),
      r.reservation_date,
      r.guest_name,
      r.referrer_name ?? "",
      r.service_name ?? "",
      r.amount_spent ?? "",
      `${Math.round(r.commission_rate * 100)}%`,
      r.commission,
      r.amount_source === "pos" ? t("caisse", "POS") : t("saisie manuelle", "manual entry"),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(";")
  );
  const blob = new Blob(["﻿" + [header.join(";"), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `commissions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

