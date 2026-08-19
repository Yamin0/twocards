import type { Metadata } from "next";
import { Marcellus, Figtree } from "next/font/google";
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
   S'intègre aussi en iframe sur le site de l'établissement (?embed=1). */
export const metadata: Metadata = {
  title: "Réserver | twocards.",
  description: "Réservez votre table en quelques secondes.",
  robots: { index: true, follow: false },
};

export default async function PortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { slug } = await params;
  const { embed } = await searchParams;
  return (
    <div className={`${portalDisplay.variable} ${portalUi.variable}`}>
      <PortalExperience slug={slug} embed={embed === "1"} />
    </div>
  );
}
