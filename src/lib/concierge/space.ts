"use client";

import { useCallback, useMemo } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { isLive } from "@/lib/hotel/analytics";
import { useHotelSpace, type HotelQrCode, type HotelReservation } from "@/lib/hotel/store";
import { guestUrl } from "@/lib/qr";

/* Données de l'espace concierge.

   Un concierge, un RP ou un influenceur est un apporteur d'affaires : il
   possède des liens (table hotel_qr_codes, un par canal), un menu client
   (hotel_profiles) et lit les réservations passées par ses liens
   (qr_reservations). Les règles de la base ne regardent que le
   propriétaire de la ligne, jamais le rôle : le store de l'espace hôtel
   sert donc tel quel, sans requête ni écriture différente. Seul le
   vocabulaire change — « lien », jamais « chambre ». */

export type ConciergeLink = HotelQrCode;

export function useConciergeSpace() {
  const auth = useAuthUser();
  const space = useHotelSpace();
  const { profile, qrCodes } = space;

  /* Nom affiché en tête du menu client : celui réglé dans Paramètres, sinon
     le nom du compte. */
  const displayName = profile.hotel_name || auth.fullName || null;
  const city = profile.city || auth.city || null;

  /* Adresse publique d'un lien. Le nom et la ville n'y figurent qu'en
     secours, tant qu'ils ne sont pas enregistrés dans le menu : une fois
     réglés, le lien partagé reste court. */
  const linkOf = useCallback(
    (link: Pick<ConciergeLink, "code">) =>
      guestUrl(
        link.code,
        profile.hotel_name ? null : auth.fullName,
        profile.city ? null : auth.city
      ),
    [profile.hotel_name, profile.city, auth.fullName, auth.city]
  );

  /* Lien mis en avant : le plus ancien encore actif, sinon le plus ancien. */
  const mainLink = useMemo(
    () => qrCodes.find((q) => q.active) ?? qrCodes[0] ?? null,
    [qrCodes]
  );

  return {
    ...space,
    isLoading: auth.isLoading || space.isLoading,
    fullName: auth.fullName,
    displayName,
    city,
    linkOf,
    mainLink,
  };
}

/* ─── Suivi d'une réservation, de la demande à la commission ───────────────
   Quatre étapes, toutes lues en base : la demande existe, l'établissement
   l'a confirmée (status), il a saisi l'addition (amount_spent), la
   commission en découle (commission, calculée par la base). */

export type Stage = "demande" | "confirmee" | "addition" | "commission";
export const STAGES: readonly Stage[] = ["demande", "confirmee", "addition", "commission"];

/** Dernière étape atteinte ; null si la réservation est annulée ou no-show. */
export function stageOf(r: HotelReservation): Stage | null {
  if (!isLive(r)) return null;
  if (r.amount_spent !== null) return r.commission > 0 ? "commission" : "addition";
  return r.status === "confirmée" ? "confirmee" : "demande";
}
