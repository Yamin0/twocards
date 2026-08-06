"use client";

import { useState, useCallback } from "react";
import {
  Download,
  FileText,
  Trophy,
  TrendingUp,
  Check,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

const DEMO_RP_DATA = [
  { rang: 1, nom: "Liam Hamza", couverts: 48, ca: "124 800 MAD", commissions: "12 480 MAD", taille: "7,2" },
  { rang: 2, nom: "Karim Bennani", couverts: 35, ca: "102 500 MAD", commissions: "10 250 MAD", taille: "6,8" },
  { rang: 3, nom: "Youssef El Idrissi", couverts: 29, ca: "98 700 MAD", commissions: "9 870 MAD", taille: "5,9" },
  { rang: 4, nom: "Sofia Alaoui", couverts: 22, ca: "76 500 MAD", commissions: "7 650 MAD", taille: "5,4" },
];

/* Les barres portent désormais une valeur réelle, pas seulement une hauteur :
   sans elle, le survol n'aurait rien à révéler. Les totaux concordent avec la
   bande de statistiques — 134 couverts et 402 500 MAD. */
const DEMO_BAR_CHART_COUVERTS = [
  { label: "Lun", value: 13 },
  { label: "Mar", value: 18 },
  { label: "Mer", value: 16 },
  { label: "Jeu", value: 23 },
  { label: "Ven", value: 27 },
  { label: "Sam", value: 28 },
  { label: "Dim", value: 9 },
];

const DEMO_BAR_CHART_REVENUS = [
  { label: "S1", value: 27000 },
  { label: "S2", value: 35500 },
  { label: "S3", value: 24500 },
  { label: "S4", value: 42500 },
  { label: "S5", value: 49000 },
  { label: "S6", value: 38000 },
  { label: "S7", value: 46500 },
  { label: "S8", value: 52000 },
  { label: "S9", value: 32500 },
  { label: "S10", value: 55000 },
];

const DEMO_TOP_EVENTS = [
  { name: "Nuit Blanche VIP", revenue: "82 000 MAD", couverts: 18 },
  { name: "Soirée privée Champagne", revenue: "67 500 MAD", couverts: 12 },
  { name: "DJ Set International", revenue: "54 000 MAD", couverts: 15 },
];

const DEMO_DONUT_SEGMENTS = [
  { label: "Tables VIP", pct: 64, color: "bg-blue-400" },
  { label: "Tables standard", pct: 22, color: "bg-blue-400/50" },
  { label: "Bar", pct: 14, color: "bg-white/20" },
];

const DEMO_STATS = [
  { label: "Total couverts", value: "134" },
  { label: "Chiffre d'affaires", value: "402 500 MAD" },
  { label: "Taille moy. groupe", value: "6,2" },
  { label: "Meilleur RP", value: "LIAM H." },
];

const EMPTY_BAR_CHART_COUVERTS = DEMO_BAR_CHART_COUVERTS.map((b) => ({
  ...b,
  value: 0,
}));

const EMPTY_BAR_CHART_REVENUS = DEMO_BAR_CHART_REVENUS.map((b) => ({
  ...b,
  value: 0,
}));

const EMPTY_STATS = [
  { label: "Total couverts", value: "0" },
  { label: "Chiffre d'affaires", value: "0 MAD" },
  { label: "Taille moy. groupe", value: "0" },
  { label: "Meilleur RP", value: "—" },
];

const EMPTY_DONUT_SEGMENTS = [
  { label: "Tables VIP", pct: 0, color: "bg-blue-400" },
  { label: "Tables standard", pct: 0, color: "bg-blue-400/50" },
  { label: "Bar", pct: 0, color: "bg-white/20" },
];

const periodTabs = ["Cette semaine", "Ce mois", "Cette année"];

/* Un seul histogramme, employé pour les couverts comme pour les revenus.
   Les hauteurs se déduisent de la plus grande valeur au lieu d'être saisies
   à la main : impossible qu'elles contredisent les chiffres.

   Au survol, la barre s'éclaircit et une infobulle donne la valeur exacte.
   Le titre natif prend le relais au toucher et pour les lecteurs d'écran,
   où l'infobulle visuelle ne se déclenche pas. */
function BarChart({
  bars,
  format,
  barWidth,
  gap,
}: {
  bars: { label: string; value: number }[];
  format: (v: number) => string;
  barWidth: string;
  gap: string;
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className={`flex items-end justify-between ${gap} h-40`}>
      {bars.map((bar) => {
        const pct = (bar.value / max) * 100;
        const legend = `${bar.label} · ${format(bar.value)}`;
        return (
          <div
            key={bar.label}
            className="group relative flex flex-1 flex-col items-center gap-2"
          >
            <div
              role="img"
              aria-label={legend}
              title={legend}
              className="flex w-full justify-center"
            >
              <div
                className={`${barWidth} relative overflow-hidden rounded-lg transition-all`}
                style={{ height: `${Math.max(pct * 1.4, 4)}px` }}
              >
                <div className="absolute inset-0 bg-blue-400/30" />
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-lg bg-blue-400 transition-colors group-hover:bg-blue-300"
                  style={{ height: `${pct}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-white/40 transition-colors group-hover:text-white">
              {bar.label}
            </span>

            <span className="pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-[#151515] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
              {format(bar.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const formatCouverts = (v: number) => `${v} couvert${v > 1 ? "s" : ""}`;
const formatMAD = (v: number) =>
  `${v.toLocaleString("fr-FR").replace(/ | /g, " ")} MAD`;

function downloadCSV(data: Record<string, string | number>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${row[h]}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const [activePeriod, setActivePeriod] = useState("Ce mois");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const rpData = isDemoVenue ? DEMO_RP_DATA : [];
  const barChartCouverts = isDemoVenue ? DEMO_BAR_CHART_COUVERTS : EMPTY_BAR_CHART_COUVERTS;
  const barChartRevenus = isDemoVenue ? DEMO_BAR_CHART_REVENUS : EMPTY_BAR_CHART_REVENUS;
  const topEvents = isDemoVenue ? DEMO_TOP_EVENTS : [];
  const donutSegments = isDemoVenue ? DEMO_DONUT_SEGMENTS : EMPTY_DONUT_SEGMENTS;
  const statsData = isDemoVenue ? DEMO_STATS : EMPTY_STATS;

  const handleExportCSV = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    downloadCSV(
      (isDemoVenue ? DEMO_RP_DATA : []).map((rp) => ({
        Rang: rp.rang,
        Nom: rp.nom,
        Couverts: rp.couverts,
        "CA généré": rp.ca,
        Commissions: rp.commissions,
        "Taille moy.": rp.taille,
      })),
      `analytics-${today}.csv`
    );
    showToast("CSV téléchargé");
  }, [isDemoVenue, showToast]);

  const handleExportReport = useCallback(() => {
    showToast("Rapport exporté (PDF bientôt disponible)");
  }, [showToast]);

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header Glass Card */}
      <div>
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-white font-[family-name:var(--font-manrope)] font-extrabold text-3xl tracking-tight">
                Analyses
              </h1>
              <p className="text-white/50 text-sm mt-2">
                Suivez les performances de votre établissement en temps réel.
              </p>
            </div>

            {/* Period Selector */}
            <div className="flex gap-1 backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-1">
              {periodTabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActivePeriod(tab)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl transition-all ${
                    activePeriod === tab
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsData.map((stat, i) => (
          <div
            key={i}
            className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-5"
          >
            <span className="text-white/40 font-[family-name:var(--font-manrope)] text-[10px] uppercase tracking-[0.12em] font-bold">
              {stat.label}
            </span>
            <p className="text-white font-[family-name:var(--font-manrope)] font-extrabold text-2xl mt-1.5">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Couverts par jour */}
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <h3 className="text-white font-[family-name:var(--font-manrope)] font-bold text-sm mb-6">
            Couverts par jour
          </h3>
          <BarChart
            bars={barChartCouverts}
            format={formatCouverts}
            barWidth="w-8"
            gap="gap-2"
          />
        </div>

        {/* Revenus par semaine */}
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <h3 className="text-white font-[family-name:var(--font-manrope)] font-bold text-sm mb-6">
            Revenus par semaine
          </h3>
          <BarChart
            bars={barChartRevenus}
            format={formatMAD}
            barWidth="w-6"
            gap="gap-1.5"
          />
        </div>
      </div>

      {/* RP Performance Table */}
      <div>
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl overflow-hidden">
          <div className="px-6 py-5">
            <h3 className="text-white font-[family-name:var(--font-manrope)] font-bold text-sm">
              Performance des RP
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-white/[0.08]">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Rang
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Nom
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Couverts
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    CA
                  </th>
                  <th className="hidden md:table-cell text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Commissions
                  </th>
                  <th className="hidden md:table-cell text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Taille moy.
                  </th>
                </tr>
              </thead>
              <tbody>
                {rpData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-white/40">
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
                {rpData.map((rp, i) => (
                  <tr
                    key={rp.rang}
                    className={`border-t border-white/[0.06] ${
                      i % 2 === 1 ? "bg-white/[0.03]" : ""
                    } hover:bg-white/[0.05] transition-colors`}
                  >
                    <td className="px-6 py-3.5 text-white font-bold">
                      <div className="flex items-center gap-2">
                        {rp.rang === 1 && <Trophy size={14} strokeWidth={1.5} className="text-amber-400" />}
                        {rp.rang}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-white font-medium">{rp.nom}</td>
                    <td className="px-6 py-3.5 text-white/80">{rp.couverts}</td>
                    <td className="px-6 py-3.5 text-white font-medium">{rp.ca}</td>
                    <td className="hidden md:table-cell px-6 py-3.5 text-white/80">{rp.commissions}</td>
                    <td className="hidden md:table-cell px-6 py-3.5 text-white/80">{rp.taille}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meilleurs Evenements */}
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <h3 className="text-white font-[family-name:var(--font-manrope)] font-bold text-sm mb-5">
            Meilleurs événements
          </h3>
          <div className="space-y-4">
            {topEvents.length === 0 && (
              <p className="text-sm text-white/40 text-center py-4">Aucun événement</p>
            )}
            {topEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-400">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{event.name}</p>
                  <p className="text-xs text-white/40">{event.couverts} couverts</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <TrendingUp size={14} strokeWidth={1.5} className="text-emerald-400" />
                  {event.revenue}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Repartition des Reservations */}
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <h3 className="text-white font-[family-name:var(--font-manrope)] font-bold text-sm mb-5">
            Répartition des réservations
          </h3>
          <div className="flex items-center gap-8">
            {/* Donut Chart SVG */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {/* Background ring */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                {isDemoVenue && (
                  <>
                    {/* VIP - 64% */}
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke="#60a5fa" strokeWidth="4"
                      strokeDasharray="64 36"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* Standard - 22% */}
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke="rgba(96,165,250,0.5)" strokeWidth="4"
                      strokeDasharray="22 78"
                      strokeDashoffset="-64"
                      strokeLinecap="round"
                    />
                    {/* Bar - 14% */}
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke="rgba(255,255,255,0.2)" strokeWidth="4"
                      strokeDasharray="14 86"
                      strokeDashoffset="-86"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold font-[family-name:var(--font-manrope)] text-white">
                  {isDemoVenue ? "64%" : "0%"}
                </span>
                <span className="text-[9px] text-white/40">VIP</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              {donutSegments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${seg.color}`} />
                  <div>
                    <p className="text-sm text-white font-medium">{seg.label}</p>
                    <p className="text-xs text-white/40">{seg.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
        >
          <FileText size={16} strokeWidth={1.5} />
          Exporter le rapport
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-5 py-2.5 backdrop-blur-2xl bg-black/45 border border-white/[0.12] text-white/80 rounded-xl text-sm font-medium hover:bg-white/[0.12] hover:text-white transition-colors"
        >
          <Download size={16} strokeWidth={1.5} />
          Télécharger CSV
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 backdrop-blur-xl bg-white/15 border border-white/20 text-white px-5 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4">
          <Check size={16} strokeWidth={2} className="text-blue-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
