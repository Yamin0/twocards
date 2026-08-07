"use client";

import { useState, useSyncExternalStore } from "react";
import { Eye, Loader2, LogOut } from "lucide-react";
import {
  impersonationRaw,
  parseImpersonation,
  stopImpersonation,
} from "@/lib/impersonation";

/* Le drapeau ne change qu'au prix d'un rechargement (bascule ou retour) :
   un abonnement vide suffit, getServerSnapshot rend null pour l'hydratation. */
const subscribe = () => () => {};

/* Bandeau permanent affiché tant que l'administrateur navigue sous
   l'identité d'un autre compte. Monté à la racine de l'application : il
   couvre tous les espaces (dashboard, concierge, hôtel) sans dépendre de
   leurs layouts. Invisible hors usurpation, donc sans effet pour les
   utilisateurs normaux. */
export function ImpersonationBanner() {
  const raw = useSyncExternalStore(
    subscribe,
    impersonationRaw,
    () => null
  );
  const flag = parseImpersonation(raw);
  const [leaving, setLeaving] = useState(false);

  if (!flag) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-[13px] font-semibold text-black shadow-lg">
      <Eye size={15} strokeWidth={2} className="shrink-0" />
      <span className="truncate">
        Vue administrateur — connecté en tant que{" "}
        <span className="font-bold">{flag.email}</span>
      </span>
      <button
        onClick={() => {
          setLeaving(true);
          void stopImpersonation();
        }}
        disabled={leaving}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-black/85 px-3 py-1 text-[12px] font-bold text-white transition-colors hover:bg-black disabled:opacity-60"
      >
        {leaving ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <LogOut size={12} strokeWidth={2.5} />
        )}
        Revenir à l&apos;administration
      </button>
    </div>
  );
}
