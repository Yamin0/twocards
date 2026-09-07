// Passerelle de session pour l'application mobile.
//
// L'app native se connecte avec Supabase (mot de passe) et garde sa propre
// session. Pour afficher les dashboards du site dans une WebView, il lui faut
// une session *cookie* côté site — indépendante de la sienne, sinon les deux
// clients se disputeraient le même jeton de rafraîchissement (rotation) et se
// déconnecteraient mutuellement.
//
// Cette fonction fabrique donc, pour l'appelant lui-même, un jeton de
// connexion à usage unique (magic link). La WebView l'échange contre des
// cookies sur /auth/mobile du site. Même mécanique que « impersonate »,
// mais restreinte à son propre compte.
//
// Déploiement : supabase functions deploy mobile-session
// (hérite de SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

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
  if (!user?.email) return json(401, { error: "Non connecté" });

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: link, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  });
  if (error || !link?.properties?.hashed_token) {
    return json(500, { error: "Génération du jeton impossible" });
  }

  return json(200, { token_hash: link.properties.hashed_token });
});
