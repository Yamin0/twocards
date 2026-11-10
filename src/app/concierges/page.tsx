import type { Metadata } from "next";
import { ConciergePage } from "@/components/landing/concierge-page";

export const metadata: Metadata = {
  title: "twocards. | Concierges & RP, chaque apport tracé, chaque commission payée",
  description:
    "Accédez aux disponibilités des meilleurs établissements, confirmez vos clients plus vite et suivez chaque commission jusqu'au paiement.",
};

export default function ConciergesPage() {
  return <ConciergePage />;
}
