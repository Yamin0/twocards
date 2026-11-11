/* Acompte en ligne — ce que la page client et l'admin partagent (aucun
   secret ici). Le calcul qui fait foi est en base (`qr_deposit_quote`) ;
   celui-ci ne sert qu'à afficher le montant avant de payer. */

export type DepositCurrency = "mad" | "eur" | "usd";
export type DepositMode = "none" | "per_person" | "fixed";

/* Réglage d'une adresse du catalogue, tel que lu par la page client. */
export type OfferDeposit = {
  mode: "per_person" | "fixed";
  unit: number;
  currency: DepositCurrency;
};

export const DEPOSIT_CURRENCIES: DepositCurrency[] = ["mad", "eur", "usd"];

export const isDepositCurrency = (v: unknown): v is DepositCurrency =>
  v === "mad" || v === "eur" || v === "usd";

/** Total à payer pour `party` personnes. */
export const depositTotal = (d: OfferDeposit, party: number) =>
  d.mode === "per_person" ? d.unit * Math.min(Math.max(party, 1), 50) : d.unit;

/** Véhicules nécessaires pour `party` personnes (quad : 1 place, buggy X3
    MAX : 4…). Sans nombre de places, une réservation = une prestation. Même
    calcul que `qr_deposit_quote` en base. */
export const vehiclesFor = (seats: number | undefined, party: number) =>
  seats && seats > 0 ? Math.ceil(Math.min(Math.max(party, 1), 50) / seats) : 1;

/* Panier de véhicules : quantité par prestation (identifiant → nombre). */
export type VehicleCart = Record<string, number>;

/** Lignes du panier, dans l'ordre de l'offre, quantités positives seulement. */
export function cartLines<T extends { id: string }>(services: T[], cart: VehicleCart) {
  return services
    .map((service) => ({ service, qty: Math.max(0, Math.floor(cart[service.id] ?? 0)) }))
    .filter((line) => line.qty > 0);
}

/** « 400 MAD », « 40 € » — dans la langue de la page. */
export function formatDeposit(amount: number, currency: string, locale: string) {
  const code = currency.toUpperCase();
  try {
    const out = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: code === "MAD" ? "code" : "symbol",
      maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
    return out;
  } catch {
    return `${amount} ${code}`;
  }
}
