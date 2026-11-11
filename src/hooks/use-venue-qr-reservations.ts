"use client";

import { useCallback, useEffect, useState } from "react";
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
  /* Prestation choisie par le client (activités et services). */
  service_name: string | null;
  /* Hôtel qui a envoyé le client (canal QR), recopié à la création. */
  referrer_id: string | null;
  referrer_name: string | null;
  status: "en attente" | "confirmée" | "annulée" | "no-show";
  commission: number;
  commission_rate: number;
  amount_spent: number | null;
  amount_source: "manuel" | "pos";
  source: "qr" | "portal" | "venue";
  table_id: number | null;
  arrived_at: string | null;
  rating: number | null;
  rating_comment: string | null;
  created_at: string;
};

/* Pas de jointure hotel_qr_codes ici : la RLS la réserve à l'hôtel.
   L'établissement voit le client et la sortie, pas la chambre d'origine. */
const SELECT =
  "id, category, guest_name, guest_phone, reservation_date, " +
  "reservation_time, party_size, notes, service_name, referrer_id, referrer_name, status, commission, " +
  "commission_rate, amount_spent, amount_source, source, table_id, " +
  "arrived_at, rating, rating_comment, created_at";

/* Réservations adressées à l'établissement connecté — la RLS ne laisse
   passer que celles dont venue_slug pointe vers sa fiche venues. Tenues à
   jour en temps réel. Un échec du premier chargement est signalé (`error`)
   au lieu de passer pour une liste vide ; `reload` relance la lecture. */
export function useVenueQrReservations() {
  const [reservations, setReservations] = useState<VenueQrReservation[] | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    const load = () => {
      supabase
        .from("qr_reservations")
        .select(SELECT)
        .order("created_at", { ascending: false })
        .then(({ data, error: err }) => {
          if (cancelled) return;
          if (err) {
            /* Une relecture temps réel ratée ne vide pas l'écran. */
            setError(true);
            return;
          }
          setError(false);
          setReservations((data as unknown as VenueQrReservation[] | null) ?? []);
        });
    };

    load();
    const channel = supabase
      .channel(`venue-qr-reservations-${++channelSeq}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "qr_reservations" }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  return {
    reservations,
    isLoading: reservations === null && !error,
    error: error && reservations === null,
    reload,
  };
}

/* Deux écrans montés ensemble (accueil et coque) ne doivent pas partager un
   nom de canal : le client Supabase est un singleton. */
let channelSeq = 0;
