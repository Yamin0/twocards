/* Supabase a renommé la clé publique : l'ancienne `anon` (un JWT `eyJ…`)
   devient `publishable` (`sb_publishable_…`). Les deux fonctionnent avec
   @supabase/ssr, mais le tableau de bord ne propose plus que la seconde.
   On accepte donc les deux noms de variable, pour que le projet démarre
   quel que soit le fichier d'environnement en face.

   Les deux accès sont écrits en toutes lettres : Next.js n'inline une
   variable `NEXT_PUBLIC_` que sur une référence directe à
   `process.env.NOM`, jamais sur un accès dynamique. */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const SUPABASE_PUBLIC_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!;
