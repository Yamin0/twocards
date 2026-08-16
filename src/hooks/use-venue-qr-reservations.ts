"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type VenueQrReservation = {
  id: string;
  category: string;
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
  rating_comment: string | null;
  created_at: string;
};

/* Pas de jointure hotel_qr_codes ici : la RLS la réserve à l'hôtel.
   L'établissement voit le client et la sortie, pas la chambre d'origine. */
const SELECT =
  "id, category, guest_name, guest_phone, reservation_date, " +
  "reservation_time, party_size, notes, status, commission, " +
  "commission_rate, amount_spent, rating, rating_comment, created_at";

/* Réservations adressées à l'établissement connecté — la RLS ne laisse
   passer que celles dont venue_slug pointe vers sa fiche venues. Tenues à
   jour en temps réel ; à défaut, l'état du chargement initial reste. */
export function useVenueQrReservations() {
  const [reservations, setReservations] = useState<
    VenueQrReservation[] | null
  >(null);

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
          setReservations((data as VenueQrReservation[] | null) ?? []);
        });
    };

    load();
    const channel = supabase
      .channel("venue-qr-reservations")
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
