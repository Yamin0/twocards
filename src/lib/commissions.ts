import { intlLocale, type Locale } from "@/lib/i18n";

/* Lecture des commissions, partagée par l'établissement et l'admin.
   Rien ici ne calcule une commission : le montant vient de la base
   (trigger qr_apply_commission). Ces fonctions ne font que trier et
   présenter. */

/** Une commission est due quand un client envoyé par un hôtel (canal QR)
    est venu et que l'addition est saisie. */
export const isDue = (r: { source: string; amount_spent: number | null; status: string }) =>
  r.source === "qr" && r.amount_spent !== null && r.status !== "annulée" && r.status !== "no-show";

/** Mois courant (AAAA-MM), en heure locale. */
export const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const monthLabel = (period: string, locale: Locale = "fr") => {
  const label = new Date(`${period}-01T00:00:00`).toLocaleDateString(intlLocale(locale), {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const mad = (n: number, locale: Locale = "fr") =>
  `${Math.round(n).toLocaleString(intlLocale(locale))} MAD`;
