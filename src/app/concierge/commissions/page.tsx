"use client";

import { Coins } from "lucide-react";
import { NotConnected } from "@/components/concierge/not-connected";
import { useT } from "@/lib/i18n/client";

export default function ConciergeCommissionsPage() {
  const t = useT();
  return (
    <NotConnected
      icon={Coins}
      title={t("Commissions", "Commissions")}
      description={t(
        "Vos commissions s'afficheront ici dès que vos réservations seront suivies par votre lien personnel.",
        "Your commissions will show here once your bookings are tracked through your personal link."
      )}
    />
  );
}
