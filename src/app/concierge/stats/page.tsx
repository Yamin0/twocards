"use client";

import { TrendingUp, ArrowUpRight, Users, Wallet, CalendarDays, CheckCircle, BarChart3 } from "lucide-react";
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
  { venue: "Le Comptoir Darna", covers: 52, commission: "16 200 MAD", percentage: 33, color: "bg-blue-400" },
  { venue: "Le Lotus Club", covers: 44, commission: "13 800 MAD", percentage: 28, color: "bg-purple-400" },
  { venue: "Sky Bar Casa", covers: 35, commission: "11 000 MAD", percentage: 23, color: "bg-sky-400" },
  { venue: "Pacha Marrakech", covers: 25, commission: "7 600 MAD", percentage: 16, color: "bg-amber-400" },
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
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <h1 className="text-2xl font-bold text-white font-ui">
          Statistiques
        </h1>
        <p className="text-sm text-white/50 font-ui mt-1">
          Analysez votre performance et croissance
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Couverts ce mois", value: isDemoConcierge ? "156" : "0", trend: "+16%", icon: Users, iconColor: "text-blue-400", iconBg: "bg-blue-400/10" },
          { label: "CA généré (MAD)", value: isDemoConcierge ? "486K" : "0", trend: "+22%", icon: Wallet, iconColor: "text-emerald-400", iconBg: "bg-emerald-400/10" },
          { label: "Commissions (MAD)", value: isDemoConcierge ? "48.6K" : "0", trend: "+16%", icon: CalendarDays, iconColor: "text-amber-400", iconBg: "bg-amber-400/10" },
          { label: "Taux confirmation", value: isDemoConcierge ? "87%" : "\u2014", trend: "+3%", icon: CheckCircle, iconColor: "text-purple-400", iconBg: "bg-purple-400/10" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-5 transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.1]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon size={18} strokeWidth={1.5} className={stat.iconColor} />
              </div>
              {isDemoConcierge && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-400/10">
                  <ArrowUpRight size={12} strokeWidth={2} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">{stat.trend}</span>
                </div>
              )}
            </div>
            <p className="text-2xl font-extrabold text-white font-ui">
              {stat.value}
            </p>
            <p className="text-xs text-white/40 font-ui mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white font-ui mb-6">
            Évolution des couverts
          </h3>
          {barChart.length > 0 ? (
            <div className="flex items-end justify-between gap-4 h-52 px-2">
              {barChart.map((bar) => {
                const isMax = bar.value === bar.max;
                return (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-3">
                    <span className="text-sm font-bold text-white font-ui">
                      {bar.value}
                    </span>
                    <div className="w-full flex justify-center relative">
                      <div
                        className={`w-full max-w-[52px] rounded-xl transition-all ${
                          isMax
                            ? "bg-gradient-to-t from-blue-500 to-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.3)]"
                            : "bg-gradient-to-t from-blue-500/40 to-blue-400/10"
                        }`}
                        style={{ height: `${(bar.value / bar.max) * 170}px` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isMax ? "text-white" : "text-white/40"} font-ui`}>
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={TrendingUp} text="Aucune donnée disponible" sub="Les statistiques apparaîtront ici" />
          )}
        </div>

        {/* Venue breakdown */}
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <h3 className="text-lg font-bold text-white font-ui mb-6">
            Répartition par établissement
          </h3>
          {venueBreakdown.length > 0 ? (
            <div className="space-y-5">
              {venueBreakdown.map((v) => (
                <div key={v.venue}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-white font-ui">
                      {v.venue}
                    </span>
                    <span className="text-sm font-bold text-white/70 font-ui">
                      {v.commission}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${v.color} rounded-full transition-all`}
                        style={{ width: `${v.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/40 font-ui w-8 text-right">
                      {v.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} text="Aucune donnée disponible" sub="La répartition apparaîtra ici" />
          )}
        </div>

        {/* Monthly detail table */}
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-white font-ui mb-4">
            Détail mensuel
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.1]">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 font-ui">
                    Mois
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 font-ui">
                    Couverts
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 font-ui">
                    Commission
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40 font-ui">
                    Croissance
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.length > 0 ? (
                  monthlyData.map((m) => (
                    <tr key={m.month} className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-white font-ui">
                        {m.month}
                      </td>
                      <td className="px-4 py-3.5 text-center text-white/70 font-ui">
                        {m.covers}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-white font-ui">
                        {m.commission} MAD
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {m.growth > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                            <ArrowUpRight size={12} strokeWidth={2} />
                            +{m.growth}%
                          </span>
                        ) : (
                          <span className="text-xs text-white/30">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState icon={CalendarDays} text="Aucune donnée disponible" sub="Le détail mensuel apparaîtra ici" />
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

function EmptyState({ icon: Icon, text, sub }: { icon: typeof BarChart3; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center mb-4">
        <Icon size={24} strokeWidth={1.5} className="text-white/20" />
      </div>
      <p className="text-sm font-medium text-white/40 font-ui">{text}</p>
      <p className="text-xs text-white/25 font-ui mt-1">{sub}</p>
    </div>
  );
}
