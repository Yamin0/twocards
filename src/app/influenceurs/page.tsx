import type { Metadata } from "next";
import { InfluencerPage } from "@/components/landing/influencer-page";
import { pageMetadata } from "@/components/landing/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: [
      "Influenceurs : votre goût a déjà de la valeur",
      "Influencers: your taste already has value",
    ],
    description: [
      "Vos recommandations circulent déjà. TwoCards les transforme en réservations traçables et en commissions suivies, sans rien changer à votre façon de partager.",
      "Your recommendations already travel. TwoCards turns them into trackable reservations and tracked commissions, without changing the way you share.",
    ],
    path: "/influenceurs",
  });
}

export default function Page() {
  return <InfluencerPage />;
}
