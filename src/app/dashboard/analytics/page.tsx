"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  FileText,
  ChevronDown,
  Trophy,
  TrendingUp,
  Check,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

const navLinks = ["Vue d'ensemble", "Cartes en direct", "Revenus", "Clients", "Paramètres"];

const DEMO_RP_DATA = [
  { rang: 1, nom: "Samy Benchekroun", couverts: 48, ca: "124 800 MAD", commissions: "12 480 MAD", taille: "7,2" },
  { rang: 2, nom: "Yasmine El Idrissi", couverts: 35, ca: "102 500 MAD", commissions: "10 250 MAD", taille: "6,8" },
  { rang: 3, nom: "Amine Tazi", couverts: 29, ca: "98 700 MAD", commissions: "9 870 MAD", taille: "5,9" },
  { rang: 4, nom: "Nadia Berrada", couverts: 22, ca: "76 500 MAD", commissions: "7 650 MAD", taille: "5,4" },
];

const DEMO_BAR_CHART_COUVERTS = [
  { label: "Lun", height: 45 },
  { label: "Mar", height: 65 },
  { label: "Mer", height: 55 },
  { label: "Jeu", height: 80 },
  { label: "Ven", height: 95 },
  { label: "Sam", height: 100 },
  { label: "Dim", height: 35 },
];

const DEMO_BAR_CHART_REVENUS = [
  { label: "S1", height: 50 },
  { label: "S2", height: 65 },
  { label: "S3", height: 45 },
  { label: "S4", height: 78 },
  { label: "S5", height: 90 },
  { label: "S6", height: 70 },
  { label: "S7", height: 85 },
  { label: "S8", height: 95 },
  { label: "S9", height: 60 },
  { label: "S10", height: 100 },
];

const DEMO_TOP_EVENTS = [
  { name: "Nuit Blanche VIP", revenue: "82 000 MAD", couverts: 18 },
  { name: "Soirée Privée Champagne", revenue: "67 500 MAD", couverts: 12 },
  { name: "DJ Set International", revenue: "54 000 MAD", couverts: 15 },
];

const DEMO_DONUT_SEGMENTS = [
  { label: "Tables VIP", pct: 64, color: "bg-primary" },
  { label: "Tables Standard", pct: 22, color: "bg-primary/50" },
  { label: "Bar", pct: 14, color: "bg-on-primary-container" },
];

const DEMO_STATS = [
  { label: "Total Couverts", value: "134" },
  { label: "Chiffre d'Affaires", value: "402 500 MAD" },
  { label: "Taille Moy. Groupe", value: "6,2" },
  { label: "Meilleur RP", value: "SAMY B." },
];

const EMPTY_BAR_CHART_COUVERTS = [
  { label: "Lun", height: 0 },
  { label: "Mar", height: 0 },
  { label: "Mer", height: 0 },
  { label: "Jeu", height: 0 },
  { label: "Ven", height: 0 },
  { label: "Sam", height: 0 },
  { label: "Dim", height: 0 },
];

const EMPTY_BAR_CHART_REVENUS = [
  { label: "S1", height: 0 },
  { label: "S2", height: 0 },
  { label: "S3", height: 0 },
  { label: "S4", height: 0 },
  { label: "S5", height: 0 },
  { label: "S6", height: 0 },
  { label: "S7", height: 0 },
  { label: "S8", height: 0 },
  { label: "S9", height: 0 },
  { label: "S10", height: 0 },
];

const EMPTY_STATS = [
  { label: "Total Couverts", value: "0" },
  { label: "Chiffre d'Affaires", value: "0 MAD" },
  { label: "Taille Moy. Groupe", value: "0" },
  { label: "Meilleur RP", value: "—" },
];

const EMPTY_DONUT_SEGMENTS = [
  { label: "Tables VIP", pct: 0, color: "bg-primary" },
  { label: "Tables Standard", pct: 0, color: "bg-primary/50" },
  { label: "Bar", pct: 0, color: "bg-on-primary-container" },
];

