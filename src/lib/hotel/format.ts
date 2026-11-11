/* Formats et dates de l'espace hôtel. Toutes les comparaisons de dates se
   font sur la valeur ISO stockée (yyyy-mm-dd), jamais sur une chaîne
   affichée ; le fuseau est celui du navigateur de l'hôtelier.
   Les fonctions d'affichage prennent la langue en dernier paramètre
   (français par défaut) : passer `useLocale()` depuis les composants. */

import { intlLocale, type Locale } from "@/lib/i18n";

export function parseIsoDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isoDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function todayIso() {
  return isoDay(new Date());
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/* Fenêtre glissante : « 30 derniers jours » inclut aujourd'hui. */
export function isWithinDays(iso: string, days: number, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const from = addDays(today, -days);
  const d = parseIsoDate(iso);
  return d > from && d <= today;
}

export function sameMonth(iso: string, now = new Date()) {
  const d = parseIsoDate(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function monthLabel(key: string, long = false, locale: Locale = "fr") {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(intlLocale(locale), {
    month: long ? "long" : "short",
    year: "numeric",
  });
}

export function formatDate(
  iso: string,
  style: "short" | "medium" | "long" | "weekday" = "medium",
  locale: Locale = "fr"
) {
  const d = parseIsoDate(iso);
  const L = intlLocale(locale);
  switch (style) {
    case "short":
      return d.toLocaleDateString(L, { day: "2-digit", month: "2-digit" });
    case "long":
      return d.toLocaleDateString(L, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "weekday":
      return d.toLocaleDateString(L, {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    default:
      return d.toLocaleDateString(L, { day: "numeric", month: "short" });
  }
}

/* « Aujourd'hui », « Demain », « Hier », sinon la date courte. */
export function relativeDay(iso: string, now = new Date(), locale: Locale = "fr") {
  const en = locale === "en";
  const today = isoDay(now);
  if (iso === today) return en ? "Today" : "Aujourd'hui";
  if (iso === isoDay(addDays(now, 1))) return en ? "Tomorrow" : "Demain";
  if (iso === isoDay(addDays(now, -1))) return en ? "Yesterday" : "Hier";
  return formatDate(iso, "weekday", locale);
}

export function formatTimestamp(ts: string, locale: Locale = "fr") {
  const d = new Date(ts);
  return d.toLocaleString(intlLocale(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ts: string, now = new Date(), locale: Locale = "fr") {
  const en = locale === "en";
  const diff = Math.max(0, now.getTime() - new Date(ts).getTime());
  const min = Math.round(diff / 60000);
  if (min < 1) return en ? "just now" : "à l'instant";
  if (min < 60) return en ? `${min} min ago` : `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return en ? `${h} h ago` : `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return en ? `${d} d ago` : `il y a ${d} j`;
  return formatTimestamp(ts, locale);
}

export function formatMad(amount: number, compact = false, locale: Locale = "fr") {
  const L = intlLocale(locale);
  if (compact && Math.abs(amount) >= 10000) {
    return `${(amount / 1000).toLocaleString(L, { maximumFractionDigits: 1 })} k MAD`;
  }
  return `${Math.round(amount).toLocaleString(L)} MAD`;
}

export function formatNumber(n: number, locale: Locale = "fr") {
  return n.toLocaleString(intlLocale(locale));
}

export function formatPercent(ratio: number, digits = 0, locale: Locale = "fr") {
  const v = (ratio * 100).toLocaleString(intlLocale(locale), {
    maximumFractionDigits: digits,
  });
  return locale === "en" ? `${v}%` : `${v} %`;
}

/* Taux de commission tel qu'il est stocké (0,1 → « 10 % », 0,125 → « 12,5 % »). */
export function formatRate(rate: number, locale: Locale = "fr") {
  return formatPercent(rate, 1, locale);
}

/* « 10 % » si toutes les réservations portent le même taux, « 10 à 15 % »
   sinon. Les bornes viennent des données (commission_rate), jamais d'une
   valeur supposée. */
export function formatRateRange(rates: { min: number; max: number }, locale: Locale = "fr") {
  if (rates.min === rates.max) return formatRate(rates.min, locale);
  const lo = (rates.min * 100).toLocaleString(intlLocale(locale), { maximumFractionDigits: 1 });
  return locale === "en" ? `${lo} to ${formatRate(rates.max, locale)}` : `${lo} à ${formatRate(rates.max, locale)}`;
}

/* Français : 0 et 1 au singulier. Anglais : seul 1 est au singulier. */
export function plural(n: number, singular: string, pluralForm?: string, locale: Locale = "fr") {
  return (locale === "en" ? n !== 1 : n > 1) ? (pluralForm ?? `${singular}s`) : singular;
}

/* Un QR posé dans une chambre, une suite ou un riad — par opposition aux
   emplacements communs (lobby, spa, piscine, rooftop…). */
export function isRoomLabel(label: string) {
  return /^\s*(chambre|suite|riad|villa|bungalow|room|ch\.?)\b/i.test(label);
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* Numéro tel que saisi par le client → lien WhatsApp (chiffres seuls, indicatif
   marocain par défaut pour les numéros nationaux). */
export function whatsappLink(phone: string, text?: string) {
  let digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`;
  if (digits.startsWith("0") && digits.length === 10) digits = `+212${digits.slice(1)}`;
  digits = digits.replace(/\+/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

/* Contraste texte sur une couleur d'accent hexadécimale. */
export function isDarkHex(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}
