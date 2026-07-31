import type { MetadataRoute } from "next";

const BASE = "https://twocardspro.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/restaurants`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/concierges`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/hotels`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/influenceurs`, changeFrequency: "monthly", priority: 0.9 },
    {
      url: `${BASE}/legal/mentions-legales`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${BASE}/legal/confidentialite`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    { url: `${BASE}/legal/cgu`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
