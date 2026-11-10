import type { Metadata } from "next";
import { EstablishmentPage } from "@/components/landing/establishment-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t(
      "twocards. | Restaurants, remplissez vos tables à vos conditions",
      "twocards. | Restaurants, fill your tables on your terms",
    ),
    description: t(
      "TwoCards distribue votre inventaire aux concierges et RP vérifiés. Vous gardez le contrôle de chaque table, chaque commission est calculée sur du revenu vérifié.",
      "TwoCards distributes your availability to verified concierges and PRs. You keep control of every table, and every commission is calculated on verified revenue.",
    ),
  };
}

export default function RestaurantsPage() {
  return <EstablishmentPage />;
}
