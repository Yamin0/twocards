"use client";

import {
  Search,
  ChevronDown,
  UserPlus,
  MapPin,
  Users,
  TrendingUp,
  Percent,
  DollarSign,
  ArrowRight,
  Star,
} from "lucide-react";

const stats = [
  { label: "RP Actifs", value: "34", icon: Users },
  { label: "Couverts mois", value: "127", icon: Users },
  { label: "CA genere via RP", value: "89 300 MAD", icon: DollarSign },
  { label: "Taux Com. Moyen", value: "10%", icon: Percent },
];

const prCards = [
  {
    initials: "YA",
    name: "Youssef Alaoui",
    agency: "Nuit Blanche Agency",
    status: "Actif",
    location: "Casablanca",
    couverts: 48,
    ca: "24 800 MAD",
    commission: "2 480 MAD",
    color: "bg-primary",
  },
  {
    initials: "AB",
    name: "Amira Benjelloun",
    agency: "Prestige Connect",
    status: "Actif",
    location: "Casablanca",
    couverts: 36,
    ca: "19 200 MAD",
    commission: "1 920 MAD",
    color: "bg-emerald-600",
  },
  {
    initials: "OT",
    name: "Omar Tazi",
    agency: "Independent",
    status: "Actif",
    location: "Marrakech",
    couverts: 24,
    ca: "14 500 MAD",
    commission: "1 450 MAD",
    color: "bg-violet-600",
  },
  {
    initials: "SC",
    name: "Salma Chraibi",
    agency: "VIP Casablanca",
    status: "En attente",
    location: "Tanger",
    couverts: 12,
    ca: "8 300 MAD",
    commission: "830 MAD",
    color: "bg-amber-600",
  },
  {
    initials: "MF",
    name: "Mehdi Fassi-Fihri",
    agency: "Nuit Blanche Agency",
    status: "Inactif",
    location: "Casablanca",
    couverts: 7,
    ca: "3 200 MAD",
    commission: "320 MAD",
    color: "bg-rose-600",
  },
];

