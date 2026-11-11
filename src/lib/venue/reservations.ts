import { isDue } from "@/lib/commissions";
import type { VenueQrReservation } from "@/hooks/use-venue-qr-reservations";

/* Règles de lecture d'une réservation côté établissement, partagées par
   l'accueil « Aujourd'hui », la liste des réservations et les commissions.
   Les statuts sont ceux de la base, en français : ils ne sont jamais
   traduits avant d'être comparés ou envoyés. */

export type Reservation = VenueQrReservation;
export type ReservationStatus = Reservation["status"];

/** Date du jour en heure locale, au format de la base (AAAA-MM-JJ). */
export function todayIso(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Mois courant (AAAA-MM), en heure locale. */
export function currentPeriod(d = new Date()) {
  return todayIso(d).slice(0, 7);
}

/** Annulée ou no-show : ne compte ni dans le chiffre ni dans les commissions. */
export const isOut = (r: Pick<Reservation, "status">) =>
  r.status === "annulée" || r.status === "no-show";

export const isPending = (r: Pick<Reservation, "status">) => r.status === "en attente";

/** Le client est venu (ou devait venir) et l'addition n'est pas saisie. */
export const needsBill = (r: Reservation, today = todayIso()) =>
  r.status === "confirmée" && r.amount_spent === null && r.reservation_date <= today;

/** Confirmée pour aujourd'hui, client pas encore marqué arrivé. */
export const awaitsArrival = (r: Reservation, today = todayIso()) =>
  r.status === "confirmée" && r.reservation_date === today && r.arrived_at === null;

/** Demande une action de l'établissement. */
export const needsAction = (r: Reservation, today = todayIso()) =>
  isPending(r) || needsBill(r, today);

/** Montant saisi par la caisse : verrouillé en base (trigger qr_lock_pos_amount). */
export const billLocked = (r: Pick<Reservation, "amount_source">) => r.amount_source === "pos";

/** Ordre d'un service : date, puis heure (les sans-heure en dernier). */
export function byDateTime(a: Reservation, b: Reservation) {
  return (
    a.reservation_date.localeCompare(b.reservation_date) ||
    (a.reservation_time ?? "99:99").localeCompare(b.reservation_time ?? "99:99")
  );
}

export type ReservationView = "a-traiter" | "aujourdhui" | "a-venir" | "passees" | "toutes";
export const RESERVATION_VIEWS: ReservationView[] = [
  "a-traiter",
  "aujourdhui",
  "a-venir",
  "passees",
  "toutes",
];

export function inView(r: Reservation, view: ReservationView, today = todayIso()) {
  switch (view) {
    case "a-traiter":
      return needsAction(r, today);
    case "aujourdhui":
      return r.reservation_date === today;
    case "a-venir":
      return r.reservation_date > today;
    case "passees":
      return r.reservation_date < today;
    default:
      return true;
  }
}

const digits = (s: string) => s.replace(/[\s.()+-]/g, "");

export function matchesQuery(r: Reservation, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (r.guest_name.toLowerCase().includes(q)) return true;
  const d = digits(q);
  return d.length > 0 && digits(r.guest_phone).includes(d);
}

/** Commissions dues sur une période (AAAA-MM) : clients d'hôtel venus, addition saisie. */
export function commissionsOf(rows: Reservation[], period = currentPeriod()) {
  return rows
    .filter((r) => isDue(r) && r.reservation_date.startsWith(period))
    .reduce((sum, r) => sum + r.commission, 0);
}

/** Lit un montant saisi au clavier (« 1 250,50 »). null si invalide. */
export function parseAmount(raw: string): number | null {
  const s = raw.replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
