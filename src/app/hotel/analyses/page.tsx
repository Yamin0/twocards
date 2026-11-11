"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, Clock, QrCode, ScanLine, Star, TrendingUp, Users } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useHotelSpace } from "@/lib/hotel/store";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  averageRating,
  conversionRate,
  countBy,
  dailySeries,
  hourDistribution,
  isLive,
  monthlySeries,
  qrPerformance,
  reservationCategoryLabel,
  sumBy,
  topN,
  weekdayDistribution,
  weeklySeries,
  windowDelta,
} from "@/lib/hotel/analytics";
import { formatMad, formatNumber, formatPercent, isRoomLabel, isWithinDays, plural } from "@/lib/hotel/format";
import {
  Card,
  EmptyState,
  KpiGrid,
  LinkButton,
  PageHeader,
  PageSkeleton,
  Segmented,
  StatusPill,
  Table,
  Td,
  Th,
  Tr,
  statusLabel,
} from "@/components/app/ui";
import { Bars, RankedBars, RatingStars, Ring, SplitBar } from "@/components/hotel/charts";
import { HotelLoadError, loadFailed } from "@/components/hotel/states";
import { intlLocale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

type Range = "30" | "90" | "365" | "all";

export default function HotelAnalysesPage() {
  const { isLoading: authLoading } = useAuthUser();
  const { qrCodes, reservations, isLoading, failed, reload } = useHotelSpace();
  const [range, setRange] = useState<Range>("90");
  const t = useT();
  const locale = useLocale();
  const fmt1 = (n: number) => n.toLocaleString(intlLocale(locale), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const inRange = useMemo(
    () => (range === "all" ? reservations : reservations.filter((r) => isWithinDays(r.reservation_date, Number(range)))),
    [reservations, range]
  );

  if (authLoading || isLoading) return <PageSkeleton kpis={4} rows={6} />;

  const live = inRange.filter(isLive);
  const scans = qrCodes.reduce((s, q) => s + q.scans, 0);
  const allLive = reservations.filter(isLive);
  const conversion = conversionRate(scans, allLive.length);
  const rating = averageRating(inRange);
  const avgParty = live.length > 0 ? live.reduce((s, r) => s + r.party_size, 0) / live.length : 0;
  const cancelRate = inRange.length > 0 ? (inRange.length - live.length) / inRange.length : 0;
  const spent = live.reduce((s, r) => s + (r.amount_spent ?? 0), 0);
  const commission = live.reduce((s, r) => s + r.commission, 0);
  const delta30 = windowDelta(allLive, 30);
  const daily = dailySeries(allLive.map((r) => r.reservation_date), 14);
  const weekly = weeklySeries(allLive.map((r) => r.reservation_date), 12);
  const monthly = monthlySeries(allLive, 12, (r) => r.amount_spent ?? 0, undefined, locale);
  const byCategory = CATEGORIES.map((label) => ({
    label: reservationCategoryLabel(label, locale),
    value: live.filter((r) => r.category === label).length,
    color: CATEGORY_COLORS[label],
  }));
  const perf = qrPerformance(qrCodes, inRange);
  const roomsPerf = perf.filter((q) => isRoomLabel(q.label));
  const spacesPerf = perf.filter((q) => !isRoomLabel(q.label));
  const roomsScans = roomsPerf.reduce((s, q) => s + q.scans, 0);
  const spacesScans = spacesPerf.reduce((s, q) => s + q.scans, 0);
  const roomsResas = roomsPerf.reduce((s, q) => s + q.liveReservations, 0);
  const spacesResas = spacesPerf.reduce((s, q) => s + q.liveReservations, 0);
  const topVenues = topN(countBy(live, (r) => r.venue_name), 8);
  const bestRated = [...sumBy(inRange.filter((r) => r.rating !== null), (r) => r.venue_name, (r) => r.rating ?? 0).entries()]
    .map(([label, sum]) => {
      const n = inRange.filter((r) => r.rating !== null && r.venue_name === label).length;
      return { label, value: sum / n, sub: t(`${n} ${plural(n, "avis")}`, `${n} ${plural(n, "review", undefined, "en")}`), n };
    })
    .filter((x) => x.n >= 1)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const weekday = weekdayDistribution(live, locale);
  const hours = hourDistribution(live, locale);
  const withTime = live.filter((r) => r.reservation_time).length;
  const ranked = [...perf].sort((a, b) => b.liveReservations - a.liveReservations || b.scans - a.scans);

  const noShow = statusLabel("no-show", locale).toLowerCase();

  return (
    <>
      <PageHeader
        title={t("Analyses", "Analytics")}
        description={t(
          "Scans, réservations, conversion, satisfaction : tout ce qu'il faut pour placer les QR aux bons endroits, proposer les bonnes adresses et suivre vos gains dans le temps.",
          "Scans, reservations, conversion, satisfaction: everything you need to put QR codes in the right spots, offer the right places and track your earnings over time."
        )}
        actions={
          <Segmented<Range>
            label={t("Période", "Period")}
            value={range}
            onChange={setRange}
            options={[
              { value: "30", label: t("30 j", "30 d") },
              { value: "90", label: t("90 j", "90 d") },
              { value: "365", label: t("12 mois", "12 months") },
              { value: "all", label: t("Tout", "All") },
            ]}
          />
        }
      />

      {loadFailed(failed, reservations, qrCodes) ? (
        <HotelLoadError onRetry={reload} />
      ) : (
        <>
      <KpiGrid
        items={[
          { label: t("Réservations", "Reservations"), value: formatNumber(live.length, locale), hint: t(`${inRange.length - live.length} ${plural(inRange.length - live.length, "annulée", "annulées")} ou ${noShow}`, `${inRange.length - live.length} cancelled or ${noShow}`), icon: CalendarDays, tone: "sky", delta: range === "30" ? delta30.ratio : undefined },
          { label: t("Montant généré", "Revenue generated"), value: formatMad(spent, true, locale), hint: t(`${formatMad(commission, true, locale)} de commissions`, `${formatMad(commission, true, locale)} in commissions`), icon: TrendingUp, tone: "amber" },
          { label: t("Taille moyenne", "Average party"), value: avgParty > 0 ? fmt1(avgParty) : "—", hint: t("personnes par réservation", "guests per reservation"), icon: Users, tone: "violet" },
          { label: t("Satisfaction", "Satisfaction"), value: rating.average !== null ? `${fmt1(rating.average)}/5` : "—", hint: t(`${rating.count} ${plural(rating.count, "avis")}`, `${rating.count} ${plural(rating.count, "review", undefined, "en")}`), icon: Star, tone: "emerald" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title={t("Réservations par semaine", "Reservations per week")} description={t("12 dernières semaines, hors annulations", "Last 12 weeks, excluding cancellations")} className="xl:col-span-2">
          <Bars data={weekly} color="bg-link" height={160} />
        </Card>
        <Card title={t("Entonnoir", "Funnel")} description={t("Depuis la création des QR", "Since the QR codes were created")}>
          <div className="flex items-center gap-5">
            <Ring ratio={Math.min(conversion * 4, 1)} size={92} stroke={9}>
              <span className="num text-sm font-bold text-ink">{formatPercent(conversion, 1, locale)}</span>
            </Ring>
            <ul className="num flex-1 space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-ink-2"><ScanLine size={14} strokeWidth={1.75} aria-hidden /> {t("Scans", "Scans")}</span>
                <span className="font-bold text-ink">{formatNumber(scans, locale)}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-ink-2"><CalendarDays size={14} strokeWidth={1.75} aria-hidden /> {t("Demandes", "Requests")}</span>
                <span className="font-bold text-ink">{formatNumber(reservations.length, locale)}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-ink-2"><BarChart3 size={14} strokeWidth={1.75} aria-hidden /> {t("Sorties réalisées", "Completed outings")}</span>
                <span className="font-bold text-ink">{formatNumber(allLive.length, locale)}</span>
              </li>
            </ul>
          </div>
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-3">
            {t(<>Taux d&apos;annulation sur la période : </>, <>Cancellation rate over the period: </>)}
            <span className="num font-bold text-ink">{formatPercent(cancelRate, 0, locale)}</span>.
            {cancelRate > 0.15
              ? t(" Un rappel WhatsApp la veille aide à réduire les absences.", " A WhatsApp reminder the day before helps reduce no-shows.")
              : ""}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title={t("14 derniers jours", "Last 14 days")} description={t("Réservations par jour", "Reservations per day")}>
          <Bars data={daily} color="bg-ok" height={120} />
        </Card>
        <Card title={t("Chambres vs espaces communs", "Rooms vs common areas")} description={t("Où vos clients scannent et réservent", "Where your guests scan and book")}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("Chambres", "Rooms"), scans: roomsScans, resas: roomsResas, n: roomsPerf.length, color: "text-link" },
              { label: t("Espaces communs", "Common areas"), scans: spacesScans, resas: spacesResas, n: spacesPerf.length, color: "text-plum" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-fill p-4">
                <p className={`text-xs font-bold ${s.color}`}>{s.label}</p>
                <p className="num mt-2 text-2xl font-bold text-ink">{formatNumber(s.resas, locale)}</p>
                <p className="num text-xs text-ink-3">
                  {t("réservations", "reservations")} · {formatNumber(s.scans, locale)} {t("scans", "scans")} · {s.n} QR
                </p>
                <p className="num mt-2 text-xs font-bold text-ink-2">
                  {s.scans > 0 ? formatPercent(s.resas / s.scans, 1, locale) : "—"} {t("de conversion", "conversion")}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">
            {spacesScans > roomsScans
              ? t(
                  "Les espaces communs génèrent le plus de scans : un QR bien visible au lobby ou à la piscine vaut plusieurs chambres.",
                  "Common areas generate the most scans: a clearly visible QR code in the lobby or by the pool is worth several rooms."
                )
              : t(
                  "Les chambres génèrent le plus de scans : le chevalet sur la table de nuit fonctionne.",
                  "Rooms generate the most scans: the bedside tent card is working."
                )}
          </p>
        </Card>
        <Card title={t("Mix par catégorie", "Category mix")} description={t("Réservations sur la période", "Reservations over the period")}>
          <SplitBar segments={byCategory} />
          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-2 text-xs font-bold text-ink-3">{t("Montant dépensé par mois", "Amount spent per month")}</p>
            <Bars data={monthly} color="bg-ok" height={90} format={(n) => formatMad(n, true, locale)} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title={t("Jours de sortie", "Outing days")} description={t("Quand vos clients sortent", "When your guests go out")}>
          <Bars data={weekday} color="bg-plum" height={110} highlightLast={false} />
        </Card>
        <Card
          title={t("Moments de la journée", "Time of day")}
          description={
            withTime > 0
              ? t(`${withTime} ${plural(withTime, "réservation")} avec une heure`, `${withTime} ${plural(withTime, "reservation", undefined, "en")} with a time`)
              : t("Aucune heure renseignée", "No times provided")
          }
        >
          <Bars data={hours} color="bg-link" height={110} highlightLast={false} />
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-3">
            <Clock size={13} strokeWidth={1.75} aria-hidden /> {t("Nuit = après 23 h", "Night = after 11 pm")}
          </p>
        </Card>
        <Card title={t("Adresses les mieux notées", "Top-rated places")} description={t("Par vos clients, sur la période", "By your guests, over the period")}>
          {bestRated.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-ink-3">{t("Aucun avis sur la période.", "No reviews over the period.")}</p>
          ) : (
            <ul className="space-y-2.5">
              {bestRated.map((b) => (
                <li key={b.label} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{b.label}</p>
                    <p className="text-xs text-ink-3">{b.sub}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <RatingStars value={b.value} size={12} />
                    <span className="num text-xs font-bold text-ink">{fmt1(b.value)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card title={t("Adresses les plus réservées", "Most-booked places")} description={t("Sur la période", "Over the period")}>
          <RankedBars items={topVenues} color="bg-ok" empty={t("Aucune réservation sur la période.", "No reservations over the period.")} />
        </Card>
        <Card title={t("Performance par emplacement", "Performance by location")} description={t("Scans, réservations et commissions, sur la période", "Scans, reservations and commissions over the period")} className="xl:col-span-2" padded={false}>
          {ranked.length === 0 ? (
            <EmptyState
              compact
              icon={QrCode}
              title={t("Aucun QR code", "No QR codes")}
              description={t(
                "Créez un QR code par chambre pour suivre ce que chaque emplacement produit.",
                "Create one QR code per room to track what each location delivers."
              )}
              action={
                <LinkButton href="/hotel/chambres?nouveau=1" variant="primary" icon={QrCode}>
                  {t("Nouveau QR code", "New QR code")}
                </LinkButton>
              }
            />
          ) : (
            <Table stack>
              <thead>
                <tr>
                  <Th>{t("Emplacement", "Location")}</Th>
                  <Th>{t("Statut", "Status")}</Th>
                  <Th align="right">{t("Scans", "Scans")}</Th>
                  <Th align="right">{t("Réservations", "Reservations")}</Th>
                  <Th align="right">{t("Conversion", "Conversion")}</Th>
                  <Th align="right">{t("Commissions", "Commissions")}</Th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 12).map((q) => (
                  <Tr key={q.id}>
                    <Td head>
                      <Link href={`/hotel/chambres/${q.id}`} className="font-bold text-ink hover:underline">
                        {q.label}
                      </Link>
                    </Td>
                    <Td label={t("Statut", "Status")}>
                      <StatusPill status={q.active ? "actif" : "inactif"} />
                    </Td>
                    <Td label={t("Scans", "Scans")} align="right" className="num" muted>
                      {formatNumber(q.scans, locale)}
                    </Td>
                    <Td label={t("Réservations", "Reservations")} align="right" className="num">
                      {formatNumber(q.liveReservations, locale)}
                    </Td>
                    <Td label={t("Conversion", "Conversion")} align="right" className="num" muted>
                      {q.scans > 0 ? formatPercent(q.conversion, 1, locale) : "—"}
                    </Td>
                    <Td label={t("Commissions", "Commissions")} align="right" className="num whitespace-nowrap font-bold">
                      {q.commission > 0 ? formatMad(q.commission, true, locale) : "—"}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
        </>
      )}
    </>
  );
}
