"use client";

import { Card, ErrorState } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";
import { formatRateRange } from "@/lib/hotel/format";
import type { Locale } from "@/lib/i18n";

/* États communs aux pages de l'espace hôtel. */

/** Les données n'ont pas pu être chargées et rien n'est en cache. */
export function HotelLoadError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <Card padded={false}>
      <ErrorState
        onRetry={onRetry}
        description={t(
          "Vos QR codes et vos réservations n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez.",
          "Your QR codes and reservations couldn't be loaded. Check your connection, then try again."
        )}
      />
    </Card>
  );
}

/* Vrai quand le chargement a échoué sans rien laisser à afficher : on
   montre l'erreur plutôt qu'un faux « aucune réservation ». Si des données
   sont déjà en cache, la page reste lisible et le bandeau de la coque
   signale le problème. */
export function loadFailed(failed: boolean, ...lists: unknown[][]) {
  return failed && lists.every((l) => l.length === 0);
}

/* La règle de commission, avec le taux lu dans les réservations
   (commission_rate). Sans réservation, aucun pourcentage n'est affiché. */
export function commissionRule(rates: { min: number; max: number } | null, locale: Locale) {
  const en = locale === "en";
  if (!rates)
    return en
      ? "a percentage of what the guest actually spends, set with each venue"
      : "un pourcentage du montant réellement dépensé par le client, convenu avec chaque établissement";
  const range = formatRateRange(rates, locale);
  if (rates.min === rates.max)
    return en
      ? `${range} of what the guest actually spends`
      : `${range} du montant réellement dépensé par le client`;
  return en
    ? `${range} of what the guest actually spends, depending on the venue`
    : `${range} du montant réellement dépensé par le client, selon l'établissement`;
}
