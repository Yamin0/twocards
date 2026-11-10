import type { Metadata } from "next";
import { EstablishmentPage } from "@/components/landing/establishment-page";

export const metadata: Metadata = {
  title: "twocards. | Restaurants, remplissez vos tables à vos conditions",
  description:
    "TwoCards distribue votre inventaire aux concierges et RP vérifiés. Vous gardez le contrôle de chaque table, chaque commission est calculée sur du revenu vérifié.",
};

export default function RestaurantsPage() {
  return <EstablishmentPage />;
}
