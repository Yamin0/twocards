/*
  Fixe un nouveau mot de passe sur un compte existant (n'importe quel rôle).
  Les mots de passe Supabase sont hachés et irrécupérables : on ne peut que
  les remplacer.

  Usage :
    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
    SUPABASE_SERVICE_ROLE_KEY=... \
    node scripts/reset-password.mjs --email test@twocardspro.com --password '********'
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
const email = args.email;
const password = args.password;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}
if (!email) {
  console.error("Email requis (--email).");
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("Mot de passe requis (--password), 8 caractères minimum.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* L'API admin n'a pas de recherche par email : on parcourt les pages. */
async function findUserByEmail(target) {
  const wanted = target.toLowerCase();
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const hit = data.users.find((u) => u.email?.toLowerCase() === wanted);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
}

let user;
try {
  user = await findUserByEmail(email);
} catch (err) {
  console.error(`Échec : ${err.message}`);
  process.exit(1);
}
if (!user) {
  console.error(`Aucun compte pour ${email}. Pour un compte hôtel : scripts/create-hotel-account.mjs`);
  process.exit(1);
}

const { error } = await supabase.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
});
if (error) {
  console.error(`Échec : ${error.message}`);
  process.exit(1);
}

const role = user.app_metadata?.role ?? user.user_metadata?.role ?? "inconnu";
console.log(`Mot de passe mis à jour pour ${user.email} (rôle ${role}, id ${user.id}).`);
