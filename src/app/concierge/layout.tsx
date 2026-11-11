"use client";

import { Plus } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { InfoNote } from "@/components/app/ui";
import { NewReservationAlert } from "@/components/hotel/new-reservation-alert";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { useHotelProfile, useHotelQrCodes, useHotelReservations } from "@/lib/hotel/store";
import { plural } from "@/lib/hotel/format";
import { useT } from "@/lib/i18n/client";

/* Espace concierge : la coque commune, le nom affiché et le nombre de liens
   actifs, les pastilles (demandes en attente, messages non lus), le bouton
   « Nouveau lien » et l'alerte d'une nouvelle demande. Les données sont
   celles du store partagé avec l'espace hôtel (mêmes tables, mêmes règles :
   chacun ne lit que ses lignes). */
export default function ConciergeLayout({ children }: { children: React.ReactNode }) {
  const t = useT();
  const unreadMessages = useUnreadMessages();
  const { fullName } = useAuthUser();
  const { profile } = useHotelProfile();
  const { reservations, failed: resFailed } = useHotelReservations();
  const { qrCodes, failed: qrFailed } = useHotelQrCodes();

  const pending = reservations.filter((r) => r.status === "en attente").length;
  const activeLinks = qrCodes.filter((q) => q.active).length;
  const name = profile.hotel_name || fullName;

  return (
    <AppShell
      role="concierge"
      workspace={
        name
          ? {
              name,
              meta: t(
                `${activeLinks} ${plural(activeLinks, "lien actif", "liens actifs")}`,
                `${activeLinks} active ${plural(activeLinks, "link", undefined, "en")}`
              ),
            }
          : undefined
      }
      cta={{ href: "/concierge/liens?nouveau=1", label: t("Nouveau lien", "New link"), icon: Plus }}
      badges={{ "/concierge/reservations": pending, "/concierge/messages": unreadMessages }}
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
