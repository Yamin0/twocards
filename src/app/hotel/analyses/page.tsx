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

type Range = "30" | "90" | "365" | "all";

export default function HotelAnalysesPage() {
  const { isLoading: authLoading } = useAuthUser();
  const { qrCodes, reservations, isLoading } = useHotelSpace();
  const [range, setRange] = useState<Range>("90");

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
  const monthly = monthlySeries(allLive, 12, (r) => r.amount_spent ?? 0);
  const byCategory = CATEGORIES.map((label) => ({
    label,
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
      return { label, value: sum / n, sub: `${n} ${plural(n, "avis")}`, n };
    })
    .filter((x) => x.n >= 1)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const weekday = weekdayDistribution(live);
  const hours = hourDistribution(live);
  const withTime = live.filter((r) => r.reservation_time).length;
  const ranked = [...perf].sort((a, b) => b.liveReservations - a.liveReservations || b.scans - a.scans);

  return (
    <>
      <PageHeader
        eyebrow="Analyses"
        title="Ce que vos QR codes produisent"
        description="Scans, réservations, conversion, satisfaction : tout ce qu'il faut pour placer les QR aux bons endroits, proposer les bonnes adresses et suivre vos gains dans le temps."
        actions={
          <Segmented<Range>
            value={range}
            onChange={setRange}
            options={[
              { value: "30", label: "30 j" },
              { value: "90", label: "90 j" },
              { value: "365", label: "12 mois" },
              { value: "all", label: "Tout" },
            ]}
          />
        }
      />

      <KpiGrid
        items={[
          { label: "Réservations", value: formatNumber(live.length), hint: `${inRange.length - live.length} ${plural(inRange.length - live.length, "annulée ou no-show", "annulées ou no-show")}`, icon: CalendarDays, tone: "sky", delta: range === "30" ? delta30.ratio : undefined },
          { label: "Montant généré", value: formatMad(spent, true), hint: `${formatMad(commission, true)} de commissions`, icon: TrendingUp, tone: "amber" },
          { label: "Taille moyenne", value: avgParty > 0 ? avgParty.toFixed(1).replace(".", ",") : "—", hint: "personnes par réservation", icon: Users, tone: "violet" },
          { label: "Satisfaction", value: rating.average !== null ? `${rating.average.toFixed(1).replace(".", ",")}/5` : "—", hint: `${rating.count} ${plural(rating.count, "avis")}`, icon: Star, tone: "emerald" },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Réservations par semaine" description="12 dernières semaines, hors annulations" className="xl:col-span-2">
          <Bars data={weekly} color="bg-sky-400" height={160} />
        </Panel>
        <Panel title="Entonnoir" description="Depuis la création des QR">
          <div className="flex items-center gap-5">
            <Ring ratio={Math.min(conversion * 4, 1)} size={92} stroke={9} color="#38bdf8">
              <span className="num text-sm font-black text-white">{formatPercent(conversion, 1)}</span>
            </Ring>
            <ul className="num flex-1 space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-white/60"><ScanLine size={14} strokeWidth={1.75} /> Scans</span>
                <span className="font-bold text-white">{formatNumber(scans)}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-white/60"><CalendarDays size={14} strokeWidth={1.75} /> Demandes</span>
                <span className="font-bold text-white">{formatNumber(reservations.length)}</span>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-white/60"><BarChart3 size={14} strokeWidth={1.75} /> Sorties réalisées</span>
                <span className="font-bold text-white">{formatNumber(allLive.length)}</span>
              </li>
            </ul>
          </div>
          <p className="mt-4 border-t border-white/[0.08] pt-3 text-xs leading-relaxed text-white/50">
            Taux d&apos;annulation sur la période : <span className="num font-bold text-white/80">{formatPercent(cancelRate, 0)}</span>.
            {cancelRate > 0.15 ? " Un rappel WhatsApp la veille réduit nettement les absences." : " C'est un très bon niveau."}
          </p>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="14 derniers jours" description="Réservations par jour">
          <Bars data={daily} color="bg-emerald-400" height={120} />
        </Panel>
        <Panel title="Chambres vs espaces communs" description="Où vos clients scannent et réservent">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Chambres", scans: roomsScans, resas: roomsResas, n: roomsPerf.length, color: "text-sky-300" },
              { label: "Espaces communs", scans: spacesScans, resas: spacesResas, n: spacesPerf.length, color: "text-violet-300" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className={`text-[11px] font-bold uppercase tracking-[0.14em] ${s.color}`}>{s.label}</p>
                <p className="num mt-2 text-2xl font-black text-white">{formatNumber(s.resas)}</p>
                <p className="num text-xs text-white/50">
                  réservations · {formatNumber(s.scans)} scans · {s.n} QR
                </p>
                <p className="num mt-2 text-xs font-bold text-white/70">
                  {s.scans > 0 ? formatPercent(s.resas / s.scans, 1) : "—"} de conversion
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/50">
            {spacesScans > roomsScans
              ? "Les espaces communs génèrent le plus de scans : un QR bien visible au lobby ou à la piscine vaut plusieurs chambres."
              : "Les chambres génèrent le plus de scans : le chevalet sur la table de nuit fonctionne."}
          </p>
        </Panel>
        <Panel title="Mix par catégorie" description="Réservations sur la période">
          <SplitBar segments={byCategory} />
          <div className="mt-4 border-t border-white/[0.08] pt-3">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">Montant dépensé par mois</p>
            <Bars data={monthly} color="bg-amber-400" height={90} format={(n) => formatMad(n, true)} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Jours de sortie" description="Quand vos clients sortent">
          <Bars data={weekday} color="bg-violet-400" height={110} highlightLast={false} />
        </Panel>
        <Panel title="Moments de la journée" description={withTime > 0 ? `${withTime} ${plural(withTime, "réservation")} avec une heure` : "Aucune heure renseignée"}>
          <Bars data={hours} color="bg-sky-400" height={110} highlightLast={false} />
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
            <Clock size={11} strokeWidth={1.75} /> Nuit = après 23 h
          </p>
        </Panel>
        <Panel title="Adresses les mieux notées" description="Par vos clients, sur la période">
          {bestRated.length === 0 ? (
            <p className="text-xs text-white/40">Aucun avis sur la période.</p>
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
                    <span className="num text-xs font-bold text-white/80">{b.value.toFixed(1).replace(".", ",")}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Adresses les plus réservées" description="Sur la période">
          <RankedBars items={topVenues} color="bg-emerald-400/80" empty="Aucune réservation sur la période." />
        </Panel>
        <Panel title="Performance par emplacement" description="Scans, réservations et commissions, sur la période" className="xl:col-span-2" padded={false}>
          {ranked.length === 0 ? (
            <p className="px-6 py-8 text-sm text-white/40">Aucun QR code.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Emplacement</Th>
                  <Th>Statut</Th>
                  <Th align="right">Scans</Th>
                  <Th align="right">Résas</Th>
                  <Th align="right">Conv.</Th>
                  <Th align="right">Commissions</Th>
                </tr>
              </thead>
              <tbody>
                {ranked.slice(0, 12).map((q) => (
                  <Tr key={q.id}>
                    <Td className="font-bold">{q.label}</Td>
                    <Td><StatusPill status={q.active ? "actif" : "inactif"} /></Td>
                    <Td align="right" className="num" muted>{formatNumber(q.scans)}</Td>
                    <Td align="right" className="num">{formatNumber(q.liveReservations)}</Td>
                    <Td align="right" className="num" muted>{q.scans > 0 ? formatPercent(q.conversion, 1) : "—"}</Td>
                    <Td align="right" className="num font-bold text-amber-300">{q.commission > 0 ? formatMad(q.commission, true) : "—"}</Td>
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
