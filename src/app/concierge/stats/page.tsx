"use client";

import { StatsStrip } from "@/components/dashboard/stats-strip";
import { TrendingUp } from "lucide-react";

const stats = [
  { label: "Couverts ce mois", value: "156" },
  { label: "Chiffre d'affaires généré", value: "486 000 MAD" },
  { label: "Commissions totales", value: "48 600 MAD" },
  { label: "Taux de confirmation", value: "87%" },
];

const monthlyData = [
  { month: "Jan.", covers: 98, commission: "28 400 MAD" },
  { month: "Fév.", covers: 112, commission: "33 200 MAD" },
  { month: "Mar.", covers: 134, commission: "41 800 MAD" },
  { month: "Avr.", covers: 156, commission: "48 600 MAD" },
];

const barChart = [
  { label: "Jan.", height: 63 },
  { label: "Fév.", height: 72 },
  { label: "Mar.", height: 86 },
  { label: "Avr.", height: 100 },
];

export default function ConciergeStatsPage() {
  return (
    <div className="bg-surface min-h-screen">
      <div className="px-8 pt-8 pb-4">
        <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-2xl font-extrabold">
          Statistiques
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Analysez votre performance et votre croissance.
        </p>
      </div>

      <div className="px-8 pb-6">
        <div className="rounded-md overflow-hidden editorial-shadow">
          <StatsStrip stats={stats} />
        </div>
      </div>

      <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-surface-card rounded-md editorial-shadow p-6">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] font-bold text-sm mb-6">
            Évolution des couverts
          </h3>
          <div className="flex items-end justify-between gap-4 h-40">
            {barChart.map((bar) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex justify-center">
                  <div
                    className="w-12 bg-primary rounded-sm transition-all"
                    style={{ height: `${bar.height * 1.4}px`, opacity: bar.height / 100 * 0.6 + 0.4 }}
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="bg-surface-card rounded-md editorial-shadow p-6">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] font-bold text-sm mb-6">
            Détail mensuel
          </h3>
          <div className="space-y-4">
            {monthlyData.map((m) => (
              <div key={m.month} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-on-background w-10">{m.month}</span>
                  <span className="text-sm text-on-surface-variant">{m.covers} couverts</span>
                </div>
                <span className="text-sm font-bold text-on-background flex items-center gap-1">
                  {m.commission}
                  <TrendingUp size={14} strokeWidth={1.5} className="text-emerald-600" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
