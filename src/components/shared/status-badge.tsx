"use client";

import { Badge } from "@/components/ui/badge";
import type { Translate } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

/* Statut de réservation, sur base du Badge shadcn : couleurs sémantiques
   par-dessus la primitive, une seule définition pour tous les tableaux. */

const STYLES: Record<string, string> = {
  confirmée: "bg-emerald-500/15 text-emerald-400",
  "en attente": "bg-amber-500/15 text-amber-400",
  annulée: "bg-red-500/15 text-red-400",
  "no-show": "bg-white/10 text-white/50 line-through decoration-white/30",
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
      className={`${STYLES[status] ?? "bg-white/10 text-white/60"} font-ui h-auto border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap`}
    >
      {getLabels(t)[status] ?? status}
    </Badge>
  );
}
