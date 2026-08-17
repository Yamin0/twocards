"use client";

import { Badge } from "@/components/ui/badge";

/* Statut de réservation, sur base du Badge shadcn : couleurs sémantiques
   par-dessus la primitive, une seule définition pour tous les tableaux. */

const STYLES: Record<string, string> = {
  confirmée: "bg-emerald-500/15 text-emerald-400",
  "en attente": "bg-amber-500/15 text-amber-400",
  annulée: "bg-red-500/15 text-red-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={`${STYLES[status] ?? "bg-white/10 text-white/60"} font-ui h-auto border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap`}
    >
      {status}
    </Badge>
  );
}
