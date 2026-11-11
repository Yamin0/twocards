"use client";

import { PageSkeleton as Base } from "@/components/app/ui";

/* Squelette de page de l'espace hôtel : celui du kit, avec l'ancienne
   signature (`table`) conservée. */
export function PageSkeleton({ kpis = 4, table = false }: { kpis?: 0 | 3 | 4; table?: boolean }) {
  return <Base kpis={kpis} rows={table ? 8 : 5} />;
}
