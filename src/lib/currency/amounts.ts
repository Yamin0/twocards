import type { Currency } from "./index";

/* ─── Montants d'exemple du site public ──────────────────────────────────
   Tous les montants affichés dans les mini-écrans de la landing et des
   pages métiers, un par usage, écrits à la main dans chaque devise : pas
   de conversion en direct. Les chiffres en euros et en dollars sont des
   valeurs rondes et plausibles, pas des taux de change au centime.

   Quand plusieurs montants sont liés (une somme, une commission de 10 %),
   les trois devises respectent le même calcul : voir les commentaires.

   Pour changer un montant : le modifier ici, dans les trois devises. */

export type Amount = Record<Currency, number>;

export const AMOUNTS = {
  /* Accueil · « Activité » : commission validée. */
  activityCommission: { MAD: 480, EUR: 45, USD: 50 },

  /* Accueil · « Différenciateurs » : offre de dernière minute, budget client. */
  lastMinuteMinimum: { MAD: 8000, EUR: 750, USD: 800 },
  priorityBudget: { MAD: 12000, EUR: 1100, USD: 1200 },

  /* Accueil · « QR » : acompte payé et commission du mois. */
  qrDeposit: { MAD: 800, EUR: 75, USD: 80 },
  qrMonthlyCommission: { MAD: 3640, EUR: 335, USD: 364 },

  /* Page Concierges : minimum par personne, gains du mois. */
  conciergeMinimumPerGuest: { MAD: 600, EUR: 55, USD: 60 },
  conciergeMonthlyEarnings: { MAD: 1860, EUR: 170, USD: 186 },

  /* Page Hôtels : commission par emplacement.
     Chambre + Lobby + Spa = total (620 + 1 140 + 380 = 2 140 MAD). */
  hotelRoom: { MAD: 620, EUR: 60, USD: 62 },
  hotelLobby: { MAD: 1140, EUR: 105, USD: 114 },
  hotelSpa: { MAD: 380, EUR: 35, USD: 38 },
  hotelTotal: { MAD: 2140, EUR: 200, USD: 214 },

  /* Page Restaurants (établissements) : conditions, addition, CA apporté. */
  venueTableMinimum: { MAD: 800, EUR: 75, USD: 80 },
  venueVerifiedBill: { MAD: 2300, EUR: 210, USD: 230 },
  venueReferredRevenue: { MAD: 48200, EUR: 4450, USD: 4820 },

  /* Page Influenceurs : la commission vaut 10 % du revenu vérifié,
     et 10 % de l'addition dans le parcours. */
  influencerVerifiedRevenue: { MAD: 21400, EUR: 1980, USD: 2140 },
  influencerCommissions: { MAD: 2140, EUR: 198, USD: 214 },
  influencerBill: { MAD: 1240, EUR: 120, USD: 130 },
  influencerBillCommission: { MAD: 124, EUR: 12, USD: 13 },
} satisfies Record<string, Amount>;

export type AmountKey = keyof typeof AMOUNTS;

/** Formate un montant d'exemple dans la devise courante (voir `useMoney`). */
export type Money = (amount: AmountKey | Amount) => string;
