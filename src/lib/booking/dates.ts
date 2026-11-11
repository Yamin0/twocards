/* Dates des parcours de réservation. Tout est calculé dans le fuseau de
   l'appareil du client ; les libellés viennent d'Intl, jamais d'une liste
   écrite à la main. */

/** `2026-11-11` pour la date locale donnée. */
export const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Date locale à minuit pour un jour ISO. */
export const fromIsoDay = (iso: string) => new Date(`${iso}T00:00:00`);

export function addDays(d: Date, n: number) {
  const out = new Date(d);
  out.setDate(d.getDate() + n);
  return out;
}

/** Les `n` prochains jours, aujourd'hui compris. */
export function nextDays(n: number, from: Date = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => addDays(from, i));
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(intl: string, options: Intl.DateTimeFormatOptions) {
  const key = intl + JSON.stringify(options);
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(intl, options);
    formatters.set(key, f);
  }
  return f;
}

/** Les trois lignes d'une pastille de jour : « mar. », « 11 », « nov. ». */
export function dayChip(d: Date, intl: string) {
  return {
    weekday: formatter(intl, { weekday: "short" }).format(d),
    day: d.getDate(),
    month: formatter(intl, { month: "short" }).format(d),
  };
}

/** « mardi 11 novembre » / « Tuesday 11 November ». */
export const longDate = (d: Date, intl: string) =>
  formatter(intl, { weekday: "long", day: "numeric", month: "long" }).format(d);

/** « mar. 11 nov. » / « Tue 11 Nov ». */
export const shortDate = (d: Date, intl: string) =>
  formatter(intl, { weekday: "short", day: "numeric", month: "short" }).format(d);

/** « 11 novembre » / « 11 November ». */
export const dayMonth = (d: Date, intl: string) =>
  formatter(intl, { day: "numeric", month: "long" }).format(d);
