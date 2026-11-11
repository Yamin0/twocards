import type { Metadata } from "next";
import { HotelPage } from "@/components/landing/hotel-page";
import { pageMetadata } from "@/components/landing/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: [
      "Hôtels et riads : le service que vos clients demandent le plus",
      "Hotels and riads: the service your guests ask for most",
    ],
    description: [
      "Offrez à vos clients les tables les plus difficiles de la ville, avec une attribution claire à votre établissement et une rémunération conforme à votre politique interne.",
      "Give your guests the hardest tables in town, with clear attribution to your property and rewards that follow your internal policy.",
    ],
    path: "/hotels",
  });
}

/* Les quatre pages métiers partagent un seul gabarit (ShortAudiencePage). */
export default function Page() {
  return <HotelPage />;
}
