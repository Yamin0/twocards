"use client";

import { useEffect, useState } from "react";
import { Eye, Loader2, LogOut } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/* Bandeau « Vous consultez l'espace de X » : affiché tant que
   l'administrateur visite un compte.

   Monté dans le layout racine, donc livré à toutes les pages, site public
   compris : il n'interroge le serveur que si le cookie indice
   `tc-view-as` est présent (posé à l'ouverture de la visite, sans donnée).
   L'état affiché vient du serveur, qui le vérifie en base ; l'indice seul
   ne montre rien. Le module `@/lib/impersonation` n'est chargé qu'au clic
   sur « Quitter ». */

const HINT_COOKIE = "tc-view-as";

type Status = { active: true; name: string; email: string | null };

export function ImpersonationBanner() {
  const t = useT();
  const [status, setStatus] = useState<Status | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    /* Anciennes clés (version localStorage) : la session admin y était
       recopiée ; on les efface sans attendre. */
    try {
      window.localStorage.removeItem("tc_admin_session");
      window.localStorage.removeItem("tc_impersonating");
    } catch {
      /* stockage refusé : rien à effacer. */
    }
    if (!document.cookie.split("; ").some((c) => c.startsWith(`${HINT_COOKIE}=`))) return;
    let cancelled = false;
    fetch("/api/admin/voir-en-tant-que", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: { active: boolean } & Partial<Status>) => {
        if (!cancelled && s.active && s.name) setStatus({ active: true, name: s.name, email: s.email ?? null });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status) return null;

  return (
    <div
      role="status"
      className="print-hide fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-[13px] font-semibold text-black shadow-lg"
    >
      <Eye size={15} strokeWidth={2} className="shrink-0" />
      <span className="truncate">
        {t("Vous consultez l'espace de", "You are viewing the workspace of")}{" "}
        <span className="font-bold">{status.name}</span>
        <span className="hidden font-normal sm:inline">
          {" "}
          · {t("lecture seule", "read-only")}
        </span>
      </span>
      <button
        onClick={() => {
          setLeaving(true);
          import("@/lib/impersonation")
            .then((m) => m.stopImpersonation())
            /* Module non chargé (réseau coupé) : le bouton redevient
               cliquable, la session en cours n'a pas été touchée. */
            .catch(() => setLeaving(false));
        }}
        disabled={leaving}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-black/85 px-3 py-1 text-[12px] font-bold text-white transition-colors hover:bg-black disabled:opacity-60"
      >
        {leaving ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} strokeWidth={2.5} />}
        {t("Quitter", "Leave")}
      </button>
    </div>
  );
}
