import type { Metadata } from "next";
import { HotelPage } from "@/components/landing/hotel-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t(
      "twocards. | Hôtels & riads, le service que vos clients demandent le plus",
      "twocards. | Hotels & riads, the service your guests ask for most",
    ),
    description: t(
      "Offrez à vos clients les tables les plus difficiles de la ville, avec une attribution claire à votre établissement et une rémunération conforme à votre politique interne.",
      "Give your guests the hardest tables in town, with clear attribution to your property and rewards that follow your internal policy.",
    ),
  };
}

/* Page dédiée et courte : héros vidéo, deux façons de réserver, bande
   photo, gains, FAQ, bandeau. Les pages Établissements et Concierges
   utilisent le même gabarit (ShortAudiencePage). */
export default function HotelsPage() {
  return <HotelPage />;
}
