import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/* « Voir en tant que » : l'administrateur ouvre l'espace d'un compte.

   Tout se passe côté serveur :
   - le droit est vérifié ici (app_metadata.is_admin, hors de portée du
     client) puis par la fonction Supabase « impersonate », seule à détenir
     la clé service role, qui fabrique un jeton de connexion à usage unique ;
   - la session du compte visité est inscrite en base (admin_impersonations) :
     un déclencheur y refuse alors toute écriture, la visite est en lecture
     seule ;
   - la session admin est mise de côté dans un cookie httpOnly, illisible
     par le JavaScript de la page, et restaurée au retour ;
   - le retour ne révoque QUE la session de visite (portée « local ») : le
     vrai titulaire du compte reste connecté sur ses appareils. */

export const RETURN_COOKIE = "tc-admin-return";
/* Simple indice pour le bandeau (aucune donnée) : lui évite d'interroger
   le serveur sur chaque page du site public. */
export const HINT_COOKIE = "tc-view-as";
const MAX_AGE = 60 * 60 * 12;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const homeForRole = (role: string | null | undefined) =>
  role === "concierge" ? "/concierge" : role === "hotel" ? "/hotel" : role === "admin" ? "/admin" : "/dashboard";

/* Appel d'une RPC avec un jeton précis : la création de la visite se fait
   avec le jeton ADMIN alors que les cookies portent déjà le compte visité. */
async function rpc(name: string, accessToken: string, args: Record<string, unknown> = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const body: unknown = await res.json().catch(() => null);
  return { ok: res.ok, body };
}

/* Identifiant de session (auth.sessions.id) porté par le jeton d'accès. */
function sessionIdOf(accessToken: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8")) as {
      session_id?: unknown;
    };
    return typeof payload.session_id === "string" ? payload.session_id : null;
  } catch {
    return null;
  }
}

type Result = { ok: true; home: string } | { ok: false; status: number; error: string };

export async function startViewAs(targetId: unknown, secure: boolean): Promise<Result> {
  if (typeof targetId !== "string" || !UUID.test(targetId)) {
    return { ok: false, status: 400, error: "Compte invalide." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.is_admin !== true) {
    return { ok: false, status: 403, error: "Réservé à l'administrateur." };
  }
  if (targetId === user.id) {
    return { ok: false, status: 400, error: "Vous êtes déjà sur ce compte." };
  }
  /* Après getUser (qui valide et rafraîchit au besoin), la session lue
     dans les cookies est la session admin à jour. */
  const {
    data: { session: admin },
  } = await supabase.auth.getSession();
  if (!admin) return { ok: false, status: 401, error: "Session administrateur introuvable." };

  /* Jeton à usage unique, fabriqué par la fonction Supabase (clé service
     role côté Supabase uniquement). */
  const fn = await fetch(`${SUPABASE_URL}/functions/v1/impersonate`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${admin.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: targetId }),
    cache: "no-store",
  }).catch(() => null);
  const fnBody = (await fn?.json().catch(() => null)) as { token_hash?: string; error?: string } | null;
  if (!fn?.ok || !fnBody?.token_hash) {
    return {
      ok: false,
      status: 502,
      error: fnBody?.error ?? "La fonction serveur « impersonate » ne répond pas.",
    };
  }

  /* Bascule : les cookies portent désormais le compte visité. */
  const { data: verified, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: fnBody.token_hash,
    type: "magiclink",
  });
  if (verifyError || !verified.session || !verified.user) {
    return { ok: false, status: 500, error: "Ouverture de la session impossible." };
  }

  /* Annule la bascule : révoque la seule session de visite et remet la
     session admin dans les cookies. */
  const rollback = async (status: number, error: string): Promise<Result> => {
    await supabase.auth.signOut({ scope: "local" });
    await supabase.auth.setSession({
      access_token: admin.access_token,
      refresh_token: admin.refresh_token,
    });
    return { ok: false, status, error };
  };

  if (verified.user.app_metadata?.is_admin === true) {
    return rollback(400, "Un compte administrateur ne se visite pas.");
  }

  /* Inscription en base, avec le jeton ADMIN : sans elle, pas de lecture
     seule, donc pas de visite. */
  const sessionId = sessionIdOf(verified.session.access_token);
  const started = sessionId
    ? await rpc("admin_start_impersonation", admin.access_token, {
        p_target: targetId,
        p_session: sessionId,
      })
    : { ok: false, body: null };
  if (!started.ok) {
    const missing =
      started.body !== null &&
      typeof started.body === "object" &&
      (started.body as { code?: string }).code === "PGRST202";
    return rollback(
      500,
      missing
        ? "La vue en lecture seule n'est pas encore installée : lancer la migration « voir_en_tant_que » dans Supabase."
        : "Impossible d'enregistrer la visite."
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(RETURN_COOKIE, admin.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
  cookieStore.set(HINT_COOKIE, "1", { secure, sameSite: "lax", path: "/", maxAge: MAX_AGE });

  const role = (verified.user.app_metadata?.role ?? verified.user.user_metadata?.role) as string | undefined;
  return { ok: true, home: homeForRole(role) };
}

/* Fin de visite : révoque la session de visite, restaure l'admin, note la
   fin dans le journal. Renvoie la page où aller. */
export async function endViewAs(): Promise<string> {
  const cookieStore = await cookies();
  const adminRefresh = cookieStore.get(RETURN_COOKIE)?.value;
  cookieStore.delete(RETURN_COOKIE);
  cookieStore.delete(HINT_COOKIE);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* Déjà sur la session admin (cookie de retour resté orphelin) : rien à
     révoquer. */
  if (user?.app_metadata?.is_admin === true) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) await rpc("admin_end_impersonation", session.access_token);
    return "/admin?vue=comptes";
  }

  if (user) await supabase.auth.signOut({ scope: "local" });
  if (!adminRefresh) return "/login";

  const { data, error } = await supabase.auth.refreshSession({ refresh_token: adminRefresh });
  if (error || !data.session) return "/login";
  if (data.user?.app_metadata?.is_admin !== true) {
    await supabase.auth.signOut({ scope: "local" });
    return "/login";
  }
  await rpc("admin_end_impersonation", data.session.access_token);
  return "/admin?vue=comptes";
}

/* État lu par le bandeau, vérifié en base : la session courante est-elle
   une visite, et de quel compte ? */
export async function viewAsStatus(): Promise<{ active: false } | { active: true; name: string; email: string | null }> {
  const cookieStore = await cookies();
  if (!cookieStore.get(HINT_COOKIE) && !cookieStore.get(RETURN_COOKIE)) return { active: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const status = user && session ? await rpc("impersonation_status", session.access_token) : null;
  const row = Array.isArray(status?.body) ? status.body[0] : null;
  if (!user || !row) {
    /* Indice périmé : on l'efface, le bandeau ne redemandera plus. */
    if (!cookieStore.get(RETURN_COOKIE)) cookieStore.delete(HINT_COOKIE);
    return { active: false };
  }
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.venue_name === "string" && meta.venue_name) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    user.email ||
    "ce compte";
  return { active: true, name, email: user.email ?? null };
}
