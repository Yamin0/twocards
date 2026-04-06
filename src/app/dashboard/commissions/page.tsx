"use client";

import { Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatsStrip } from "@/components/dashboard/stats-strip";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

const DEMO_STATS = [
  { label: "Total Commissions", value: "6 600 MAD" },
  { label: "En attente", value: "1 220 MAD" },
  { label: "Payées ce mois", value: "5 380 MAD" },
  { label: "Prochain paiement", value: "01/05" },
];

const EMPTY_STATS = [
  { label: "Total Commissions", value: "0 MAD" },
  { label: "En attente", value: "0 MAD" },
  { label: "Payées ce mois", value: "0 MAD" },
  { label: "Prochain paiement", value: "—" },
];

const DEMO_COMMISSIONS = [
  {
    date: "28 Oct 2025",
    rp: "Samy Benchekroun",
    event: "Soirée VIP Vendredis",
    montant: "1 870 MAD",
    statut: "Payé",
    variant: "success" as const,
  },
  {
    date: "25 Oct 2025",
    rp: "Yasmine El Idrissi",
    event: "Nuit Blanche Spécial",
    montant: "1 530 MAD",
    statut: "Payé",
    variant: "success" as const,
  },
  {
    date: "22 Oct 2025",
    rp: "Amine Tazi",
    event: "DJ Set International",
    montant: "1 480 MAD",
    statut: "En cours",
    variant: "warning" as const,
  },
  {
    date: "18 Oct 2025",
    rp: "Nadia Berrada",
    event: "Soirée Privée Champagne",
    montant: "820 MAD",
    statut: "En attente",
    variant: "default" as const,
  },
  {
    date: "15 Oct 2025",
    rp: "Reda Mohammedi",
    event: "After Work Premium",
    montant: "480 MAD",
    statut: "En attente",
    variant: "default" as const,
  },
  {
    date: "12 Oct 2025",
    rp: "Samy Benchekroun",
    event: "Brunch Dimanche",
    montant: "1 420 MAD",
    statut: "Payé",
    variant: "success" as const,
  },
];

export default function CommissionsPage() {
  const { isDemoVenue, isLoading } = useAuthUser();
  const { toast, showToast } = useToast();

  const stats = isDemoVenue ? DEMO_STATS : EMPTY_STATS;
  const commissions = isDemoVenue ? DEMO_COMMISSIONS : [];

  const handleExport = () => {
    if (commissions.length === 0) {
      showToast("Aucune donnée à exporter");
      return;
    }
    const headers = ["Date", "RP", "Événement", "Montant", "Statut"];
    const csv = [
      headers.join(","),
      ...commissions.map((c) =>
        [c.date, c.rp, c.event, c.montant, c.statut].map((v) => `"${v}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "commissions-twocards.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV téléchargé");
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div>
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-extrabold font-[family-name:var(--font-manrope)] text-primary-dark">
          Commissions
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Suivez et gérez les commissions de votre réseau RP.
        </p>
      </div>

      {/* Stats Strip */}
      <StatsStrip stats={stats} />

      {/* Commission Table */}
      <div className="p-6">
        <div className="bg-surface-card rounded-md editorial-shadow overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-bold font-[family-name:var(--font-manrope)] text-primary-dark">
              Historique des commissions
            </h2>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-sm text-xs font-medium hover:bg-primary-dark transition-colors"
            >
              <Download size={14} strokeWidth={1.5} />
              Exporter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-low">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Date
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    RP
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Événement
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Montant
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-on-surface-variant">
                      Aucune commission enregistrée
                    </td>
                  </tr>
                )}
                {commissions.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-surface-card" : "bg-surface-low/50"}
                  >
                    <td className="px-6 py-3.5 text-on-surface-variant text-xs">
                      {row.date}
                    </td>
                    <td className="px-6 py-3.5 text-on-background font-medium">
                      {row.rp}
                    </td>
                    <td className="px-6 py-3.5 text-on-background">
                      {row.event}
                    </td>
                    <td className="px-6 py-3.5 text-on-background font-bold">
                      {row.montant}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={row.statut} variant={row.variant} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary-dark text-white px-4 py-3 rounded-md shadow-lg">
          <Check size={16} strokeWidth={2} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
