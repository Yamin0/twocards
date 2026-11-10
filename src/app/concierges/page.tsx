import type { Metadata } from "next";
import { ConciergePage } from "@/components/landing/concierge-page";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t(
      "twocards. | Concierges & RP, chaque apport tracé, chaque commission payée",
      "twocards. | Concierges & PR, every referral tracked, every commission paid",
    ),
    description: t(
      "Accédez aux disponibilités des meilleurs établissements, confirmez vos clients plus vite et suivez chaque commission jusqu'au paiement.",
      "Access live availability at the best venues, confirm your guests faster and track every commission through to payout.",
    ),
  };
}

export default function ConciergesPage() {
  return <ConciergePage />;
}