const monthlyCA = [
  { month: "Oct", value: 62 },
  { month: "Nov", value: 71 },
  { month: "Dec", value: 89 },
  { month: "Jan", value: 58 },
  { month: "Fev", value: 74 },
  { month: "Mar", value: 85 },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Actif: "bg-emerald-100 text-emerald-800",
    "En attente": "bg-amber-100 text-amber-800",
    Inactif: "bg-surface-mid text-on-surface-variant",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium ${map[status] ?? "bg-surface-mid text-on-surface-variant"}`}
    >
      {status}
    </span>
  );
}

export default function NetworkPage() {
  return (
    <div className="bg-surface min-h-screen">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary-dark font-[family-name:var(--font-manrope)]">
          Votre Reseau de RP
        </h1>
        <button className="inline-flex items-center gap-2 bg-primary text-white rounded-sm px-5 py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors">
          <UserPlus className="h-4 w-4" strokeWidth={1.5} />
          Inviter un RP
        </button>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Rechercher un RP par nom, agence ou ville..."
            className="w-full bg-surface-low border-none rounded-sm py-3 pl-11 pr-4 text-sm text-on-background placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Stats Strip */}
      <div className="px-6 pb-6">
        <div className="bg-primary-container rounded-md p-5 grid grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-primary-container">
                {s.label}
              </p>
              <p className="text-xl font-semibold text-white font-[family-name:var(--font-manrope)] mt-1">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-6 flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center gap-1.5 bg-surface-mid rounded-sm px-3 py-2 text-sm text-on-surface-variant">
          Statut
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <button className="inline-flex items-center gap-1.5 bg-surface-mid rounded-sm px-3 py-2 text-sm text-on-surface-variant">
          Ville
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <button className="inline-flex items-center gap-1.5 bg-surface-mid rounded-sm px-3 py-2 text-sm text-on-surface-variant">
          Performance
          <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <div className="ml-auto">
          <button className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant">
            Trier par: CA
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* PR Cards Grid */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {prCards.map((pr) => (
            <div
              key={pr.name}
              className="bg-surface-card rounded-md editorial-shadow p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-11 w-11 rounded-full ${pr.color} flex items-center justify-center`}
                  >
                    <span className="text-sm font-semibold text-white">
                      {pr.initials}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-background">
                      {pr.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">{pr.agency}</p>
                  </div>
                </div>
                {statusBadge(pr.status)}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-4">
                <MapPin className="h-3 w-3" strokeWidth={1.5} />
                {pr.location}
              </div>

              <div className="bg-surface-low rounded-md p-3 grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                    Couverts
                  </p>
                  <p className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                    {pr.couverts}
                  </p>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                    CA
                  </p>
                  <p className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                    {pr.ca}
                  </p>
                </div>
                <div>
                  <p className="font-[family-name:var(--font-inter)] text-[0.6875rem] uppercase tracking-[0.05em] text-on-surface-variant">
                    Commission due
                  </p>
                  <p className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                    {pr.commission}
                  </p>
                </div>
              </div>

              <button className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:text-primary-dark transition-colors">
                Voir le Profil
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ))}

          {/* Invitation Card */}
          <div className="rounded-md border-2 border-dashed border-outline-variant/40 p-5 flex flex-col items-center justify-center text-center min-h-[280px]">
            <div className="h-12 w-12 rounded-full bg-surface-low flex items-center justify-center mb-3">
              <UserPlus className="h-5 w-5 text-on-surface-variant" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-primary-dark font-[family-name:var(--font-manrope)] mb-1">
              Etendre votre reseau
            </h3>
            <p className="text-xs text-on-surface-variant mb-4 max-w-[200px]">
              Invitez de nouveaux RP pour developper votre activite
            </p>
            <button className="inline-flex items-center gap-2 bg-primary text-white rounded-sm px-4 py-2 text-sm font-medium hover:bg-primary-dark transition-colors">
              Envoyer une invitation
            </button>
          </div>
        </div>
      </div>

      {/* Trends Section */}
      <div className="px-6 pb-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Monthly CA Progression */}
        <div className="lg:col-span-3 bg-surface-card rounded-md editorial-shadow p-5">
          <h2 className="text-base font-semibold text-primary-dark font-[family-name:var(--font-manrope)] mb-5">
            Progression CA mensuel
          </h2>
          <div className="flex items-end gap-3 h-40">
            {monthlyCA.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-on-background">
                  {m.value}k
                </span>
                <div
                  className="w-full bg-primary/20 rounded-t-sm relative overflow-hidden"
                  style={{ height: `${(m.value / 100) * 100}%` }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm"
                    style={{ height: `${(m.value / 89) * 100}%` }}
                  />
                </div>
                <span className="text-[0.625rem] text-on-surface-variant">
                  {m.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Best Performer */}
        <div className="lg:col-span-2 bg-surface-card rounded-md editorial-shadow p-5">
          <h2 className="text-base font-semibold text-primary-dark font-[family-name:var(--font-manrope)] mb-5">
            Meilleur performeur
          </h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
              <span className="text-lg font-semibold text-white">YA</span>
            </div>
            <div>
              <p className="text-base font-medium text-on-background">
                Youssef Alaoui
              </p>
              <p className="text-sm text-on-surface-variant">Nuit Blanche Agency</p>
            </div>
          </div>

          <div className="bg-surface-low rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">CA ce mois</span>
              <span className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                24 800 MAD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">Couverts</span>
              <span className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                48
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-on-surface-variant">Taux conversion</span>
              <span className="text-sm font-semibold text-on-background font-[family-name:var(--font-manrope)]">
                87%
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" strokeWidth={1.5} />
            <span className="text-xs text-on-surface-variant">
              Top performeur depuis 3 mois consecutifs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
