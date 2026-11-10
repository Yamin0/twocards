import type { Metadata } from "next";
import { InfluencerPage } from "@/components/landing/influencer-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t(
      "twocards. | Influenceurs, votre goût a déjà de la valeur",
      "twocards. | Influencers, your taste already has value",
    ),
    description: t(
      "Vos recommandations circulent déjà. TwoCards les transforme en réservations traçables et en commissions suivies, sans rien changer à votre façon de partager.",
      "Your recommendations already travel. TwoCards turns them into trackable reservations and tracked commissions, without changing the way you share.",
    ),
  };
}

/* Page dédiée, dans l'écriture de la page d'accueil : la séquence des
   portes en ouverture, puis l'explication complète sur fond ivoire. Les
   autres pages métiers utilisent ShortAudiencePage. */
export default function InfluenceursPage() {
  return <InfluencerPage />;
}
