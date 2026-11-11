"use client";

import { Badge } from "@/components/ui/badge";
import type { Translate } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

/* Statut de réservation, sur base du Badge shadcn : couleurs sémantiques
   par-dessus la primitive, une seule définition pour tous les tableaux. */

const STYLES: Record<string, string> = {
  confirmée: "bg-ok-soft text-ok",
  "en attente": "bg-warn-soft text-warn",
  annulée: "bg-danger-soft text-danger",
  "no-show": "bg-fill-2 text-ink-3 line-through decoration-ink-4",
};

/* Libellés affichés seulement : les valeurs restent celles de la base. */
const getLabels = (t: Translate): Record<string, string> => ({
  confirmée: t("confirmée", "confirmed"),
  "en attente": t("en attente", "pending"),
  annulée: t("annulée", "cancelled"),
  "no-show": t("no-show", "no-show"),
});

export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  return (
    <Badge
      className={`${STYLES[status] ?? "bg-fill-2 text-ink-2"} font-ui h-auto border-0 px-2 py-0.5 text-xs font-bold whitespace-nowrap`}
    >
      {getLabels(t)[status] ?? status}
    </Badge>
  );
}
