"use client";

import { useState } from "react";
import {
  Plus,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";

const reservations = [
  { id: 1, venue: "Le Comptoir Darna", city: "Marrakech", client: "Mehdi Alaoui", guests: 8, table: "VIP 3", date: "6 Avr. 2026", time: "22:00", status: "confirmée", commission: "6 400 MAD" },
  { id: 2, venue: "Sky Bar Casa", city: "Casablanca", client: "Sarah Cohen", guests: 4, table: "Standard 7", date: "7 Avr. 2026", time: "21:00", status: "en attente", commission: "2 800 MAD" },
  { id: 3, venue: "Le Lotus Club", city: "Tanger", client: "Omar Tazi", guests: 12, table: "Carré VIP", date: "12 Avr. 2026", time: "23:00", status: "en attente", commission: "9 600 MAD" },
  { id: 4, venue: "Le Comptoir Darna", city: "Marrakech", client: "Lina Berrada", guests: 6, table: "VIP 1", date: "5 Avr. 2026", time: "21:30", status: "confirmée", commission: "4 200 MAD" },
  { id: 5, venue: "Pacha Marrakech", city: "Marrakech", client: "Youssef Fassi", guests: 10, table: "VIP 5", date: "4 Avr. 2026", time: "23:30", status: "refusée", commission: "—" },
];

const statusIcon = (s: string) => {
  if (s === "confirmée") return <CheckCircle size={14} strokeWidth={1.5} className="text-emerald-600" />;
  if (s === "en attente") return <Clock size={14} strokeWidth={1.5} className="text-amber-600" />;
  return <XCircle size={14} strokeWidth={1.5} className="text-red-500" />;
};

const statusBadge = (s: string) => {
  if (s === "confirmée") return "bg-emerald-100 text-emerald-800";
  if (s === "en attente") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
};

export default function ConciergeReservationsPage() {
  const [filter, setFilter] = useState("toutes");

  const filtered = filter === "toutes" ? reservations : reservations.filter((r) => r.status === filter);

  return (
    <div className="bg-surface min-h-screen">
      <div className="px-8 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-2xl font-extrabold">
            Mes réservations
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            Suivez et gérez toutes vos réservations.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity">
          <Plus size={16} strokeWidth={1.5} />
          Nouvelle réservation
        </button>
      </div>

      {/* Filters */}
      <div className="px-8 pb-6 flex items-center gap-3">
        {["toutes", "confirmée", "en attente", "refusée"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              filter === f ? "bg-primary text-white" : "bg-surface-low text-on-surface-variant hover:bg-surface-mid"
            }`}
          >
            {f}
          </button>
        ))}
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
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Couverts</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Table</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Statut</th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Commission</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((res, i) => (
                  <tr key={res.id} className={i % 2 === 0 ? "bg-surface-card" : "bg-surface-low/50"}>
                    <td className="px-6 py-3.5">
                      <p className="text-on-background font-medium">{res.venue}</p>
                      <p className="text-xs text-on-surface-variant">{res.city}</p>
                    </td>
                    <td className="px-6 py-3.5 text-on-background">{res.client}</td>
                    <td className="px-6 py-3.5 text-on-background">{res.guests}</td>
                    <td className="px-6 py-3.5 text-on-background">{res.table}</td>
                    <td className="px-6 py-3.5 text-on-surface-variant">{res.date} - {res.time}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[0.625rem] font-semibold px-2 py-0.5 rounded-full ${statusBadge(res.status)}`}>
                        {statusIcon(res.status)}
                        {res.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-on-background font-medium">{res.commission}</td>
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
