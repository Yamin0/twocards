"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, Clock, ScanLine, Star, TrendingUp, Users } from "lucide-react";
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
import { KpiGrid, PageHeader, Panel, Segmented, Table, Td, Th, Tr, StatusPill } from "@/components/hotel/ui";
import { Bars, RankedBars, RatingStars, Ring, SplitBar } from "@/components/hotel/charts";
import { PageSkeleton } from "@/components/hotel/skeleton";
import { intlLocale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";

type Range = "30" | "90" | "365" | "all";

export default function HotelAnalysesPage() {
  const { isLoading: authLoading } = useAuthUser();
  const { qrCodes, reservations, isLoading } = useHotelSpace();
  const [range, setRange] = useState<Range>("90");
  const t = useT();
  const locale = useLocale();
  const fmt1 = (n: number) => n.toLocaleString(intlLocale(locale), { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const inRange = useMemo(
    () => (range === "all" ? reservations : reservations.filter((r) => isWithinDays(r.reservation_date, Number(range)))),
    [reservations, range]
  );

  if (authLoading || isLoading) return <PageSkeleton kpis={4} />;

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

  return (
    <>
      <PageHeader
        eyebrow={t("Analyses", "Analytics")}
        title={t("Ce que vos QR codes produisent", "What your QR codes deliver")}
        description={t(
          "Scans, réservations, conversion, satisfaction : tout ce qu'il faut pour placer les QR aux bons endroits, proposer les bonnes adresses et suivre vos gains dans le temps.",
          "Scans, reservations, conversion, satisfaction: everything you need to put QR codes in the right spots, offer the right places and track your earnings over time."
        )}
        actions={
          <Segmented<Range>
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

      <KpiGrid
        items={[
          { label: t("Réservations", "Reservations"), value: formatNumber(live.length, locale), hint: t(`${inRange.length - live.length} ${plural(inRange.length - live.length, "annulée ou no-show", "annulées ou no-show")}`, `${inRange.length - live.length} cancelled or no-show`), icon: CalendarDays, tone: "sky", delta: range === "30" ? delta30.ratio : undefined },
          { label: t("Montant généré", "Revenue generated"), value: formatMad(spent, true, locale), hint: t(`${formatMad(commission, true, locale)} de commissions`, `${formatMad(commission, true, locale)} in commissions`), icon: TrendingUp, tone: "amber" },
          { label: t("Taille moyenne", "Average party"), value: avgParty > 0 ? fmt1(avgParty) : "—", hint: t("personnes par réservation", "guests per reservation"), icon: Users, tone: "violet" },
          { label: t("Satisfaction", "Satisfaction"), value: rating.average !== null ? `${fmt1(rating.average)}/5` : "—", hint: t(`${rating.count} ${plural(rating.count, "avis")}`, `${rating.count} ${plural(rating.count, "review", undefined, "en")}`), icon: Star, tone: "emerald" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title={t("Réservations par semaine", "Reservations per week")} description={t("12 dernières semaines, hors annulations", "Last 12 weeks, excluding cancellations")} className="xl:col-span-2">
          <Bars data={weekly} color="bg-sky-400" height={160} />
        </Panel>
        <Panel title={t("Entonnoir", "Funnel")} description={t("Depuis la création des QR", "Since the QR codes were created")}>
          <div className="flex items-center gap-5">
            <Ring ratio={Math.min(conversion * 4, 1)} size={92} stroke={9} color="#38bdf8">
              <span className="num text-sm font-black text-white">{formatPercent(conversion, 1, locale)}</span>
            </Ring>
            <ul className="num flex-1 space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-white/60"><ScanLine size={14} strokeWidth={1.75} /> Scans</span>
                <span className="font-bold text-white">{formatNumber(scans, locale)}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-white/60"><CalendarDays size={14} strokeWidth={1.75} /> {t("Demandes", "Requests")}</span>
                <span className="font-bold text-white">{formatNumber(reservations.length, locale)}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-white/60"><BarChart3 size={14} strokeWidth={1.75} /> {t("Sorties réalisées", "Completed outings")}</span>
                <span className="font-bold text-white">{formatNumber(allLive.length, locale)}</span>
              </li>
            </ul>
          </div>
          <p className="mt-4 border-t border-white/[0.08] pt-3 text-xs leading-relaxed text-white/50">
            {t(<>Taux d&apos;annulation sur la période : </>, <>Cancellation rate over the period: </>)}
            <span className="num font-bold text-white/80">{formatPercent(cancelRate, 0, locale)}</span>.
            {cancelRate > 0.15
              ? t(" Un rappel WhatsApp la veille réduit nettement les absences.", " A WhatsApp reminder the day before cuts no-shows significantly.")
              : t(" C'est un très bon niveau.", " That's a very good level.")}
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title={t("14 derniers jours", "Last 14 days")} description={t("Réservations par jour", "Reservations per day")}>
          <Bars data={daily} color="bg-emerald-400" height={120} />
        </Panel>
        <Panel title={t("Chambres vs espaces communs", "Rooms vs common areas")} description={t("Où vos clients scannent et réservent", "Where your guests scan and book")}>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: t("Chambres", "Rooms"), scans: roomsScans, resas: roomsResas, n: roomsPerf.length, color: "text-sky-300" },
              { label: t("Espaces communs", "Common areas"), scans: spacesScans, resas: spacesResas, n: spacesPerf.length, color: "text-violet-300" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${s.color}`}>{s.label}</p>
                <p className="num mt-2 text-2xl font-black text-white">{formatNumber(s.resas, locale)}</p>
                <p className="num text-xs text-white/50">
                  {t("réservations", "reservations")} · {formatNumber(s.scans, locale)} scans · {s.n} QR
                </p>
                <p className="num mt-2 text-xs font-bold text-white/70">
                  {s.scans > 0 ? formatPercent(s.resas / s.scans, 1, locale) : "—"} {t("de conversion", "conversion")}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/50">
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
        </Panel>
        <Panel title={t("Mix par catégorie", "Category mix")} description={t("Réservations sur la période", "Reservations over the period")}>
          <SplitBar segments={byCategory} />
          <div className="mt-4 border-t border-white/[0.08] pt-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">{t("Montant dépensé par mois", "Amount spent per month")}</p>
            <Bars data={monthly} color="bg-amber-400" height={90} format={(n) => formatMad(n, true, locale)} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title={t("Jours de sortie", "Outing days")} description={t("Quand vos clients sortent", "When your guests go out")}>
          <Bars data={weekday} color="bg-violet-400" height={110} highlightLast={false} />
        </Panel>
        <Panel
          title={t("Moments de la journée", "Time of day")}
          description={
            withTime > 0
              ? t(`${withTime} ${plural(withTime, "réservation")} avec une heure`, `${withTime} ${plural(withTime, "reservation", undefined, "en")} with a time`)
              : t("Aucune heure renseignée", "No times provided")
          }
        >
          <Bars data={hours} color="bg-sky-400" height={110} highlightLast={false} />
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
            <Clock size={11} strokeWidth={1.75} /> {t("Nuit = après 23 h", "Night = after 11 pm")}
          </p>
        </Panel>
        <Panel title={t("Adresses les mieux notées", "Top-rated places")} description={t("Par vos clients, sur la période", "By your guests, over the period")}>
          {bestRated.length === 0 ? (
            <p className="text-xs text-white/40">{t("Aucun avis sur la période.", "No reviews over the period.")}</p>
          ) : (
            <ul className="space-y-2.5">
              {bestRated.map((b) => (
                <li key={b.label} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{b.label}</p>
                    <p className="text-[11px] text-white/40">{b.sub}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <RatingStars value={b.value} size={11} />
                    <span className="num text-xs font-bold text-white/80">{fmt1(b.value)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title={t("Adresses les plus réservées", "Most-booked places")} description={t("Sur la période", "Over the period")}>
          <RankedBars items={topVenues} color="bg-emerald-400/80" empty={t("Aucune réservation sur la période.", "No reservations over the period.")} />
        </Panel>
        <Panel title={t("Performance par emplacement", "Performance by location")} description={t("Scans, réservations et commissions, sur la période", "Scans, reservations and commissions over the period")} className="xl:col-span-2" padded={false}>
          {ranked.length === 0 ? (
            <p className="px-6 py-8 text-sm text-white/40">{t("Aucun QR code.", "No QR codes.")}</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("Emplacement", "Location")}</Th>
                  <Th>{t("Statut", "Status")}</Th>
                  <Th align="right">Scans</Th>
                  <Th align="right">{t("Résas", "Bookings")}</Th>
                  <Th align="right">Conv.</Th>
                  <Th align="right">Commissions</Th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 12).map((q) => (
                  <Tr key={q.id}>
                    <Td className="font-bold">{q.label}</Td>
                    <Td><StatusPill status={q.active ? "actif" : "inactif"} /></Td>
                    <Td align="right" className="num" muted>{formatNumber(q.scans, locale)}</Td>
                    <Td align="right" className="num">{formatNumber(q.liveReservations, locale)}</Td>
                    <Td align="right" className="num" muted>{q.scans > 0 ? formatPercent(q.conversion, 1, locale) : "—"}</Td>
                    <Td align="right" className="num font-bold text-amber-300">{q.commission > 0 ? formatMad(q.commission, true, locale) : "—"}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>
    </>
  );
}
