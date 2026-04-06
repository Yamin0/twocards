"use client";

import { Download } from "lucide-react";
import { StatsStrip } from "@/components/dashboard/stats-strip";

const stats = [
  { label: "Total ce mois", value: "48 600 MAD" },
  { label: "En attente", value: "18 800 MAD" },
  { label: "Versé", value: "29 800 MAD" },
  { label: "Taux moyen", value: "10%" },
];

const commissions = [
  { id: 1, venue: "Le Comptoir Darna", client: "Mehdi Alaoui", date: "6 Avr.", montant: "6 400 MAD", status: "versé" },
  { id: 2, venue: "Sky Bar Casa", client: "Sarah Cohen", date: "5 Avr.", montant: "2 800 MAD", status: "versé" },
  { id: 3, venue: "Le Lotus Club", client: "Omar Tazi", date: "4 Avr.", montant: "9 600 MAD", status: "en attente" },
  { id: 4, venue: "Le Comptoir Darna", client: "Lina Berrada", date: "3 Avr.", montant: "4 200 MAD", status: "versé" },
  { id: 5, venue: "Pacha Marrakech", client: "Youssef Fassi", date: "2 Avr.", montant: "7 800 MAD", status: "en attente" },
  { id: 6, venue: "Sky Bar Casa", client: "Amira Benjelloun", date: "1 Avr.", montant: "3 200 MAD", status: "versé" },
  { id: 7, venue: "Le Comptoir Darna", client: "Karim Tazi", date: "31 Mar.", montant: "5 400 MAD", status: "versé" },
  { id: 8, venue: "Le Lotus Club", client: "Nadia Chraibi", date: "30 Mar.", montant: "9 200 MAD", status: "en attente" },
];

export default function ConciergeCommissionsPage() {
  return (
    <div className="bg-surface min-h-screen">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-2xl font-extrabold">
            Mes commissions
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Suivez vos gains et l&apos;historique de vos versements.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-surface-mid text-on-background text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-surface-high transition-colors">
          <Download size={16} strokeWidth={1.5} />
          Exporter
        </button>
      </div>

      {/* Stats */}
      <div className="px-8 pb-6">
        <div className="rounded-md overflow-hidden editorial-shadow">
          <StatsStrip stats={stats} />
        </div>
      </div>

      {/* Table */}
      <div className="px-8 pb-8">
        <div className="bg-surface-card rounded-md editorial-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-low">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Établissement</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Client</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Montant</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Statut</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-surface-card" : "bg-surface-low/50"}>
                    <td className="px-6 py-3.5 text-on-background font-medium">{c.venue}</td>
                    <td className="px-6 py-3.5 text-on-background">{c.client}</td>
                    <td className="px-6 py-3.5 text-on-surface-variant">{c.date}</td>
                    <td className="px-6 py-3.5 text-on-background font-bold">{c.montant}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-[0.625rem] font-semibold px-2 py-0.5 rounded-full ${
                        c.status === "versé" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {c.status}
                      </span>
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
