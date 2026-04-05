"use client";

import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  Euro,
  Building2,
  Plus,
  Search,
} from "lucide-react";

const stats = [
  {
    label: "Reservations totales",
    value: "148",
    icon: CalendarDays,
  },
  {
    label: "Approbations en attente",
    value: "24",
    icon: Clock,
  },
  {
    label: "Commissions gagnees",
    value: "4 850 \u20ac",
    icon: Euro,
  },
  {
    label: "Etablissements actifs",
    value: "12",
    icon: Building2,
  },
];

const upcomingEvents = [
  {
    name: "Nuit Blanche",
    venue: "Le Phantom Club",
    date: "Ven 28 Oct",
    time: "23:00",
    spots: 42,
  },
  {
    name: "Gala de Minuit",
    venue: "Maison Dorée",
    date: "Sam 29 Oct",
    time: "22:00",
    spots: 113,
  },
  {
    name: "Soirée Tropicale",
    venue: "Jardin Perché",
    date: "Jeu 3 Nov",
    time: "20:00",
    spots: 67,
  },
  {
    name: "After Dark Sessions",
    venue: "Le Phantom Club",
    date: "Ven 4 Nov",
    time: "00:00",
    spots: 28,
  },
];

const recentReservations = [
  {
    guest: "Alexandre Petit",
    venue: "Maison Dorée",
    date: "24 Oct",
    covers: 6,
    status: "Confirmee",
    statusColor: "bg-green-100 text-green-800",
  },
  {
    guest: "Isabelle Moreau",
    venue: "Le Phantom Club",
    date: "24 Oct",
    covers: 4,
    status: "En attente",
    statusColor: "bg-amber-100 text-amber-800",
  },
  {
    guest: "Thomas Laurent",
    venue: "Jardin Perché",
    date: "23 Oct",
    covers: 8,
    status: "Confirmee",
    statusColor: "bg-green-100 text-green-800",
  },
  {
    guest: "Marie Dubois",
    venue: "Maison Dorée",
    date: "23 Oct",
    covers: 2,
    status: "Refusee",
    statusColor: "bg-red-100 text-red-800",
  },
  {
    guest: "Nicolas Fabre",
    venue: "Le Phantom Club",
    date: "22 Oct",
    covers: 10,
    status: "Confirmee",
    statusColor: "bg-green-100 text-green-800",
  },
];

export default function ReservationsPage() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-3xl font-extrabold">
          Bonjour, Marc.
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Gerez vos reservations et suivez vos performances.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="px-8 pb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="bg-surface-card rounded-md editorial-shadow p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <stat.icon size={20} strokeWidth={1.5} className="text-primary-dark" />
            </div>
            <div>
              <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold">
                {stat.label}
              </p>
              <p className="text-on-background font-[family-name:var(--font-manrope)] font-extrabold text-2xl mt-0.5">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Events */}
        <div className="lg:col-span-5">
          <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] text-lg font-bold mb-4">
            Evenements a venir
          </h3>
          <div className="rounded-md overflow-hidden editorial-shadow">
            {upcomingEvents.map((event, i) => (
              <div
                key={i}
                className={`p-4 ${i % 2 === 0 ? "bg-surface-card" : "bg-surface-low"}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-[family-name:var(--font-manrope)] font-bold text-on-background">
                      {event.name}
                    </p>
                    <p className="text-sm text-on-surface-variant mt-0.5">{event.venue}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-on-background">{event.date}</p>
                    <p className="text-xs text-on-surface-variant">{event.time}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <Users size={12} strokeWidth={1.5} />
                  <span>{event.spots} places restantes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Reservations */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-primary-dark font-[family-name:var(--font-manrope)] text-lg font-bold">
              Reservations recentes
            </h3>
            <div className="relative">
              <Search
                size={14}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-surface-low border-none text-sm pl-8 pr-4 py-2 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-container w-48"
              />
            </div>
          </div>
          <div className="rounded-md overflow-hidden editorial-shadow">
            {/* Table Header */}
            <div className="bg-surface-mid px-4 py-3 grid grid-cols-12 gap-2">
              {["Invite", "Etablissement", "Date", "Couverts", "Statut"].map(
                (header, i) => (
                  <span
                    key={i}
                    className={`font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant font-semibold ${
                      i === 0
                        ? "col-span-3"
                        : i === 1
                          ? "col-span-3"
                          : i === 2
                            ? "col-span-2"
                            : i === 3
                              ? "col-span-2"
                              : "col-span-2"
                    }`}
                  >
                    {header}
                  </span>
                )
              )}
            </div>

            {/* Table Rows */}
            {recentReservations.map((res, i) => (
              <div
                key={i}
                className={`px-4 py-3 grid grid-cols-12 gap-2 items-center ${
                  i % 2 === 0 ? "bg-surface-card" : "bg-surface-low"
                }`}
              >
                <span className="col-span-3 text-sm font-medium text-on-background truncate">
                  {res.guest}
                </span>
                <span className="col-span-3 text-sm text-on-surface-variant truncate">
                  {res.venue}
                </span>
                <span className="col-span-2 text-sm text-on-surface-variant">
                  {res.date}
                </span>
                <span className="col-span-2 text-sm text-on-background font-medium">
                  {res.covers}
                </span>
                <span className="col-span-2">
                  <span
                    className={`text-[0.6875rem] font-semibold px-2.5 py-1 rounded-full ${res.statusColor}`}
                  >
                    {res.status}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 pb-10">
        <div className="bg-surface-low rounded-md p-5 flex items-center gap-4">
          <a
            href="/dashboard/reservations/new"
            className="flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={16} strokeWidth={1.5} />
            Nouvelle Reservation
          </a>
          <a
            href="/dashboard/events"
            className="flex items-center gap-2 bg-surface-mid text-on-background text-sm font-medium px-5 py-2.5 rounded-sm hover:bg-surface-high transition-colors"
          >
            <Search size={16} strokeWidth={1.5} />
            Parcourir les Evenements
          </a>
        </div>
      </div>
    </div>
  );
}
