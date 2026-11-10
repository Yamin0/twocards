import type { Metadata } from "next";
import { HotelPage } from "@/components/landing/hotel-page";

export const metadata: Metadata = {
  title: "twocards. | Hôtels & riads, le service que vos clients demandent le plus",
  description:
    "Offrez à vos clients les tables les plus difficiles de la ville, avec une attribution claire à votre établissement et une rémunération conforme à votre politique interne.",
};

/* Page dédiée et courte : héros vidéo, deux façons de réserver, bande
   photo, gains, FAQ, bandeau. Les pages Établissements et Concierges
   utilisent le même gabarit (ShortAudiencePage). */
export default function HotelsPage() {
  return <HotelPage />;
}
