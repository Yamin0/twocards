import type { Metadata } from "next";
import { ConciergePage } from "@/components/landing/concierge-page";
import { pageMetadata } from "@/components/landing/seo";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: [
      "Concierges et RP : chaque apport tracé, chaque commission payée",
      "Concierges and PRs: every referral tracked, every commission paid",
    ],
    description: [
      "Accédez aux disponibilités des meilleurs établissements, confirmez vos clients plus vite et suivez chaque commission jusqu'au paiement.",
      "Access live availability at the best venues, confirm your guests faster and track every commission through to payout.",
    ],
    path: "/concierges",
  });
}

export default function Page() {
  return <ConciergePage />;
}
