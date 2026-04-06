"use client";

import { StatsStrip } from "@/components/dashboard/stats-strip";
import {
  Users,
  CalendarDays,
  Plus,
  ArrowRight,
  TrendingUp,
  Building2,
} from "lucide-react";

const stats = [
  { label: "Réservations ce mois", value: "24" },
  { label: "Couverts places", value: "156" },
  { label: "Commissions dues", value: "48 600 MAD" },
  { label: "Établissements actifs", value: "6" },
];

const pendingReservations = [
  {
    id: 1,
    venue: "Le Comptoir Darna",
    city: "Marrakech",
    guests: 8,
    tableType: "Table VIP",
    date: "Ce soir, 22:00",
    status: "confirmée",
    statusColor: "bg-emerald-100 text-emerald-800",
  },
  {
    id: 2,
    venue: "Sky Bar Casa",
    city: "Casablanca",
    guests: 4,
    tableType: "Table Standard",
    date: "Demain, 21:00",
    status: "en attente",
    statusColor: "bg-amber-100 text-amber-800",
  },
  {
    id: 3,
    venue: "Le Lotus Club",
    city: "Tanger",
    guests: 12,
    tableType: "Carré VIP",
    date: "Sam. 12 Avr., 23:00",
    status: "en attente",
    statusColor: "bg-amber-100 text-amber-800",
  },
];

const topVenues = [
  {
    rank: 1,
    name: "Le Comptoir Darna",
    city: "Marrakech",
    covers: 68,
    commission: "21 200 MAD",
  },
  {
    rank: 2,
    name: "Sky Bar Casa",
    city: "Casablanca",
    covers: 45,
    commission: "14 800 MAD",
  },
  {
    rank: 3,
    name: "Le Lotus Club",
    city: "Tanger",
    covers: 31,
    commission: "9 600 MAD",
  },
];

const recentClients = [
  { name: "Mehdi Alaoui", lastVisit: "il y a 2 jours", totalSpent: "34 500 MAD", visits: 8 },
  { name: "Sarah Cohen", lastVisit: "il y a 5 jours", totalSpent: "28 000 MAD", visits: 5 },
  { name: "Omar Tazi", lastVisit: "la semaine dernière", totalSpent: "19 200 MAD", visits: 3 },
];

export default function ConciergeDashboard() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Page Header */}
      <div className="px-8 pt-8 pb-4">
        <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-3xl font-extrabold">
          Bonjour, Concierge.
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Voici un aperçu de votre activité ce mois-ci.
        </p>
      </div>

      {/* Stats Strip */}
      <div className="px-8 pb-6">
        <div className="rounded-md overflow-hidden editorial-shadow">
          <StatsStrip stats={stats} />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Reservations */}
        <div className="lg:col-span-7">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] text-lg font-bold mb-4">
            Mes réservations récentes
          </h3>
          <div className="space-y-0 rounded-md overflow-hidden editorial-shadow">
            {pendingReservations.map((res, i) => (
              <div
                key={res.id}
                className={`p-5 ${i % 2 === 0 ? "bg-surface-card" : "bg-surface-low"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-[family-name:var(--font-manrope)] font-bold text-on-background">
                        {res.venue}
                      </span>
                      <span
                        className={`text-[0.625rem] font-semibold px-2 py-0.5 rounded-full ${res.statusColor}`}
                      >
                        {res.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Building2 size={13} strokeWidth={1.5} />
                        {res.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={13} strokeWidth={1.5} />
                        {res.guests} couverts
                      </span>
                      <span>{res.tableType}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1">
                      <CalendarDays size={12} strokeWidth={1.5} />
                      {res.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Top Venues */}
        <div className="lg:col-span-5">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] text-lg font-bold mb-4">
            Mes meilleurs établissements
          </h3>
          <div className="space-y-0 rounded-md overflow-hidden editorial-shadow">
            {topVenues.map((venue, i) => (
              <div
                key={venue.rank}
                className={`p-5 relative overflow-hidden ${
                  i % 2 === 0 ? "bg-surface-card" : "bg-surface-low"
                }`}
              >
                <span className="absolute -right-2 -top-3 text-[5rem] font-[family-name:var(--font-manrope)] font-extrabold text-primary/[0.04] leading-none select-none pointer-events-none">
                  {venue.rank}
                </span>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-[family-name:var(--font-manrope)] font-bold text-on-background">
                      {venue.name}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-3">{venue.city}</p>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                        Couverts
                      </p>
                      <p className="text-on-background font-[family-name:var(--font-manrope)] font-bold text-lg">
                        {venue.covers}
                      </p>
                    </div>
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                        Commission
                      </p>
                      <p className="text-on-background font-[family-name:var(--font-manrope)] font-bold text-lg flex items-center gap-1">
                        {venue.commission}
                        <TrendingUp size={14} strokeWidth={1.5} className="text-green-600" />
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Clients */}
      <div className="px-8 pb-8">
        <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] text-lg font-bold mb-4">
          Clients récents
        </h3>
        <div className="bg-surface-card rounded-md editorial-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-low">
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Client
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Dernière visite
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Dépenses totales
                  </th>
                  <th className="text-left px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Visites
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentClients.map((client, i) => (
                  <tr key={client.name} className={i % 2 === 0 ? "bg-surface-card" : "bg-surface-low/50"}>
                    <td className="px-6 py-3.5 text-on-background font-medium">{client.name}</td>
                    <td className="px-6 py-3.5 text-on-surface-variant">{client.lastVisit}</td>
                    <td className="px-6 py-3.5 text-on-background font-medium">{client.totalSpent}</td>
                    <td className="px-6 py-3.5 text-on-background">{client.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 pb-10">
        <div className="bg-surface-low rounded-md p-5 flex items-center gap-4 flex-wrap">
          <a
            href="/concierge/reservations"
            className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={16} strokeWidth={1.5} />
            Nouvelle réservation
          </a>
          <a
            href="/concierge/venues"
            className="flex items-center gap-2 bg-surface-mid text-on-background text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-surface-high transition-colors"
          >
            <Building2 size={16} strokeWidth={1.5} />
            Parcourir les établissements
          </a>
          <a
            href="/concierge/commissions"
            className="flex items-center gap-1 text-primary-dark text-sm font-medium hover:underline ml-2"
          >
            Voir mes commissions
            <ArrowRight size={14} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
}
