import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/* Client navigateur, typé sur le schéma de la base : noms de tables, de
   colonnes et de RPC vérifiés à la compilation. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
