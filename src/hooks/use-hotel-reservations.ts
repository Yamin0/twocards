"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type HotelReservation = {
  id: string;
  category: string;
  venue_name: string;
  guest_name: string;
  guest_phone: string;
  reservation_date: string;
  reservation_time: string | null;
  party_size: number;
  notes: string | null;
  status: "en attente" | "confirmée" | "annulée";
  commission: number;
  commission_rate: number;
  amount_spent: number | null;
  rating: number | null;
  created_at: string;
  /* Libellé du QR scanné (« Chambre 101 »). Null si le QR a été supprimé. */
  qr_label: string | null;
};

const SELECT =
  "id, category, venue_name, guest_name, guest_phone, reservation_date, " +
  "reservation_time, party_size, notes, status, commission, commission_rate, " +
  "amount_spent, rating, created_at, hotel_qr_codes(label)";

type Row = Omit<HotelReservation, "qr_label"> & {
  hotel_qr_codes: { label: string } | { label: string }[] | null;
};

const toReservation = ({ hotel_qr_codes, ...r }: Row): HotelReservation => ({
  ...r,
  qr_label: Array.isArray(hotel_qr_codes)
    ? (hotel_qr_codes[0]?.label ?? null)
    : (hotel_qr_codes?.label ?? null),
});

/* Réservations de l'hôtel — la RLS ne laisse passer que celles de ses propres
   QR codes. Triées de la plus récente à la plus ancienne, et tenues à jour en
   temps réel : un INSERT ou un UPDATE en base (nouveau scan client, montant
   renseigné) recharge la liste sans rafraîchir la page. Si Realtime est
   indisponible, la liste reste celle du chargement initial. */
export function useHotelReservations() {
  const [reservations, setReservations] = useState<HotelReservation[] | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const load = () => {
      supabase
        .from("qr_reservations")
        .select(SELECT)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (cancelled) return;
          const rows = (data as unknown as Row[] | null) ?? [];
          setReservations(rows.map(toReservation));
        });
    };

    load();
    const channel = supabase
      .channel("hotel-qr-reservations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "qr_reservations" },
        load
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { reservations, isLoading: reservations === null };
}
