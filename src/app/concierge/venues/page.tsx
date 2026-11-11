import { redirect } from "next/navigation";

/* L'annuaire des établissements est l'accueil de l'espace concierge. */
export default function ConciergeVenuesPage() {
  redirect("/concierge");
}
