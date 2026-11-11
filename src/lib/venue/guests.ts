import type { VenueQrReservation } from "@/hooks/use-venue-qr-reservations";
import { intlLocale, type Locale, type Translate } from "@/lib/i18n";

/* Clients de l'établissement, dérivés des réservations : pas de table
   clients à part, un client = un numéro de téléphone vu dans
   qr_reservations (la RLS limite déjà aux réservations de l'établissement
   connecté). Une seule définition des règles pour la liste et la fiche. */

/** Clé d'identité d'un client : téléphone sans espaces, points ni tirets,
    le + initial conservé. */
export function normalizePhone(raw: string) {
  return raw.replace(/[\s.\-]/g, "");
}

export function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* Valeurs de base, en français : jamais traduites avant comparaison. */
export const isCancelled = (r: VenueQrReservation) =>
  r.status === "annulée" || r.status === "no-show";

/** Une visite : réservation non annulée déjà passée, ou dont le montant
    dépensé est connu (le client est bien venu). */
export const isVisit = (r: VenueQrReservation, today: string) =>
  !isCancelled(r) && (r.reservation_date < today || r.amount_spent !== null);

export const isUpcoming = (r: VenueQrReservation, today: string) =>
  !isCancelled(r) && r.reservation_date >= today && r.amount_spent === null;

/* Les clés de segment restent en français ; seul le libellé suit la langue. */
export const SEGMENTS = ["VIP", "Habitué", "Nouveau", "À risque"] as const;
export type Segment = (typeof SEGMENTS)[number];

export function segmentLabel(s: string, t: Translate) {
  if (s === "Habitué") return t("Habitué", "Regular");
  if (s === "Nouveau") return t("Nouveau", "New");
  if (s === "À risque") return t("À risque", "At risk");
  return s;
}

export function sourceLabel(source: string, t: Translate) {
  if (source === "qr") return t("Réseau QR", "QR network");
  if (source === "portal") return t("Portail", "Portal");
  if (source === "venue") return t("Sur place", "In-house");
  return source;
}

export type GuestProfile = {
  /** Téléphone normalisé : sert aussi d'identifiant de route. */
  id: string;
  name: string;
  phone: string;
  visits: number;
  totalSpent: number;
  avgBasket: number | null;
  lastVisit: string | null;
  nextReservation: VenueQrReservation | null;
  avgRating: number | null;
  sources: string[];
  firstSeen: string;
  segments: Segment[];
};

const DAY_MS = 86_400_000;

export function buildGuests(reservations: VenueQrReservation[]): GuestProfile[] {
  const today = localToday();
  const byPhone = new Map<string, VenueQrReservation[]>();
  for (const r of reservations) {
    const key = normalizePhone(r.guest_phone ?? "");
    if (!key) continue;
    const list = byPhone.get(key);
    if (list) list.push(r);
    else byPhone.set(key, [r]);
  }

  const guests: GuestProfile[] = [];
  for (const [phone, rows] of byPhone) {
    const latest = rows.reduce((a, b) => (a.created_at >= b.created_at ? a : b));
    const visits = rows.filter((r) => isVisit(r, today));
    const spentRows = rows.filter((r) => !isCancelled(r) && r.amount_spent !== null);
    const totalSpent = spentRows.reduce((s, r) => s + (r.amount_spent ?? 0), 0);
    const rated = rows.filter((r) => r.rating !== null);
    const upcoming = rows
      .filter((r) => isUpcoming(r, today))
      .sort((a, b) => (a.reservation_date < b.reservation_date ? -1 : 1));
    const lastVisit =
      visits.length > 0
        ? visits.reduce(
            (m, r) => (r.reservation_date > m ? r.reservation_date : m),
            visits[0].reservation_date
          )
        : null;

    guests.push({
      id: phone,
      name: latest.guest_name,
      phone,
      visits: visits.length,
      totalSpent,
      avgBasket: spentRows.length > 0 ? totalSpent / spentRows.length : null,
      lastVisit,
      nextReservation: upcoming[0] ?? null,
      avgRating:
        rated.length > 0
          ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
          : null,
      sources: [...new Set(rows.map((r) => r.source as string))],
      firstSeen: rows.reduce((m, r) => (r.created_at < m ? r.created_at : m), rows[0].created_at),
      segments: [],
    });
  }

  /* Seuil VIP : le top 10 % des totaux dépensés (au moins un client dès
     qu'un montant existe) — calculé, pas décrété. */
  const totals = guests
    .map((g) => g.totalSpent)
    .filter((v) => v > 0)
    .sort((a, b) => b - a);
  const vipThreshold =
    totals.length > 0 ? totals[Math.max(0, Math.ceil(totals.length * 0.1) - 1)] : Infinity;

  const now = Date.now();
  for (const g of guests) {
    if (g.totalSpent > 0 && g.totalSpent >= vipThreshold) g.segments.push("VIP");
    if (g.visits >= 3) {
      g.segments.push("Habitué");
      if (g.lastVisit && now - new Date(g.lastVisit + "T00:00:00").getTime() >= 60 * DAY_MS)
        g.segments.push("À risque");
    } else if (g.visits === 1) {
      g.segments.push("Nouveau");
    }
  }
  return guests;
}

/** Segments d'un client, calculés sur l'ensemble des réservations de
    l'établissement (le seuil VIP est relatif au reste de la clientèle). */
export function computeSegments(all: VenueQrReservation[], phone: string): Segment[] {
  return buildGuests(all).find((g) => g.id === phone)?.segments ?? [];
}

export const fmtGuestDate = (iso: string, locale: Locale = "fr") =>
  new Date(iso + "T00:00:00").toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const fmtGuestTime = (time: string | null, locale: Locale = "fr") =>
  time ? (locale === "en" ? time.slice(0, 5) : time.slice(0, 5).replace(":", "h")) : "—";
