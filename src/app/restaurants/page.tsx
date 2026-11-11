import type { Metadata } from "next";
import { EstablishmentPage } from "@/components/landing/establishment-page";
import { pageMetadata } from "@/components/landing/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: [
      "Restaurants et établissements : remplissez vos tables à vos conditions",
      "Restaurants and venues: fill your tables on your terms",
    ],
    description: [
      "TwoCards distribue votre inventaire aux concierges et RP vérifiés. Vous gardez le contrôle de chaque table, chaque commission est calculée sur du revenu vérifié.",
      "TwoCards distributes your availability to verified concierges and PRs. You keep control of every table, and every commission is calculated on verified revenue.",
    ],
    path: "/restaurants",
  });
}

export default function Page() {
  return <EstablishmentPage />;
}
