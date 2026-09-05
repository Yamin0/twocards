import type { HotelQrCode, HotelReservation } from "@/lib/hotel/store";
import { addDays, isoDay, isWithinDays, monthKey, parseIsoDate } from "@/lib/hotel/format";

/* Agrégats de l'espace hôtel, calculés côté navigateur à partir des
   réservations et des QR codes déjà en cache : aucune requête
   supplémentaire, et les chiffres suivent le temps réel. */

export const CATEGORIES = ["Restaurants", "Activités", "Clubs", "Services"] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Restaurants: "bg-sky-400",
  Activités: "bg-emerald-400",
  Clubs: "bg-violet-400",
  Services: "bg-amber-400",
};

export const isLive = (r: HotelReservation) =>
  r.status !== "annulée" && r.status !== "no-show";

export const hasCommission = (r: HotelReservation) =>
  r.amount_spent !== null && isLive(r);

export type Series = { key: string; label: string; value: number }[];

/* n dernières semaines, du lundi au dimanche, à partir de dates ISO. */
export function weeklySeries(dates: string[], weeks = 8, now = new Date()): Series {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const shift = (today.getDay() + 6) % 7;
  const thisMonday = addDays(today, -shift);
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisMonday, -7 * (weeks - 1 - i));
    const end = addDays(start, 7);
    return {
      key: isoDay(start),
      label: `${start.getDate()}/${start.getMonth() + 1}`,
      start: start.getTime(),
      end: end.getTime(),
      value: 0,
    };
  });
  for (const d of dates) {
    const t = parseIsoDate(d).getTime();
    const b = buckets.find((x) => t >= x.start && t < x.end);
    if (b) b.value += 1;
  }
  return buckets.map(({ key, label, value }) => ({ key, label, value }));
}

/* n derniers jours, aujourd'hui compris. */
export function dailySeries(dates: string[], days = 14, now = new Date()): Series {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = addDays(today, -(days - 1 - i));
    return { key: isoDay(d), label: String(d.getDate()), value: 0 };
  });
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const d of dates) {
    const b = byKey.get(d.slice(0, 10));
    if (b) b.value += 1;
  }
  return buckets;
}

/* n derniers mois, somme d'une valeur par réservation (montant, commission…). */
export function monthlySeries(
  rows: HotelReservation[],
  months = 6,
  value: (r: HotelReservation) => number = () => 1,
  now = new Date()
): Series {
  const buckets: { key: string; label: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      key,
      label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      value: 0,
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const r of rows) {
    const b = byKey.get(monthKey(r.reservation_date));
    if (b) b.value += value(r);
  }
  return buckets;
}

export function countBy<T>(rows: T[], key: (r: T) => string) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(key(r), (map.get(key(r)) ?? 0) + 1);
  return map;
}

export function sumBy<T>(rows: T[], key: (r: T) => string, value: (r: T) => number) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(key(r), (map.get(key(r)) ?? 0) + value(r));
  return map;
}

export function topN(map: Map<string, number>, n = 5) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, value]) => ({ label, value }));
}

export function averageRating(rows: HotelReservation[]) {
  const rated = rows.filter((r) => r.rating !== null);
  if (rated.length === 0) return { average: null, count: 0 };
  return {
    average: rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length,
    count: rated.length,
  };
}

export function conversionRate(scans: number, reservations: number) {
  return scans > 0 ? reservations / scans : 0;
}

/* Comparaison d'une fenêtre glissante avec la fenêtre précédente. */
export function windowDelta(
  rows: HotelReservation[],
  days: number,
  value: (r: HotelReservation) => number = () => 1,
  now = new Date()
) {
  const current = rows
    .filter((r) => isWithinDays(r.reservation_date, days, now))
    .reduce((s, r) => s + value(r), 0);
  const previousNow = addDays(now, -days);
  const previous = rows
    .filter((r) => isWithinDays(r.reservation_date, days, previousNow))
    .reduce((s, r) => s + value(r), 0);
  const ratio = previous > 0 ? (current - previous) / previous : null;
  return { current, previous, ratio };
}

/* ─── Clients : un profil par numéro de téléphone ──────────────────────────── */

export type GuestProfile = {
  key: string;
  name: string;
  phone: string;
  visits: number;
  liveVisits: number;
  firstVisit: string;
  lastVisit: string;
  nextVisit: string | null;
  totalSpent: number;
  totalCommission: number;
  averageParty: number;
  rating: number | null;
  ratingsCount: number;
  categories: string[];
  rooms: string[];
  favoriteVenue: string | null;
  reservations: HotelReservation[];
};

