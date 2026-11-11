"use client";

import { Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { InfoNote } from "@/components/app/ui";
import { NewReservationAlert } from "@/components/hotel/new-reservation-alert";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useT } from "@/lib/i18n/client";
import { useHotelProfile, useHotelQrCodes, useHotelReservations } from "@/lib/hotel/store";
import { todayIso } from "@/lib/hotel/format";

/* Espace hôtel : la coque commune, le nom de l'hôtel et son état du jour,
   la pastille des demandes en attente et l'alerte d'une nouvelle demande. */
export default function HotelLayout({ children }: { children: React.ReactNode }) {
  const t = useT();
  const { venueName } = useAuthUser();
  const { profile } = useHotelProfile();
  const { reservations, failed: resFailed } = useHotelReservations();
  const { qrCodes, failed: qrFailed } = useHotelQrCodes();

  const pending = reservations.filter((r) => r.status === "en attente").length;
  const today = todayIso();
  const todayCount = reservations.filter(
    (r) => r.reservation_date === today && r.status !== "annulée"
  ).length;
  const activeQr = qrCodes.filter((q) => q.active).length;

  return (
    <AppShell
      role="hotel"
      workspace={{
        name: profile.hotel_name || venueName || t("Mon hôtel", "My hotel"),
        meta:
          t(`${activeQr} QR actifs`, `${activeQr} active QR`) +
          (todayCount > 0
            ? t(
                ` · ${todayCount} sortie${todayCount > 1 ? "s" : ""} ce jour`,
                ` · ${todayCount} outing${todayCount === 1 ? "" : "s"} today`
              )
            : ""),
      }}
      cta={{ href: "/hotel/chambres?nouveau=1", label: t("Nouveau QR code", "New QR code"), icon: Plus }}
      badges={{ "/hotel/reservations": pending }}
      banner={
        (resFailed || qrFailed) && (
          <div className="print-hide">
            <InfoNote tone="danger">
              {t(
                "Impossible de charger vos données. Vérifiez votre connexion, puis rechargez la page.",
                "We couldn't load your data. Check your connection, then reload the page."
              )}{" "}
              <button type="button" onClick={() => window.location.reload()} className="font-bold text-danger underline">
                {t("Recharger", "Reload")}
              </button>
            </InfoNote>
          </div>
        )
      }
    >
      {children}
      <NewReservationAlert />
    </AppShell>
  );
}
