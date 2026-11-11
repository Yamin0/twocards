import type { MetadataRoute } from "next";

/* Les règles de robots.txt sont des préfixes : « /concierge » bloquerait
   aussi la page publique /concierges, et « /hotel » la page /hotels. Les
   espaces connectés sont donc bloqués par « /x/ » (leurs sous-pages) et
   « /x$ » (leur racine exacte). Le portail public /r/ reste ouvert. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Espaces connectés
        "/dashboard",
        "/hotel/",
        "/hotel$",
        "/concierge/",
        "/concierge$",
        "/admin",
        // Pages clients privées (menu d'une chambre, avis d'une réservation)
        "/s/",
        "/avis/",
        // Technique
        "/auth/",
        "/api/",
        "/kit",
        // Pages de compte
        "/login",
        "/signup",
        "/onboarding",
        "/forgot-password",
        "/reset-password",
        "/desinscription",
      ],
    },
    sitemap: "https://twocardspro.com/sitemap.xml",
  };
}