const phoneKey = (phone: string) => phone.replace(/[^\d]/g, "").replace(/^0+/, "");

export function guestsFromReservations(rows: HotelReservation[], now = new Date()): GuestProfile[] {
  const today = isoDay(now);
  const map = new Map<string, HotelReservation[]>();
  for (const r of rows) {
    const key = phoneKey(r.guest_phone) || r.guest_name.trim().toLowerCase();
    map.set(key, [...(map.get(key) ?? []), r]);
  }
  return [...map.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) =>
        a.reservation_date < b.reservation_date ? 1 : -1
      );
      const live = sorted.filter(isLive);
      const rated = sorted.filter((r) => r.rating !== null);
      const venues = topN(countBy(live, (r) => r.venue_name), 1);
      const upcoming = sorted
        .filter((r) => isLive(r) && r.reservation_date >= today)
        .sort((a, b) => (a.reservation_date < b.reservation_date ? -1 : 1));
      return {
        key,
        name: sorted[0].guest_name,
        phone: sorted[0].guest_phone,
        visits: sorted.length,
        liveVisits: live.length,
        firstVisit: sorted[sorted.length - 1].reservation_date,
        lastVisit: sorted[0].reservation_date,
        nextVisit: upcoming[0]?.reservation_date ?? null,
        totalSpent: live.reduce((s, r) => s + (r.amount_spent ?? 0), 0),
        totalCommission: live.reduce((s, r) => s + r.commission, 0),
        averageParty:
          sorted.length > 0
            ? sorted.reduce((s, r) => s + r.party_size, 0) / sorted.length
            : 0,
        rating:
          rated.length > 0
            ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
            : null,
        ratingsCount: rated.length,
        categories: [...new Set(sorted.map((r) => r.category))],
        rooms: [...new Set(sorted.map((r) => r.qr_label).filter((x): x is string => !!x))],
        favoriteVenue: venues[0]?.label ?? null,
        reservations: sorted,
      };
    })
    .sort((a, b) => (a.lastVisit < b.lastVisit ? 1 : -1));
}

/* ─── QR codes : performance par emplacement ───────────────────────────────── */

export type QrPerformance = HotelQrCode & {
  reservations: number;
  liveReservations: number;
  commission: number;
  conversion: number;
  lastReservation: string | null;
};

export function qrPerformance(
  codes: HotelQrCode[],
  rows: HotelReservation[]
): QrPerformance[] {
  const byQr = new Map<string, HotelReservation[]>();
  for (const r of rows) {
    if (!r.qr_code_id) continue;
    byQr.set(r.qr_code_id, [...(byQr.get(r.qr_code_id) ?? []), r]);
  }
  return codes.map((q) => {
    const list = byQr.get(q.id) ?? [];
    const live = list.filter(isLive);
    return {
      ...q,
      reservations: list.length,
      liveReservations: live.length,
      commission: live.reduce((s, r) => s + r.commission, 0),
      conversion: conversionRate(q.scans, live.length),
      lastReservation: list[0]?.created_at ?? null,
    };
  });
}

/* Répartition par jour de semaine (lundi en premier) et par tranche horaire. */
export function weekdayDistribution(rows: HotelReservation[]): Series {
  const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const out = labels.map((label, i) => ({ key: String(i), label, value: 0 }));
  for (const r of rows) {
    const d = parseIsoDate(r.reservation_date).getDay();
    out[(d + 6) % 7].value += 1;
  }
  return out;
}

export function hourDistribution(rows: HotelReservation[]): Series {
  const slots = [
    { key: "midi", label: "Midi", from: 11, to: 15 },
    { key: "aprem", label: "Après-midi", from: 15, to: 19 },
    { key: "soir", label: "Soirée", from: 19, to: 23 },
    { key: "nuit", label: "Nuit", from: 23, to: 30 },
    { key: "matin", label: "Matin", from: 5, to: 11 },
  ];
  const out = slots.map((s) => ({ key: s.key, label: s.label, value: 0 }));
  for (const r of rows) {
    if (!r.reservation_time) continue;
    let h = Number(r.reservation_time.split(":")[0]);
    if (Number.isNaN(h)) continue;
    if (h < 5) h += 24;
    const i = slots.findIndex((s) => h >= s.from && h < s.to);
    if (i >= 0) out[i].value += 1;
  }
  return out;
}
