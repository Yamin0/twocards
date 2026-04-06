"use client";

import { TrendingUp, ArrowUpRight, ArrowDownRight, Users, Wallet, CalendarDays, CheckCircle } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";

const DEMO_MONTHLY_DATA = [
  { month: "Jan.", covers: 98, commission: "28 400", growth: 0 },
  { month: "Fév.", covers: 112, commission: "33 200", growth: 14 },
  { month: "Mar.", covers: 134, commission: "41 800", growth: 20 },
  { month: "Avr.", covers: 156, commission: "48 600", growth: 16 },
];

const DEMO_BAR_CHART = [
  { label: "Jan.", value: 98, max: 156 },
  { label: "Fév.", value: 112, max: 156 },
  { label: "Mar.", value: 134, max: 156 },
  { label: "Avr.", value: 156, max: 156 },
];

const DEMO_VENUE_BREAKDOWN = [
  { venue: "Le Comptoir Darna", covers: 52, commission: "16 200 MAD", percentage: 33 },
  { venue: "Le Lotus Club", covers: 44, commission: "13 800 MAD", percentage: 28 },
  { venue: "Sky Bar Casa", covers: 35, commission: "11 000 MAD", percentage: 23 },
  { venue: "Pacha Marrakech", covers: 25, commission: "7 600 MAD", percentage: 16 },
];

const EMPTY_MONTHLY: typeof DEMO_MONTHLY_DATA = [];
const EMPTY_BAR_CHART: typeof DEMO_BAR_CHART = [];
const EMPTY_VENUE_BREAKDOWN: typeof DEMO_VENUE_BREAKDOWN = [];

export default function ConciergeStatsPage() {
  const { isDemoConcierge, isLoading } = useAuthUser();

  if (isLoading) return <ConciergeSkeleton />;

  const monthlyData = isDemoConcierge ? DEMO_MONTHLY_DATA : EMPTY_MONTHLY;
  const barChart = isDemoConcierge ? DEMO_BAR_CHART : EMPTY_BAR_CHART;
  const venueBreakdown = isDemoConcierge ? DEMO_VENUE_BREAKDOWN : EMPTY_VENUE_BREAKDOWN;

  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold text-on-background font-[family-name:var(--font-manrope)]">
          Statistiques
        </h1>
        <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)] mt-0.5">
          Analysez votre performance et croissance
        </p>
      </div>

      {/* Stats cards */}
      <div className="px-4 sm:px-6 pb-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-outline-variant/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users size={16} strokeWidth={1.5} className="text-primary" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-on-background font-[family-name:var(--font-manrope)]">
            {isDemoConcierge ? "156" : "0"}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)] mt-1">
            Couverts ce mois
          </p>
          {isDemoConcierge && (
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight size={12} strokeWidth={2} className="text-emerald-600" />
              <span className="text-[11px] font-semibold text-emerald-600">+16%</span>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wallet size={16} strokeWidth={1.5} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-on-background font-[family-name:var(--font-manrope)]">
            {isDemoConcierge ? "486K" : "0"}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)] mt-1">
            CA généré (MAD)
          </p>
          {isDemoConcierge && (
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight size={12} strokeWidth={2} className="text-emerald-600" />
              <span className="text-[11px] font-semibold text-emerald-600">+22%</span>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CalendarDays size={16} strokeWidth={1.5} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-on-background font-[family-name:var(--font-manrope)]">
            {isDemoConcierge ? "48.6K" : "0"}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)] mt-1">
            Commissions (MAD)
          </p>
          {isDemoConcierge && (
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight size={12} strokeWidth={2} className="text-emerald-600" />
              <span className="text-[11px] font-semibold text-emerald-600">+16%</span>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-outline-variant/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CheckCircle size={16} strokeWidth={1.5} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-on-background font-[family-name:var(--font-manrope)]">
            {isDemoConcierge ? "87%" : "\u2014"}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)] mt-1">
            Taux confirmation
          </p>
          {isDemoConcierge && (
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight size={12} strokeWidth={2} className="text-emerald-600" />
              <span className="text-[11px] font-semibold text-emerald-600">+3%</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart */}
        <div className="bg-white rounded-xl border border-outline-variant/10 p-5">
          <h3 className="text-sm font-bold text-on-background font-[family-name:var(--font-manrope)] mb-6">
            Évolution des couverts
          </h3>
          {barChart.length > 0 ? (
            <div className="flex items-end justify-between gap-3 h-44 px-2">
              {barChart.map((bar, i) => (
                <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold text-on-background font-[family-name:var(--font-manrope)]">
                    {bar.value}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-full max-w-[48px] rounded-t-lg transition-all bg-gradient-to-t from-primary to-primary/70"
                      style={{
                        height: `${(bar.value / bar.max) * 130}px`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-on-surface-variant font-[family-name:var(--font-inter)]">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-44">
              <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)]">
                Aucune donnée disponible
              </p>
            </div>
          )}
        </div>

        {/* Venue breakdown */}
        <div className="bg-white rounded-xl border border-outline-variant/10 p-5">
          <h3 className="text-sm font-bold text-on-background font-[family-name:var(--font-manrope)] mb-6">
            Répartition par établissement
          </h3>
          {venueBreakdown.length > 0 ? (
            <div className="space-y-4">
              {venueBreakdown.map((v) => (
                <div key={v.venue}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-on-background font-[family-name:var(--font-manrope)]">
                      {v.venue}
                    </span>
                    <span className="text-sm font-bold text-on-background font-[family-name:var(--font-manrope)]">
                      {v.commission}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-surface-low rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${v.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-on-surface-variant font-[family-name:var(--font-inter)] w-8 text-right">
                      {v.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-44">
              <p className="text-sm text-on-surface-variant font-[family-name:var(--font-inter)]">
                Aucune donnée disponible
              </p>
            </div>
          )}
        </div>

        {/* Monthly detail table */}
        <div className="bg-white rounded-xl border border-outline-variant/10 p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-on-background font-[family-name:var(--font-manrope)] mb-4">
            Détail mensuel
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                    Mois
                  </th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                    Couverts
                  </th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                    Commission
                  </th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 font-[family-name:var(--font-inter)]">
                    Croissance
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.length > 0 ? (
                  monthlyData.map((m, i) => (
                    <tr
                      key={m.month}
                      className={`border-b border-outline-variant/5 ${
                        i % 2 === 0 ? "" : "bg-surface/30"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-on-background font-[family-name:var(--font-manrope)]">
                        {m.month}
                      </td>
                      <td className="px-4 py-3 text-center text-on-background font-[family-name:var(--font-inter)]">
                        {m.covers}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-on-background font-[family-name:var(--font-manrope)]">
                        {m.commission} MAD
                      </td>
                      <td className="px-4 py-3 text-right">
                        {m.growth > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                            <ArrowUpRight size={12} strokeWidth={2} />
                            +{m.growth}%
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-on-surface-variant font-[family-name:var(--font-inter)]">
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
