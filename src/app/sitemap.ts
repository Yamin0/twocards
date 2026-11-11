import type { MetadataRoute } from "next";

const BASE = "https://twocardspro.com";

/* Seules les pages à indexer : l'accueil et les quatre pages métiers. Les
   pages légales sont en noindex, elles n'ont donc rien à faire ici. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/hotels`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/restaurants`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/concierges`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/influenceurs`, changeFrequency: "monthly", priority: 0.9 },
  ];
}
