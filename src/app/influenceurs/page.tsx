import type { Metadata } from "next";
import { InfluencerPage } from "@/components/landing/influencer-page";

export const metadata: Metadata = {
  title: "twocards. | Influenceurs, votre goût a déjà de la valeur",
  description:
    "Vos recommandations circulent déjà. TwoCards les transforme en réservations traçables et en commissions suivies, sans rien changer à votre façon de partager.",
};

/* Page dédiée, dans l'écriture de la page d'accueil : la séquence des
   portes en ouverture, puis l'explication complète sur fond ivoire. Les
   autres pages métiers utilisent ShortAudiencePage. */
export default function InfluenceursPage() {
  return <InfluencerPage />;
}
