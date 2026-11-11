import type { Metadata } from "next";
import { Marcellus, Figtree } from "next/font/google";
import { loadPortal } from "@/lib/booking/load";
import { getT } from "@/lib/i18n/server";
import { PortalExperience } from "./portal-experience";

/* Identité typographique propre au portail — l'écriture d'une maison,
   pas celle du back-office : Marcellus (serif display, hôtellerie de
   luxe) pour le nom et les titres, Figtree pour l'interface. Chargées
   ici seulement, elles ne pèsent sur aucune autre page. */
const portalDisplay = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-portal-display",
});
const portalUi = Figtree({
  subsets: ["latin"],
  variable: "--font-portal-ui",
});

/* Portail de réservation directe d'un établissement, hébergé par twocards.
   S'intègre aussi en iframe sur le site de l'établissement (`?embed=1`).

   Le portail (`portal_get`) est chargé ici, côté serveur : le HTML porte le
   nom, l'accroche et la photo de l'établissement, et les métadonnées sont à
   son nom. Un portail inconnu ou une panne ne sont pas indexés. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, t] = await Promise.all([params, getT()]);
  const result = await loadPortal(slug);
  if (result.status !== "ready") {
    return {
      title: t("Réserver", "Book"),
      description: t("Réservez votre table en quelques secondes.", "Book your table in seconds."),
      robots: { index: false, follow: false },
    };
  }
  const { display_name: name, tagline, cover_url: cover } = result.portal;
  const title = t(`${name} · Réserver une table`, `${name} · Book a table`);
  const description =
    tagline ||
    t(
      `Réservez votre table chez ${name} en quelques secondes, sans prépaiement.`,
      `Book your table at ${name} in seconds, with no prepayment.`
    );
  return {
    title,
    description,
    robots: { index: true, follow: false },
    openGraph: { title, description, ...(cover ? { images: [cover] } : {}) },
  };
}

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const [{ slug }, { embed }] = await Promise.all([params, searchParams]);
  const result = await loadPortal(slug);
  return (
    <div className={`${portalDisplay.variable} ${portalUi.variable}`}>
      <PortalExperience slug={slug} embed={embed === "1"} result={result} />
    </div>
  );
}
