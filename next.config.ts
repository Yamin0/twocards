import type { NextConfig } from "next";

/* Hôte du projet Supabase, lu dans l'environnement : les photos des adresses
   et des portails (Storage public) passent ainsi par l'optimiseur d'images
   de Next (taille adaptée à l'écran, WebP / AVIF). */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

const nextConfig: NextConfig = {
  images: {
    /* En développement seulement : sur un réseau en NAT64 (certaines box et
       certains partages de connexion), l'hôte du stockage se résout en
       64:ff9b::…, que l'optimiseur prend pour une adresse privée et refuse.
       Les hôtes restant limités à `remotePatterns`, rien d'autre ne s'ouvre.
       En production la protection reste active. */
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
              search: "",
            },
          ]
        : []),
    ],
  },

  /* Anti-détournement de clic : aucune page de l'application ne peut être
     affichée dans l'iframe d'un autre site (connexion et espaces compris).
     Seule exception : le portail de réservation `/r/…`, fait pour être
     intégré sur le site de l'établissement (`?embed=1`). Les aperçus internes
     (menu client dans l'espace hôtel, portail dans le dashboard) restent
     possibles : même origine. */
  async headers() {
    const sameOriginOnly = [
      { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
      /* Équivalent pour les navigateurs qui ignorent frame-ancestors. */
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ];
    return [
      { source: "/", headers: sameOriginOnly },
      /* Tout chemin qui ne commence pas par `/r/`. */
      { source: "/((?!r/).*)", headers: sameOriginOnly },
    ];
  },
};

export default nextConfig;
