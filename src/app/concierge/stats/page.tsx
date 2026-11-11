"use client";

import { TrendingUp, ArrowUpRight, Users, Wallet, CalendarDays, CheckCircle, BarChart3 } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { useT } from "@/lib/i18n/client";

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
  { venue: "Le Comptoir Darna", covers: 52, commission: "16 200 MAD", percentage: 33, color: "bg-link" },
  { venue: "Le Lotus Club", covers: 44, commission: "13 800 MAD", percentage: 28, color: "bg-plum" },
  { venue: "Sky Bar Casa", covers: 35, commission: "11 000 MAD", percentage: 23, color: "bg-link" },
  { venue: "Pacha Marrakech", covers: 25, commission: "7 600 MAD", percentage: 16, color: "bg-warn" },
];

/* Mois de démonstration écrits à la main : libellé anglais à côté. */
const MONTH_EN: Record<string, string> = { "Jan.": "Jan", "Fév.": "Feb", "Mar.": "Mar", "Avr.": "Apr" };

const EMPTY_MONTHLY: typeof DEMO_MONTHLY_DATA = [];
const EMPTY_BAR_CHART: typeof DEMO_BAR_CHART = [];
const EMPTY_VENUE_BREAKDOWN: typeof DEMO_VENUE_BREAKDOWN = [];

export default function ConciergeStatsPage() {
  const { isDemoConcierge, isLoading } = useAuthUser();
  const t = useT();
  const monthLabel = (m: string) => t(m, MONTH_EN[m] ?? m);

  if (isLoading) return <ConciergeSkeleton />;

  const monthlyData = isDemoConcierge ? DEMO_MONTHLY_DATA : EMPTY_MONTHLY;
  const barChart = isDemoConcierge ? DEMO_BAR_CHART : EMPTY_BAR_CHART;
  const venueBreakdown = isDemoConcierge ? DEMO_VENUE_BREAKDOWN : EMPTY_VENUE_BREAKDOWN;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className=" bg-panel border border-line rounded-3xl p-6">
        <h1 className="text-2xl font-bold text-ink">
          {t("Statistiques", "Stats")}
        </h1>
        <p className="text-sm text-ink-3 font-ui mt-1">
          {t("Analysez votre performance et croissance", "Analyse your performance and growth")}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("Couverts ce mois", "Covers this month"), value: isDemoConcierge ? "156" : "0", trend: "+16%", icon: Users, iconColor: "text-info", iconBg: "bg-info-soft" },
          { label: t("CA généré (MAD)", "Revenue generated (MAD)"), value: isDemoConcierge ? "486K" : "0", trend: "+22%", icon: Wallet, iconColor: "text-ok", iconBg: "bg-ok-soft" },
          { label: t("Commissions (MAD)", "Commissions (MAD)"), value: isDemoConcierge ? "48.6K" : "0", trend: "+16%", icon: CalendarDays, iconColor: "text-warn", iconBg: "bg-warn-soft" },
          { label: t("Taux confirmation", "Confirmation rate"), value: isDemoConcierge ? "87%" : "\u2014", trend: "+3%", icon: CheckCircle, iconColor: "text-plum", iconBg: "bg-plum-soft" },
        ].map((stat) => (
          <div
            key={stat.label}
            className=" bg-panel border border-line rounded-3xl p-5 transition-all duration-500 hover:scale-[1.02] hover:bg-fill-2"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon size={18} strokeWidth={1.5} className={stat.iconColor} />
              </div>
              {isDemoConcierge && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-ok-soft">
                  <ArrowUpRight size={12} strokeWidth={2} className="text-ok" />
                  <span className="text-xs font-semibold text-ok">{stat.trend}</span>
                </div>
              )}
            </div>
            <p className="text-2xl font-extrabold text-ink font-ui">
              {stat.value}
            </p>
            <p className="text-xs text-ink-3 font-ui mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className=" bg-panel border border-line rounded-3xl p-6">
          <h3 className="text-lg font-bold text-ink mb-6">
            {t("Évolution des couverts", "Covers over time")}
          </h3>
          {barChart.length > 0 ? (
            <div className="flex items-end justify-between gap-4 h-52 px-2">
              {barChart.map((bar) => {
                const isMax = bar.value === bar.max;
                return (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-3">
                    <span className="text-sm font-bold text-ink font-ui">
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
                    <span className={`text-xs font-medium ${isMax ? "text-ink" : "text-ink-3"} font-ui`}>
                      {monthLabel(bar.label)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={TrendingUp} text={t("Aucune donnée disponible", "No data yet")} sub={t("Les statistiques apparaîtront ici", "Your stats will appear here")} />
          )}
        </div>

        {/* Venue breakdown */}
        <div className=" bg-panel border border-line rounded-3xl p-6">
          <h3 className="text-lg font-bold text-ink mb-6">
            {t("Répartition par établissement", "Breakdown by venue")}
          </h3>
          {venueBreakdown.length > 0 ? (
            <div className="space-y-5">
              {venueBreakdown.map((v) => (
                <div key={v.venue}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink font-ui">
                      {v.venue}
                    </span>
                    <span className="text-sm font-bold text-ink-2 font-ui">
                      {v.commission}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-fill rounded-full overflow-hidden">
                      <div
                        className={`h-full ${v.color} rounded-full transition-all`}
                        style={{ width: `${v.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-3 font-ui w-8 text-right">
                      {v.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} text={t("Aucune donnée disponible", "No data yet")} sub={t("La répartition apparaîtra ici", "The breakdown will appear here")} />
          )}
        </div>

        {/* Monthly detail table */}
        <div className=" bg-panel border border-line rounded-3xl p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-ink mb-4">
            {t("Détail mensuel", "Monthly breakdown")}
          </h3>
          <div className="tc-stack overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-3 font-ui">
                    {t("Mois", "Month")}
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-ink-3 font-ui">
                    {t("Couverts", "Covers")}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-3 font-ui">
                    {t("Commission", "Commission")}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-3 font-ui">
                    {t("Croissance", "Growth")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.length > 0 ? (
                  monthlyData.map((m) => (
                    <tr key={m.month} className="border-b border-line hover:bg-fill transition-colors">
                      <td data-head className="px-4 py-3.5 font-semibold text-ink font-ui">
                        {monthLabel(m.month)}
                      </td>
                      <td data-label={t("Couverts", "Covers")} className="px-4 py-3.5 text-center text-ink-2 font-ui">
                        {m.covers}
                      </td>
                      <td data-label={t("Commission", "Commission")} className="px-4 py-3.5 text-right font-bold text-ink font-ui">
                        {m.commission} MAD
                      </td>
                      <td data-label={t("Croissance", "Growth")} className="px-4 py-3.5 text-right">
                        {m.growth > 0 ? (
                          <span className="inline-flex items-center gap-1 text-ok font-semibold text-xs">
                            <ArrowUpRight size={12} strokeWidth={2} />
                            +{m.growth}%
                          </span>
                        ) : (
                          <span className="text-xs text-ink-3">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState icon={CalendarDays} text={t("Aucune donnée disponible", "No data yet")} sub={t("Le détail mensuel apparaîtra ici", "The monthly breakdown will appear here")} />
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
      <div className="w-12 h-12 rounded-full bg-fill flex items-center justify-center mb-4">
        <Icon size={24} strokeWidth={1.5} className="text-ink-4" />
      </div>
      <p className="text-sm font-medium text-ink-3 font-ui">{text}</p>
      <p className="text-xs text-ink-3 font-ui mt-1">{sub}</p>
    </div>
  );
}
