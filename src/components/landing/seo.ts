import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n/server";

/* Métadonnées d'une page publique, dans la langue du visiteur.

   - Titre : la page seule ; le gabarit du layout racine ajoute
     « | twocards. », toujours dans cet ordre.
   - Open Graph et Twitter : mêmes titre et description, URL de la page.
     Un bloc openGraph défini dans une page remplace entièrement celui du
     layout : le nom du site et la langue sont donc répétés ici. L'image de
     partage vient de src/app/opengraph-image.tsx.
   - canonical : l'URL sans paramètre (la langue vit dans un cookie, les
     deux versions partagent la même adresse).
   - index: false pour les pages de compte et les pages légales. */
export async function pageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: [fr: string, en: string];
  description?: [fr: string, en: string];
  path: string;
  index?: boolean;
}): Promise<Metadata> {
  const en = (await getLocale()) === "en";
  const pageTitle = en ? title[1] : title[0];
  const pageDescription = description ? (en ? description[1] : description[0]) : undefined;
  const fullTitle = `${pageTitle} | twocards.`;
  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: path },
    robots: index ? undefined : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "twocards.",
      locale: en ? "en_GB" : "fr_FR",
      alternateLocale: en ? "fr_FR" : "en_GB",
      url: path,
      title: fullTitle,
      description: pageDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: pageDescription,
    },
  };
}
