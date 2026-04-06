"use client";

import { useState } from "react";
import { StatsStrip } from "@/components/dashboard/stats-strip";
import {
  Clock,
  Users,
  CheckCircle,
  XCircle,
  CalendarDays,
  Plus,
  ArrowRight,
  TrendingUp,
  Utensils,
} from "lucide-react";

const stats = [
  { label: "Couverts ce soir", value: "38" },
  { label: "Demandes en attente", value: "12" },
  { label: "RP Actifs", value: "34" },
  { label: "Revenu mensuel", value: "782 000 MAD" },
];

const requests = [
  {
    id: 1,
    prName: "Karim Bennani",
    badge: "RP Or",
    badgeColor: "bg-amber-100 text-amber-800",
    guests: 8,
    tableType: "Table VIP",
    timeAgo: "il y a 12 min",
    note: "Client fidèle, 3e réservation ce mois",
  },
  {
    id: 2,
    prName: "Lina Fassi",
    badge: "Junior",
    badgeColor: "bg-surface-mid text-on-surface-variant",
    guests: 4,
    tableType: "Table Standard",
    timeAgo: "il y a 34 min",
    note: "Première réservation avec nous",
  },
  {
    id: 3,
    prName: "Sofia El Amrani",
    badge: "RP Or",
    badgeColor: "bg-amber-100 text-amber-800",
    guests: 12,
    tableType: "Carré VIP",
    timeAgo: "il y a 1h",
    note: "Demande bouteilles Dom Pérignon x3",
  },
];

const topPRs = [
  {
    rank: 1,
    name: "Karim Bennani",
    agency: "Prestige Marrakech",
    covers: 52,
    revenue: "286 000 MAD",
  },
  {
    rank: 2,
    name: "Sofia El Amrani",
    agency: "SA Concierge",
    covers: 41,
    revenue: "221 000 MAD",
  },
  {
    rank: 3,
    name: "Riad Lahlou",
    agency: "Nuit de Casablanca",
    covers: 28,
    revenue: "154 000 MAD",
  },
];

export default function DashboardPage() {
  const [activeRequests, setActiveRequests] = useState(requests);

  const handleAccept = (id: number) => {
    setActiveRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRefuse = (id: number) => {
    setActiveRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="bg-surface min-h-screen">
      {/* Page Header */}
      <div className="px-8 pt-8 pb-4">
        <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-3xl font-extrabold">
          Bonjour, Directeur.
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Voici un aperçu de votre établissement ce soir.
        </p>
      </div>

      {/* Stats Strip */}
      <div className="px-8 pb-6">
        <div className="rounded-md overflow-hidden editorial-shadow">
          <StatsStrip stats={stats} />
        </div>
      </div>

      {/* Tonight's Event Card */}
      <div className="px-8 pb-8">
        <div className="bg-surface-card rounded-md editorial-shadow p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold mb-1">
                Événement ce soir
              </p>
              <h2 className="text-primary-dark font-[family-name:var(--font-manrope)] text-xl font-bold">
                Gala de Minuit
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={15} strokeWidth={1.5} />
                  Samedi 24 Octobre
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} strokeWidth={1.5} />
                  23:00 &ndash; 05:00
                </span>
              </div>
            </div>
            <span className="bg-primary/10 text-primary-dark text-xs font-semibold px-3 py-1 rounded-full">
              En cours
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex items-end justify-between mb-2">
              <span className="text-sm font-medium text-on-background">
                187 / 300 couverts confirmés
              </span>
              <span className="text-sm font-bold text-primary-dark">62%</span>
            </div>
            <div className="w-full h-2 bg-surface-low rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: "62%" }}
              />
            </div>
          </div>

          {/* Table Availability */}
          <div className="mt-4 flex gap-6">
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <Utensils size={14} strokeWidth={1.5} />
              <span>
                <strong className="text-on-background">8</strong> tables VIP disponibles
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <Users size={14} strokeWidth={1.5} />
              <span>
                <strong className="text-on-background">14</strong> tables standard disponibles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Incoming Requests */}
        <div className="lg:col-span-7">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] text-lg font-bold mb-4">
            Demandes entrantes
          </h3>
          <div className="space-y-0 rounded-md overflow-hidden editorial-shadow">
            {activeRequests.map((req, i) => (
              <div
                key={req.id}
                className={`p-5 ${i % 2 === 0 ? "bg-surface-card" : "bg-surface-low"}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-[family-name:var(--font-manrope)] font-bold text-on-background">
                        {req.prName}
                      </span>
                      <span
                        className={`text-[0.625rem] font-semibold px-2 py-0.5 rounded-full ${req.badgeColor}`}
                      >
                        {req.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Users size={13} strokeWidth={1.5} />
                        {req.guests} couverts
                      </span>
                      <span>{req.tableType}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} strokeWidth={1.5} />
                        {req.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1.5">{req.note}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => handleAccept(req.id)}
                      className="flex items-center gap-1.5 bg-primary text-white text-sm font-medium px-4 py-2 rounded-sm hover:opacity-90 transition-opacity"
                    >
                      <CheckCircle size={14} strokeWidth={1.5} />
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRefuse(req.id)}
                      className="flex items-center gap-1.5 bg-surface-mid text-on-background text-sm font-medium px-4 py-2 rounded-sm hover:bg-surface-high transition-colors"
                    >
                      <XCircle size={14} strokeWidth={1.5} />
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {activeRequests.length === 0 && (
              <div className="bg-surface-card p-8 text-center text-on-surface-variant text-sm">
                Aucune demande en attente.
              </div>
            )}
          </div>
        </div>

        {/* Right: Top PRs */}
        <div className="lg:col-span-5">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] text-lg font-bold mb-4">
            Top RP du mois
          </h3>
          <div className="space-y-0 rounded-md overflow-hidden editorial-shadow">
            {topPRs.map((pr, i) => (
              <div
                key={pr.rank}
                className={`p-5 relative overflow-hidden ${
                  i % 2 === 0 ? "bg-surface-card" : "bg-surface-low"
                }`}
              >
                {/* Large faded rank number */}
                <span className="absolute -right-2 -top-3 text-[5rem] font-[family-name:var(--font-manrope)] font-extrabold text-primary/[0.04] leading-none select-none pointer-events-none">
                  {pr.rank}
                </span>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-[family-name:var(--font-manrope)] font-bold text-on-background">
                      {pr.name}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-3">{pr.agency}</p>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                        Couverts
                      </p>
                      <p className="text-on-background font-[family-name:var(--font-manrope)] font-bold text-lg">
                        {pr.covers}
                      </p>
                    </div>
                    <div>
                      <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                        Revenu
                      </p>
                      <p className="text-on-background font-[family-name:var(--font-manrope)] font-bold text-lg flex items-center gap-1">
                        {pr.revenue}
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

      {/* Quick Actions */}
      <div className="px-8 pb-10">
        <div className="bg-surface-low rounded-md p-5 flex items-center gap-4">
          <a
            href="/dashboard/events"
            className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={16} strokeWidth={1.5} />
            Créer un événement
          </a>
          <a
            href="/dashboard/reservations"
            className="flex items-center gap-2 bg-surface-mid text-on-background text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-surface-high transition-colors"
          >
            Voir toutes les réservations
          </a>
          <a
            href="/dashboard/network"
            className="flex items-center gap-1 text-primary-dark text-sm font-medium hover:underline ml-2"
          >
            Gérer le réseau RP
            <ArrowRight size={14} strokeWidth={1.5} />
          </a>
        </div>
      </div>
    </div>
  );
}
