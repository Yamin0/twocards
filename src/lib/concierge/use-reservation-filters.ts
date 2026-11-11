"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addDays, isWithinDays, isoDay, todayIso } from "@/lib/hotel/format";
import { oneOf } from "@/lib/hotel/params";
import type { HotelReservation, ReservationStatus } from "@/lib/hotel/store";
import { agendaOrder } from "@/lib/hotel/today";
import { PERIODS, type Period, type StatusFilter } from "@/lib/hotel/use-reservation-filters";

/* Filtres de la page Réservations du concierge. Contrairement à l'espace
   hôtel, tout vit dans l'URL : ?statut=, ?periode=, ?lien=, ?q= et ?id=
   (fiche ouverte). Recharger, revenir en arrière ou partager l'adresse
   redonne la même liste.

   ?statut= porte une clé courte ; le filtre compare la valeur de la base
   (française, jamais traduite). Une valeur inconnue retombe sur « tout ». */
const STATUS_PARAM = {
  attente: "en attente",
  confirmee: "confirmée",
  annulee: "annulée",
  "no-show": "no-show",
} as const satisfies Record<string, ReservationStatus>;
type StatusKey = keyof typeof STATUS_PARAM;
const STATUS_KEYS = Object.keys(STATUS_PARAM) as StatusKey[];
const keyOfStatus = (s: ReservationStatus) => STATUS_KEYS.find((k) => STATUS_PARAM[k] === s) ?? null;

export function useConciergeReservationFilters(reservations: HotelReservation[]) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const statusKey = oneOf<StatusKey | "">(params.get("statut"), STATUS_KEYS, "");
  const status: StatusFilter = statusKey ? STATUS_PARAM[statusKey] : "toutes";
  const period: Period = oneOf(params.get("periode"), PERIODS, "tout");
  const linkId = params.get("lien");
  const openId = params.get("id");
  const urlQuery = params.get("q") ?? "";

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  /* La recherche se tape dans un état local (aucune lettre perdue pendant
     la navigation) et rejoint l'URL après une courte pause. */
  const [search, setSearch] = useState(urlQuery);
  const [seenQuery, setSeenQuery] = useState(urlQuery);
  /* Dernière valeur écrite par ce champ : son retour par l'URL ne doit pas
     écraser ce qui a été tapé entre-temps. */
  const [written, setWritten] = useState(urlQuery);
  if (urlQuery !== seenQuery) {
    setSeenQuery(urlQuery);
    /* L'URL a changé d'elle-même (Retour, lien) : le champ suit. */
    if (urlQuery !== written) {
      setWritten(urlQuery);
      setSearch(urlQuery);
    }
  }
  useEffect(() => {
    const wanted = search.trim();
    if (wanted === urlQuery) return;
    const timer = setTimeout(() => {
      setWritten(wanted);
      const next = new URLSearchParams(window.location.search);
      if (wanted) next.set("q", wanted);
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [search, urlQuery, pathname, router]);

  const today = todayIso();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const digits = q.replace(/\s/g, "");
    const within = (r: HotelReservation, days: number) =>
      isWithinDays(r.reservation_date, days) ||
      (r.reservation_date > today && r.reservation_date <= isoDay(addDays(new Date(), days)));
    return reservations
      .filter((r) => {
        if (status !== "toutes" && r.status !== status) return false;
        if (linkId && r.qr_code_id !== linkId) return false;
        if (period === "aujourdhui" && r.reservation_date !== today) return false;
        if (period === "avenir" && r.reservation_date < today) return false;
        if (period === "7j" && !within(r, 7)) return false;
        if (period === "30j" && !within(r, 30)) return false;
        if (
          q &&
          !r.guest_name.toLowerCase().includes(q) &&
          !r.venue_name.toLowerCase().includes(q) &&
          !(r.qr_label ?? "").toLowerCase().includes(q) &&
          !(digits && r.guest_phone.replace(/\s/g, "").includes(digits))
        )
          return false;
        return true;
      })
      .sort(agendaOrder(today));
  }, [reservations, status, linkId, period, search, today]);

  const hasFilters = status !== "toutes" || period !== "tout" || Boolean(linkId) || Boolean(search.trim());

  return {
    today,
    status,
    setStatus: (s: StatusFilter) => setParams({ statut: s === "toutes" ? null : keyOfStatus(s) }),
    period,
    setPeriod: (p: Period) => setParams({ periode: p === "tout" ? null : p }),
    linkId,
    setLinkId: (id: string | null) => setParams({ lien: id }),
    search,
    setSearch,
    filtered,
    hasFilters,
    reset: () => {
      setSearch("");
      setParams({ statut: null, periode: null, lien: null, q: null });
    },
    open: openId ? (reservations.find((r) => r.id === openId) ?? null) : null,
    setOpenId: (id: string | null) => setParams({ id }),
  };
}
