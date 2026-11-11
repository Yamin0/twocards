"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useVenueQrReservations } from "@/hooks/use-venue-qr-reservations";
import { useIntlLocale, useLocale } from "@/lib/i18n/client";
import {
  computeBuckets,
  computeChannels,
  computeStats,
  computeWeekdays,
  countedOnly,
  exportCsv,
  filterByPeriod,
  type PeriodKey,
} from "./analytics-lib";

/* Données de la page Analyses : les réservations de l'établissement
   (lecture et temps réel par useVenueQrReservations), filtrées sur la
   période choisie, puis tous les agrégats. Aucune écriture. */
export function useVenueAnalytics() {
  const locale = useLocale();
  const intl = useIntlLocale();
  const { isLoading: authLoading } = useAuthUser();
  const { reservations, isLoading: loadingData, error, reload } = useVenueQrReservations();
  const [period, setPeriod] = useState<PeriodKey>("30j");

  const filtered = useMemo(
    () => (reservations ? filterByPeriod(reservations, period) : []),
    [reservations, period]
  );
  const counted = useMemo(() => countedOnly(filtered), [filtered]);
  const stats = useMemo(() => computeStats(filtered, counted), [filtered, counted]);
  const buckets = useMemo(() => computeBuckets(counted, period, intl), [counted, period, intl]);
  const channels = useMemo(() => computeChannels(filtered), [filtered]);
  const weekdays = useMemo(() => computeWeekdays(counted, locale), [counted, locale]);

  const exportPeriod = useCallback(() => {
    const rows = [...filtered].sort((a, b) => (a.reservation_date < b.reservation_date ? 1 : -1));
    exportCsv(rows, period, locale);
  }, [filtered, period, locale]);

  return {
    isLoading: authLoading || loadingData,
    error,
    reload,
    /* Nombre total de réservations, toutes périodes confondues. */
    totalCount: reservations?.length ?? 0,
    period,
    setPeriod,
    filtered,
    stats,
    buckets,
    channels,
    weekdays,
    exportPeriod,
  };
}
