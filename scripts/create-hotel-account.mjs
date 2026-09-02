/*
  Crée un compte hôtel de test pour le dashboard /hotel.

  Usage :
    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
    SUPABASE_SERVICE_ROLE_KEY=... \
    node scripts/create-hotel-account.mjs --email testhotel@twocardspro.com --password '********'

  Le rôle est écrit dans app_metadata (lu en priorité par le middleware et
  non modifiable côté client) ; les autres champs reprennent ceux du
  formulaire d'inscription (src/app/signup/page.tsx).
*/
import { createClient } from "@supabase/supabase-js";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, arg, i, all) => {
    if (arg.startsWith("--")) acc.push([arg.slice(2), all[i + 1] ?? ""]);
    return acc;
  }, [])
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = args.email ?? "testhotel@twocardspro.com";
const password = args.password ?? process.env.HOTEL_TEST_PASSWORD;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("Mot de passe requis (--password ou HOTEL_TEST_PASSWORD), 8 caractères minimum.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "hotel" },
  user_metadata: {
    full_name: args.name ?? "Hôtel Test",
    phone: args.phone ?? "+212600000000",
    instagram: null,
    role: "hotel",
    venue_name: args.venue ?? "Hôtel Test twocards",
    venue_type: null,
    city: args.city ?? "Marrakech",
    rooms_count: Number(args.rooms ?? 40),
  },
});

if (error) {
  console.error(`Échec : ${error.message}`);
  process.exit(1);
}

console.log(`Compte hôtel créé : ${data.user.email} (id ${data.user.id})`);
console.log("Connexion sur /login → redirection automatique vers /hotel.");
