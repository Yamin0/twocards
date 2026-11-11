import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { RatingExperience } from "./rating-experience";

/* Page publique de notation post-sortie. Le lien est envoyé au client par
   l'établissement ou twocards ; l'UUID de la réservation sert de jeton. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Votre avis", "Your review"),
    description: t("Notez votre sortie en quelques secondes.", "Rate your outing in seconds."),
    robots: { index: false, follow: false },
  };
}

export default async function RatingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RatingExperience reservationId={id} />;
}
