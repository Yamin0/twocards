/* ─── Devise d'affichage du site public ──────────────────────────────────
   Trois devises : le dirham (Maroc), l'euro (Europe) et le dollar (reste du
   monde). Elle ne touche que les montants d'exemple des pages publiques
   (landing, pages métiers) : les espaces connectés affichent les vrais
   montants enregistrés, en dirhams.

   Ordre de décision, dans le proxy (src/proxy.ts) :
   1. `?currency=eur|mad|usd` dans l'URL : choix manuel, mémorisé un an ;
   2. le cookie `tc-currency` (posé par ce même lien) ;
   3. le pays du visiteur (en-tête Vercel `x-vercel-ip-country`) ;
   4. sans pays connu (en local) : le dirham, comme avant.

   Pour tester en local : `?country=DE` simule un visiteur d'Allemagne
   (mémorisé pour la session), `?country=auto` revient au vrai pays. */

export const CURRENCIES = ["MAD", "EUR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];
export const DEFAULT_CURRENCY: Currency = "MAD";

/** Choix manuel de la devise (`?currency=`), un an. */
export const CURRENCY_COOKIE = "tc-currency";
/** Pays simulé (`?country=XX`), le temps de la session du navigateur. */
export const COUNTRY_COOKIE = "tc-country";
/** En-tête posé par Vercel sur chaque requête : code pays ISO à 2 lettres. */
export const GEO_COUNTRY_HEADER = "x-vercel-ip-country";

export function isCurrency(v: unknown): v is Currency {
  return v === "MAD" || v === "EUR" || v === "USD";
}

/** "eur", "EUR " → "EUR" ; tout le reste → null. */
export function parseCurrency(v: string | null | undefined): Currency | null {
  const c = v?.trim().toUpperCase();
  return isCurrency(c) ? c : null;
}

/** Code pays ISO 3166-1 alpha-2 en majuscules, ou null. */
export function parseCountry(v: string | null | undefined): string | null {
  const c = v?.trim().toUpperCase();
  return c && /^[A-Z]{2}$/.test(c) ? c : null;
}

/* Europe géographique : Union européenne, EEE, Royaume-Uni, Suisse,
   micro-États, Balkans, Ukraine, Moldavie, et l'outre-mer français (en
   euros). La Russie, la Biélorussie et la Turquie restent en dollars. */
const EUROPE = new Set([
  // Union européenne
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
  // EEE, Royaume-Uni, Suisse, micro-États
  "IS", "LI", "NO", "GB", "CH", "MC", "SM", "VA", "AD", "GI", "IM", "JE",
  "GG", "FO", "AX",
  // Balkans et Europe de l'Est
  "AL", "BA", "ME", "MK", "RS", "XK", "MD", "UA",
  // Outre-mer français
  "GP", "MQ", "GF", "RE", "YT", "PM", "BL", "MF",
]);

/** Devise d'un pays : MAD au Maroc, EUR en Europe, USD ailleurs. */
export function currencyForCountry(country: string | null): Currency {
  if (!country) return DEFAULT_CURRENCY;
  if (country === "MA") return "MAD";
  if (EUROPE.has(country)) return "EUR";
  return "USD";
}

/* Formatage maison plutôt qu'Intl.NumberFormat : le résultat est
   identique au rendu serveur et dans le navigateur (pas d'écart
   d'hydratation), et garde l'écriture déjà utilisée sur le site
   (« 1 240 MAD », « 1,240 MAD »).
   - français : 1 240 MAD · 1 240 € · 1 240 $ (espaces insécables)
   - anglais  : 1,240 MAD · €1,240 · $1,240 */
export function formatMoney(
  amount: number,
  currency: Currency,
  locale: "fr" | "en",
): string {
  const negative = amount < 0;
  const abs = Math.abs(amount);
  const decimals = Number.isInteger(abs) ? 0 : 2;
  const [int, frac] = abs.toFixed(decimals).split(".");
  const group = locale === "en" ? "," : " ";
  const decimal = locale === "en" ? "." : ",";
  let n = int.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  if (frac) n += decimal + frac;
  if (negative) n = `-${n}`;

  if (currency === "MAD") return `${n} MAD`;
  const symbol = currency === "EUR" ? "€" : "$";
  return locale === "en" ? `${symbol}${n}` : `${n} ${symbol}`;
}
