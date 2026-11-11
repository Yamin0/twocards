"use client";

import { useEffect, useRef } from "react";
import { useNotify } from "@/components/app/ui";
import { useT } from "@/lib/i18n/client";
import { useHotelReservations } from "@/lib/hotel/store";

/* Prévient quand une nouvelle demande arrive en temps réel, où que l'on
   soit dans l'espace. Le premier chargement n'en déclenche aucune ; la
   pastille du menu Réservations donne ensuite le compte. */
export function NewReservationAlert() {
  const t = useT();
  const notify = useNotify();
  const { reservations, isLoading } = useHotelReservations();
  const known = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (known.current === null) {
      known.current = new Set(reservations.map((r) => r.id));
      return;
    }
    const fresh = reservations.filter((r) => !known.current!.has(r.id));
    for (const r of reservations) known.current.add(r.id);
    if (fresh.length === 0) return;
    const r = fresh[0];
    notify(
      fresh.length === 1
        ? t(
            `Nouvelle demande : ${r.guest_name} · ${r.venue_name}${r.qr_label ? ` · ${r.qr_label}` : ""}`,
            `New request: ${r.guest_name} · ${r.venue_name}${r.qr_label ? ` · ${r.qr_label}` : ""}`
          )
        : t(`${fresh.length} nouvelles demandes`, `${fresh.length} new requests`)
    );
  }, [reservations, isLoading, t, notify]);

  return null;
}
