"use client";

import { Users } from "lucide-react";
import { NotConnected } from "@/components/concierge/not-connected";
import { useT } from "@/lib/i18n/client";

export default function ConciergeClientsPage() {
  const t = useT();
  return (
    <NotConnected
      icon={Users}
      title={t("Clients", "Guests")}
      description={t(
        "Votre carnet de clients se remplira de lui-même avec vos réservations suivies.",
        "Your guest book will fill itself in from your tracked bookings."
      )}
    />
  );
}
