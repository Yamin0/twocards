// Fonction « Se connecter en tant que » — réservée à l'administrateur.
//
// Déploiement (une fois, depuis la racine du projet) :
//   supabase functions deploy impersonate
// La fonction hérite automatiquement de SUPABASE_URL, SUPABASE_ANON_KEY et
// SUPABASE_SERVICE_ROLE_KEY — aucun secret à configurer.
//
// Sécurité : le drapeau admin est vérifié côté serveur (app_metadata, hors
// de portée du client). La clé de service ne quitte jamais cette fonction ;
// le navigateur ne reçoit qu'un jeton de connexion à usage unique pour le
// compte cible. Chaque appel est journalisé dans public.admin_audit.

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "POST attendu" });

  const url = Deno.env.get("SUPABASE_URL")!;

  // Identité de l'appelant, vérifiée auprès du serveur d'auth.
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
  });
  const {
    data: { user },
  } = await caller.auth.getUser();
  if (!user || user.app_metadata?.is_admin !== true) {
    return json(403, { error: "Réservé à l'administrateur" });
  }

  let userId: string | undefined;
  try {
    ({ userId } = await req.json());
  } catch {
    return json(400, { error: "Corps JSON attendu" });
  }
  if (!userId) return json(400, { error: "userId manquant" });
  if (userId === user.id) {
    return json(400, { error: "Vous êtes déjà sur ce compte" });
  }

  // Clé de service : réservée au serveur, seule habilitée à ces opérations.
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: target, error: targetError } =
    await admin.auth.admin.getUserById(userId);
  if (targetError || !target?.user?.email) {
    return json(404, { error: "Compte introuvable" });
  }

  // Jeton de connexion à usage unique pour le compte cible.
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: target.user.email,
  });
  if (linkError || !link?.properties?.hashed_token) {
    return json(500, { error: "Génération du jeton impossible" });
  }

  // Trace d'audit, sans bloquer en cas d'échec d'écriture.
  await admin
    .from("admin_audit")
    .insert({ admin_id: user.id, target_id: userId, action: "impersonate" });

  return json(200, {
    token_hash: link.properties.hashed_token,
    email: target.user.email,
  });
});
