import { downloadCsv } from "@/lib/csv";
import { makeT, type Locale } from "@/lib/i18n";
import { segmentLabel, sourceLabel, type GuestProfile } from "@/lib/venue/guests";

/* Export de la liste affichée (filtres et tri compris). Les intitulés et
   les libellés suivent la langue ; les dates restent au format ISO. */
export function exportGuestsCsv(guests: GuestProfile[], locale: Locale) {
  const t = makeT(locale);
  downloadCsv(
    `clients-${new Date().toISOString().slice(0, 10)}`,
    [
      t("Nom", "Name"),
      t("Téléphone", "Phone"),
      t("Visites", "Visits"),
      t("Total dépensé (MAD)", "Total spent (MAD)"),
      t("Panier moyen (MAD)", "Average spend (MAD)"),
      t("Dernière visite", "Last visit"),
      t("Prochaine réservation", "Next reservation"),
      t("Note moyenne", "Average rating"),
      t("Segments", "Segments"),
      t("Canaux", "Channels"),
    ],
    guests.map((g) => [
      g.name,
      g.phone,
      g.visits,
      g.totalSpent,
      g.avgBasket !== null ? Math.round(g.avgBasket) : "",
      g.lastVisit ?? "",
      g.nextReservation?.reservation_date ?? "",
      g.avgRating !== null ? g.avgRating.toFixed(1) : "",
      g.segments.map((s) => segmentLabel(s, t)).join(", "),
      g.sources.map((s) => sourceLabel(s, t)).join(", "),
    ])
  );
}
