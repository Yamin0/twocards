import type { Metadata } from "next";
import { RatingExperience } from "./rating-experience";

/* Page publique de notation post-sortie. Le lien est envoyé au client par
   l'établissement ou twocards ; l'UUID de la réservation sert de jeton. */
export const metadata: Metadata = {
  title: "Votre avis | twocards.",
  description: "Notez votre sortie en quelques secondes.",
  robots: { index: false, follow: false },
};

export default async function RatingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RatingExperience reservationId={id} />;
}
