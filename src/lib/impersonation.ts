"use client";

import { createClient } from "@/lib/supabase/client";

/* Usurpation d'identité, réservée à l'administrateur. La bascule de session
   passe par un jeton à usage unique fabriqué côté serveur (Edge Function
   « impersonate ») ; ici, seule la mécanique navigateur : échanger la
   session admin contre celle de la cible, puis la restaurer au retour.

   La session admin est mise de côté avant la bascule pour permettre un
   retour sans nouvelle connexion — son jeton de rafraîchissement vit déjà
   dans le stockage de Supabase, le recopier ici n'ajoute pas d'exposition. */

const BACKUP_KEY = "tc_admin_session";
const FLAG_KEY = "tc_impersonating";

export type ImpersonationFlag = { email: string; role: string };

const homeForRole = (role: string) =>
  role === "concierge"
    ? "/concierge"
    : role === "hotel"
      ? "/hotel"
      : role === "admin"
        ? "/admin"
        : "/dashboard";

/* Valeur brute du drapeau : primitive stable, adaptée à useSyncExternalStore
   (un objet reparsé à chaque appel ferait boucler React). */
export function impersonationRaw(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(FLAG_KEY);
}

export function parseImpersonation(
  raw: string | null
): ImpersonationFlag | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ImpersonationFlag;
  } catch {
    return null;
  }
}

/* Devient la cible. Renvoie un message d'erreur, ou null en cas de succès
   (la page est alors rechargée sur l'espace de la cible). */
export async function startImpersonation(target: {
  id: string;
  email: string;
  role: string;
}): Promise<string | null> {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    window.localStorage.setItem(
      BACKUP_KEY,
      JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    );
  }

  const { data, error } = await supabase.functions.invoke("impersonate", {
    body: { userId: target.id },
  });

  if (error || !data?.token_hash) {
    window.localStorage.removeItem(BACKUP_KEY);
    /* 404 de la fonction : elle n'est pas encore déployée. */
    return (
      (data?.error as string) ??
      "Connexion « en tant que » indisponible : la fonction serveur « impersonate » n'est pas déployée."
    );
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: data.token_hash as string,
    type: "magiclink",
  });
  if (verifyError) {
    window.localStorage.removeItem(BACKUP_KEY);
    return verifyError.message;
  }

  window.localStorage.setItem(
    FLAG_KEY,
    JSON.stringify({ email: target.email, role: target.role })
  );
  window.location.href = homeForRole(target.role);
  return null;
}

/* Restaure la session administrateur mise de côté. À défaut, renvoie à la
   page de connexion. */
export async function stopImpersonation(): Promise<void> {
  const supabase = createClient();
  const raw = window.localStorage.getItem(BACKUP_KEY);
  window.localStorage.removeItem(FLAG_KEY);
  window.localStorage.removeItem(BACKUP_KEY);

  if (raw) {
    try {
      const tokens = JSON.parse(raw) as {
        access_token: string;
        refresh_token: string;
      };
      const { error } = await supabase.auth.setSession(tokens);
      if (!error) {
        window.location.href = "/admin";
        return;
      }
    } catch {
      /* jeton illisible : on retombe sur la reconnexion. */
    }
  }
  await supabase.auth.signOut();
  window.location.href = "/login";
}
