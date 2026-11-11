"use client";

import { Card, ErrorState } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";

/* Les données n'ont pas pu être chargées et rien n'est en cache : on le dit,
   plutôt que d'afficher un faux « aucune réservation ». */
export function ConciergeLoadError({ onRetry }: { onRetry: () => void }) {
  const t = useT();
  return (
    <Card padded={false}>
      <ErrorState
        onRetry={onRetry}
        description={t(
          "Vos liens et vos réservations n'ont pas pu être chargés. Vérifiez votre connexion, puis réessayez.",
          "Your links and reservations couldn't be loaded. Check your connection, then try again."
        )}
      />
    </Card>
  );
}
