"use client";

import { BarChart3 } from "lucide-react";
import { NotConnected } from "@/components/concierge/not-connected";
import { useT } from "@/lib/i18n/client";

export default function ConciergeStatsPage() {
  const t = useT();
  return (
    <NotConnected
      icon={BarChart3}
      title={t("Statistiques", "Stats")}
      description={t(
        "Les statistiques seront calculées sur vos réservations réelles, jamais sur des exemples.",
        "Stats will be worked out from your real bookings, never from samples."
      )}
    />
  );
}
