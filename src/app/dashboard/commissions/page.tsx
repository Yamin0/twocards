"use client";

import { Download } from "lucide-react";
import { StatsStrip } from "@/components/dashboard/stats-strip";
import { StatusBadge } from "@/components/shared/status-badge";

const stats = [
  { label: "Total Commissions", value: "6 600 MAD" },
  { label: "En attente", value: "1 220 MAD" },
  { label: "Payées ce mois", value: "5 380 MAD" },
  { label: "Prochain paiement", value: "01/05" },
];

const commissions = [
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
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-sm text-xs font-medium hover:bg-primary-dark transition-colors">
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
    </div>
  );
}
