import { downloadCsv } from "@/lib/csv";
import { statusLabel } from "@/components/app/ui";
import { reservationCategoryLabel, type GuestProfile } from "@/lib/hotel/analytics";
import { formatRate, todayIso } from "@/lib/hotel/format";
import type { HotelReservation } from "@/lib/hotel/store";
import type { Locale, Translate } from "@/lib/i18n";

/* Exports CSV de l'espace hôtel : réservations, clients, relevé de
   commissions. Les colonnes sont celles d'avant la refonte ; seule la
   fabrication du fichier est commune (src/lib/csv.ts). */

export function exportReservationsCsv(rows: HotelReservation[], t: Translate, locale: Locale) {
  downloadCsv(
    `${t("reservations", "reservations")}-${todayIso()}`,
    [
      t("Date", "Date"),
      t("Heure", "Time"),
      t("Client", "Guest"),
      t("Téléphone", "Phone"),
      t("Sortie", "Outing"),
      t("Catégorie", "Category"),
      t("Chambre", "Room"),
      t("Personnes", "Guests"),
      t("Statut", "Status"),
      t("Montant (MAD)", "Amount (MAD)"),
      t("Commission (MAD)", "Commission (MAD)"),
      t("Note", "Rating"),
      t("Reçue le", "Received on"),
    ],
    rows.map((r) => [
      r.reservation_date,
      r.reservation_time,
      r.guest_name,
      r.guest_phone,
      r.venue_name,
      reservationCategoryLabel(r.category, locale),
      r.qr_label,
      r.party_size,
      statusLabel(r.status, locale),
      r.amount_spent,
      r.commission,
      r.rating,
      r.created_at.slice(0, 16).replace("T", " "),
    ])
  );
}

export function exportGuestsCsv(guests: GuestProfile[], t: Translate) {
  downloadCsv(
    `${t("clients", "guests")}-${todayIso()}`,
    [
      t("Client", "Guest"),
      t("Téléphone", "Phone"),
      t("Sorties", "Outings"),
      t("Première", "First"),
      t("Dernière", "Last"),
      t("Prochaine", "Next"),
      t("Dépensé (MAD)", "Spent (MAD)"),
      t("Commissions (MAD)", "Commissions (MAD)"),
      t("Note", "Rating"),
      t("Adresse préférée", "Favourite place"),
      t("Emplacements", "Locations"),
    ],
    guests.map((g) => [
      g.name,
      g.phone,
      g.visits,
      g.firstVisit,
      g.lastVisit,
      g.nextVisit,
      Math.round(g.totalSpent),
      Math.round(g.totalCommission),
      g.rating?.toFixed(1),
      g.favoriteVenue,
      g.rooms.join(" / "),
    ])
  );
}

/* Relevé de commissions : une ligne par sortie, avec le taux porté par la
   réservation, puis une ligne de total. */
export function exportCommissionsCsv(rows: HotelReservation[], suffix: string, t: Translate, locale: Locale) {
  const total = rows.reduce((s, r) => s + r.commission, 0);
  downloadCsv(
    `commissions-${suffix}-${todayIso()}`,
    [
      t("Date sortie", "Outing date"),
      t("Client", "Guest"),
      t("Sortie", "Outing"),
      t("Catégorie", "Category"),
      t("Chambre", "Room"),
      t("Montant dépensé (MAD)", "Amount spent (MAD)"),
      t("Taux", "Rate"),
      t("Commission (MAD)", "Commission (MAD)"),
      t("Source du montant", "Amount source"),
    ],
    rows.map((r) => [
      r.reservation_date,
      r.guest_name,
      r.venue_name,
      reservationCategoryLabel(r.category, locale),
      r.qr_label,
      r.amount_spent,
      formatRate(r.commission_rate, "en"),
      r.commission,
      r.amount_source,
    ]),
    ["TOTAL", null, null, null, null, null, null, total, null]
  );
}
