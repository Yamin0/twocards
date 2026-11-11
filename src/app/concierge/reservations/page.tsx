"use client";

import { CalendarDays } from "lucide-react";
import { NotConnected } from "@/components/concierge/not-connected";
import { useT } from "@/lib/i18n/client";

export default function ConciergeReservationsPage() {
  const t = useT();
  return (
    <NotConnected
      icon={CalendarDays}
      title={t("Réservations", "Reservations")}
      description={t(
        "Le suivi de vos réservations, de la demande à la commission, arrivera avec votre lien et votre QR personnels. En attendant, réservez pour vos clients en écrivant à l'établissement.",
        "Tracking your bookings, from request to commission, will come with your personal link and QR code. Until then, book for your guests by messaging the venue."
      )}
    />
  );
}
