"use client";

/* « Voir en tant que » côté navigateur : de simples appels à la route
   serveur /api/admin/voir-en-tant-que, qui vérifie le droit, bascule les
   cookies de session et met la session admin de côté (cookie httpOnly).
   Aucun jeton ne transite par ce code. */

const ENDPOINT = "/api/admin/voir-en-tant-que";

/* Anciennes clés de la version « localStorage » : la session admin de
   secours y était recopiée. On les efface partout où ce module passe. */
export function clearLegacyImpersonation() {
  try {
    window.localStorage.removeItem("tc_admin_session");
    window.localStorage.removeItem("tc_impersonating");
  } catch {
    /* stockage refusé : rien à effacer. */
  }
}

/* Ouvre l'espace du compte. Renvoie un message d'erreur, ou null en cas de
   succès (la page part alors vers l'espace du compte). */
export async function startImpersonation(target: { id: string }): Promise<string | null> {
  clearLegacyImpersonation();
  const en = document.documentElement.lang === "en";
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: target.id }),
    });
    const body = (await res.json().catch(() => null)) as { home?: string; error?: string } | null;
    if (!res.ok || !body?.home) {
      return body?.error ?? (en ? "Couldn’t open this account." : "Impossible d'ouvrir ce compte.");
    }
    window.location.href = body.home;
    return null;
  } catch {
    return en ? "Network error." : "Erreur réseau.";
  }
}

/* Fin de visite : le serveur restaure la session admin et indique où
   revenir. */
export async function stopImpersonation(): Promise<void> {
  clearLegacyImpersonation();
  let home = "/admin?vue=comptes";
  try {
    const res = await fetch(ENDPOINT, { method: "DELETE" });
    const body = (await res.json().catch(() => null)) as { home?: string } | null;
    if (body?.home) home = body.home;
  } catch {
    /* réseau coupé : on recharge l'administration, le proxy tranchera. */
  }
  window.location.href = home;
}
