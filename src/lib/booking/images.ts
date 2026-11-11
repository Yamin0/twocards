/* Les photos des adresses et des portails vivent dans Supabase Storage. Les
   hôtes déclarés dans `next.config.ts` (images.remotePatterns) passent par
   l'optimiseur de next/image (taille adaptée, WebP / AVIF) ; une adresse
   saisie à la main vers un autre hôte est servie telle quelle plutôt que de
   casser l'image. */

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

const SUPABASE_PUBLIC_PATH = "/storage/v1/object/public/";

/** `true` quand next/image ne peut pas optimiser cette source. */
export function isUnoptimizable(src: string) {
  if (!/^https?:\/\//i.test(src)) return false;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return true;
    if (url.hostname === "images.unsplash.com") return false;
    /* Seul le stockage public de Supabase est déclaré, sans paramètre d'URL. */
    return !(
      supabaseHost !== "" &&
      url.hostname === supabaseHost &&
      url.pathname.startsWith(SUPABASE_PUBLIC_PATH) &&
      url.search === ""
    );
  } catch {
    return true;
  }
}
