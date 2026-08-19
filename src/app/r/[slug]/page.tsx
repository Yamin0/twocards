import type { Metadata } from "next";
import { PortalExperience } from "./portal-experience";

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
  return <PortalExperience slug={slug} embed={embed === "1"} />;
}
