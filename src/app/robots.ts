import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/concierge",
        "/login",
        "/signup",
        "/onboarding",
        "/forgot-password",
        "/reset-password",
        "/auth/",
      ],
    },
    sitemap: "https://twocardspro.com/sitemap.xml",
  };
}
