"use client";

import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  CreditCard,
  BarChart3,
  MessageSquare,
  Building2,
  Ticket,
  ArrowRight,
  TrendingUp,
  Search,
  Bell,
  Plus,
} from "lucide-react";

const folders = [
  {
    label: "Calendrier",
    description: "Événements à venir et passés",
    href: "/concierge/reservations",
    icon: CalendarDays,
    iconColor: "text-blue-400",
    preview: ["12 événements cette semaine", "OPENING NIGHT — Jeu. 24"],
  },
  {
    label: "CRM Clients",
    description: "Base de données et suivi clients",
    href: "/concierge/clients",
    icon: Users,
    iconColor: "text-green-400",
    preview: ["326 clients actifs", "48 nouveaux ce mois"],
  },
  {
    label: "Commissions",
    description: "Suivi de vos gains et paiements",
    href: "/concierge/commissions",
    icon: CreditCard,
    iconColor: "text-amber-400",
    preview: ["124 000 MAD ce mois", "8 paiements en attente"],
  },
  {
    label: "Statistiques",
    description: "Performances et analyses",
    href: "/concierge/stats",
    icon: BarChart3,
    iconColor: "text-purple-400",
    preview: ["+22% de listes vs mois dernier", "Taux de conversion: 68%"],
  },
  {
    label: "Messages",
    description: "Conversations avec les établissements",
    href: "/concierge/messages",
    icon: MessageSquare,
    iconColor: "text-indigo-400",
    preview: ["3 messages non lus", "Le Comptoir — Confirmation VIP"],
  },
  {
    label: "Établissements",
    description: "Vos partenaires et lieux affiliés",
    href: "/concierge/venues",
    icon: Building2,
    iconColor: "text-sky-400",
    preview: ["4 établissements actifs", "Le Comptoir, Sky Bar, Le Lotus..."],
  },
];

const DEMO_STATS = [
  {
    label: "Listes cette semaine",
    value: "18",
    icon: Ticket,
    trend: "+5",
    color: "text-blue-400",
  },
  {
    label: "Entrées confirmées",
    value: "142",
    icon: Users,
    trend: "+22%",
    color: "text-green-400",
  },
  {
    label: "Événements à venir",
    value: "12",
    icon: CalendarDays,
    trend: null,
    color: "text-purple-400",
  },
  {
    label: "Gains du mois",
    value: "124K MAD",
    icon: TrendingUp,
    trend: "+18%",
    color: "text-yellow-400",
  },
];

export default function ConciergePage() {
  const { isDemoConcierge, isLoading, fullName } = useAuthUser();

  if (isLoading) return <ConciergeSkeleton />;

  const stats = isDemoConcierge ? DEMO_STATS : [];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-manrope)]">
              Bonjour, {fullName || "Concierge"}.
            </h1>
            <p className="text-white/50 text-sm mt-1">
              Votre espace concierge en un coup d&apos;œil
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 h-4 w-4" />
              <input
                placeholder="Rechercher..."
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all w-48"
              />
            </div>
            <button className="p-2.5 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all">
              <Bell size={18} strokeWidth={1.5} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/25 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02]">
              <Plus size={16} strokeWidth={1.5} />
              <span className="hidden sm:inline">Nouvelle liste</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {isDemoConcierge && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-5 transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.1]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/50 text-xs font-[family-name:var(--font-inter)]">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1 font-[family-name:var(--font-manrope)]">
                      {stat.value}
                    </p>
                    {stat.trend && (
                      <p className={`text-sm ${stat.color} mt-0.5`}>{stat.trend}</p>
                    )}
                  </div>
                  <Icon size={28} strokeWidth={1.5} className={stat.color} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Folder Cards */}
      <div className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white font-[family-name:var(--font-manrope)]">
              Vos espaces
            </h2>
            <p className="text-white/40 text-sm mt-0.5">Cliquez pour accéder à un espace</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {folders.map((folder) => {
            const Icon = folder.icon;
            return (
              <Link
                key={folder.href}
                href={folder.href}
                className="group flex flex-col p-5 bg-white/5 rounded-2xl border border-white/[0.08] hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Icon size={20} strokeWidth={1.5} className={folder.iconColor} />
                  </div>
                  <ArrowRight
                    size={14}
                    strokeWidth={1.5}
                    className="text-white/0 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-300"
                  />
                </div>
                <h3 className="font-semibold text-white text-sm font-[family-name:var(--font-manrope)] mb-1">
                  {folder.label}
                </h3>
                <p className="text-xs text-white/40 mb-3">{folder.description}</p>

                {isDemoConcierge && (
                  <div className="space-y-1.5 pt-3 border-t border-white/[0.08] mt-auto">
                    {folder.preview.map((line, i) => (
                      <p
                        key={i}
                        className="text-[0.6875rem] text-white/50 leading-tight flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