const periodTabs = ["Cette semaine", "Ce mois", "Cette année", "Personnalisé"];

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
  const [activeNav, setActiveNav] = useState("Vue d'ensemble");
  const [activePeriod, setActivePeriod] = useState("Ce mois");
  const { toast, showToast } = useToast();

  const rpData = isDemoVenue ? DEMO_RP_DATA : [];
  const barChartCouverts = isDemoVenue ? DEMO_BAR_CHART_COUVERTS : EMPTY_BAR_CHART_COUVERTS;
  const barChartRevenus = isDemoVenue ? DEMO_BAR_CHART_REVENUS : EMPTY_BAR_CHART_REVENUS;
  const topEvents = isDemoVenue ? DEMO_TOP_EVENTS : [];
  const donutSegments = isDemoVenue ? DEMO_DONUT_SEGMENTS : EMPTY_DONUT_SEGMENTS;
  const statsData = isDemoVenue ? DEMO_STATS : EMPTY_STATS;

  const handleExportCSV = () => {
    downloadCSV(
      rpData.map((rp) => ({
        Rang: rp.rang,
        Nom: rp.nom,
        Couverts: rp.couverts,
        "CA Généré": rp.ca,
        Commissions: rp.commissions,
        "Taille Moy.": rp.taille,
      })),
      "analytics-twocards.csv"
    );
    showToast("CSV téléchargé");
  };

  const handleExportReport = () => {
    showToast("Rapport exporté (PDF bientôt disponible)");
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="-mx-0">
      {/* Dark Top Navigation Bar */}
      <div className="bg-primary-dark px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => setActiveNav(link)}
                className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                  activeNav === link
                    ? "bg-white/15 text-white"
                    : "text-white/60 hover:text-white/90"
                }`}
              >
                {link}
              </button>
            ))}
          </nav>
        </div>
        <button className="flex items-center gap-1 text-white/60 text-sm hover:text-white transition-colors">
          <span>Avr. 2026</span>
          <ChevronDown size={14} strokeWidth={1.5} />
        </button>
      </div>

      {/* Data Strip */}
      <div className="bg-tertiary-container px-6 py-5 flex flex-wrap items-end gap-6 md:gap-0 md:grid md:grid-cols-5">
        {statsData.map((stat, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              i > 0 ? "md:border-l md:border-white/10 md:pl-6" : ""
            }`}
          >
            <span className="text-on-tertiary-container font-[family-name:var(--font-inter)] text-[10px] uppercase tracking-[0.1em] mb-1 font-bold">
              {stat.label}
            </span>
            <span className="text-white font-[family-name:var(--font-manrope)] font-extrabold text-2xl">
              {stat.value}
            </span>
          </div>
        ))}

        {/* Period selector */}
        <div className="flex items-end md:justify-end">
          <div className="flex gap-1 bg-white/10 rounded-sm p-0.5">
            {periodTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActivePeriod(tab)}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-sm transition-colors ${
                  activePeriod === tab
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Couverts Chart */}
        <div className="bg-surface-card rounded-md editorial-shadow p-6">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] font-bold text-sm mb-6">
            Couverts dans le temps
          </h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {barChartCouverts.map((bar) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex justify-center">
                  <div
                    className="w-8 bg-primary rounded-sm transition-all"
                    style={{ height: `${bar.height * 1.4}px`, opacity: bar.height / 100 * 0.6 + 0.4 }}
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenus Chart */}
        <div className="bg-surface-card rounded-md editorial-shadow p-6">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] font-bold text-sm mb-6">
            Revenus dans le temps
          </h3>
          <div className="flex items-end justify-between gap-1.5 h-40">
            {barChartRevenus.map((bar) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex justify-center">
                  <div
                    className="w-6 bg-primary rounded-sm transition-all"
                    style={{ height: `${bar.height * 1.4}px`, opacity: bar.height / 100 * 0.6 + 0.4 }}
                  />
                </div>
                <span className="text-[10px] text-on-surface-variant">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RP Performance Table */}
      <div className="px-6 pb-6">
        <div className="bg-surface-card rounded-md editorial-shadow overflow-hidden">
          <div className="px-6 py-4">
            <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] font-bold text-sm">
              Performance des RP
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-low">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Rang
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Nom du RP
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Couverts
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    CA Généré
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Commissions Dues
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Taille Moy. Groupe
                  </th>
                </tr>
              </thead>
              <tbody>
                {rpData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
                {rpData.map((rp, i) => (
                  <tr
                    key={rp.rang}
                    className={i % 2 === 0 ? "bg-surface-card" : "bg-surface-low/50"}
                  >
                    <td className="px-6 py-3.5 text-on-background font-bold">
                      <div className="flex items-center gap-2">
                        {rp.rang === 1 && <Trophy size={14} strokeWidth={1.5} className="text-amber-500" />}
                        {rp.rang}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-on-background font-medium">{rp.nom}</td>
                    <td className="px-6 py-3.5 text-on-background">{rp.couverts}</td>
                    <td className="px-6 py-3.5 text-on-background font-medium">{rp.ca}</td>
                    <td className="px-6 py-3.5 text-on-background">{rp.commissions}</td>
                    <td className="px-6 py-3.5 text-on-background">{rp.taille}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meilleurs Événements */}
        <div className="bg-surface-card rounded-md editorial-shadow p-6">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] font-bold text-sm mb-5">
            Meilleurs Événements
          </h3>
          <div className="space-y-4">
            {topEvents.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-4">Aucun événement</p>
            )}
            {topEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-on-primary-container">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-background truncate">{event.name}</p>
                  <p className="text-xs text-on-surface-variant">{event.couverts} couverts</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-on-background">
                  <TrendingUp size={14} strokeWidth={1.5} className="text-emerald-600" />
                  {event.revenue}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition des Réservations */}
        <div className="bg-surface-card rounded-md editorial-shadow p-6">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] font-bold text-sm mb-5">
            Répartition des Réservations
          </h3>
          <div className="flex items-center gap-8">
            {/* Donut Chart Mockup */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {/* Background ring */}
                <circle cx="18" cy="18" r="14" fill="none" stroke="#eff5f3" strokeWidth="4" />
                {isDemoVenue && (
                  <>
                    {/* VIP - 64% */}
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke="#13305c" strokeWidth="4"
                      strokeDasharray="64 36"
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                    {/* Standard - 22% */}
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke="rgba(19,48,92,0.45)" strokeWidth="4"
                      strokeDasharray="22 78"
                      strokeDashoffset="-64"
                      strokeLinecap="round"
                    />
                    {/* Bar - 14% */}
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke="#8099cb" strokeWidth="4"
                      strokeDasharray="14 86"
                      strokeDashoffset="-86"
                      strokeLinecap="round"
                    />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold font-[family-name:var(--font-manrope)] text-on-background">
                  {isDemoVenue ? "64%" : "0%"}
                </span>
                <span className="text-[9px] text-on-surface-variant">VIP</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              {donutSegments.map((seg) => (
                <div key={seg.label} className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${seg.color}`} />
                  <div>
                    <p className="text-sm text-on-background font-medium">{seg.label}</p>
                    <p className="text-xs text-on-surface-variant">{seg.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 pb-8 flex flex-wrap items-center gap-4">
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-sm text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <FileText size={16} strokeWidth={1.5} />
          Exporter le rapport
        </button>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-background transition-colors"
        >
          <Download size={16} strokeWidth={1.5} />
          Télécharger CSV
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary-dark text-white px-4 py-3 rounded-md shadow-lg animate-in slide-in-from-bottom-4">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
