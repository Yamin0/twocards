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
  Clock,
} from "lucide-react";

const folders = [
  {
    label: "Calendrier",
    description: "Événements à venir et passés",
    href: "/concierge/reservations",
    icon: CalendarDays,
    color: "from-blue-500/10 to-blue-600/5",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    preview: ["12 événements cette semaine", "OPENING NIGHT — Jeu. 24"],
  },
  {
    label: "CRM Clients",
    description: "Base de données et suivi clients",
    href: "/concierge/clients",
    icon: Users,
    color: "from-green-500/10 to-green-600/5",
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
    preview: ["326 clients actifs", "48 nouveaux ce mois"],
  },
  {
    label: "Commissions",
    description: "Suivi de vos gains et paiements",
    href: "/concierge/commissions",
    icon: CreditCard,
    color: "from-amber-500/10 to-amber-600/5",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    preview: ["124 000 MAD ce mois", "8 paiements en attente"],
  },
  {
    label: "Statistiques",
    description: "Performances et analyses",
    href: "/concierge/stats",
    icon: BarChart3,
    color: "from-purple-500/10 to-purple-600/5",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
    preview: ["+22% de listes vs mois dernier", "Taux de conversion: 68%"],
  },
  {
    label: "Messages",
    description: "Conversations avec les établissements",
    href: "/concierge/messages",
    icon: MessageSquare,
    color: "from-indigo-500/10 to-indigo-600/5",
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    preview: ["3 messages non lus", "Le Comptoir — Confirmation VIP"],
  },
  {
    label: "Établissements",
    description: "Vos partenaires et lieux affiliés",
    href: "/concierge/venues",
    icon: Building2,
    color: "from-sky-500/10 to-sky-600/5",
    iconColor: "text-sky-500",
    iconBg: "bg-sky-500/10",
    preview: ["4 établissements actifs", "Le Comptoir, Sky Bar, Le Lotus..."],
  },
];

const DEMO_STATS = [
  {
    label: "Listes cette semaine",
    value: "18",
    icon: Ticket,
    trend: "+5",
  },
  {
    label: "Entrées confirmées",
    value: "142",
    icon: Users,
    trend: "+22%",
  },
  {
    label: "Événements à venir",
    value: "12",
    icon: CalendarDays,
    trend: null,
  },
  {
    label: "Gains du mois",
    value: "124K MAD",
    icon: TrendingUp,
    trend: "+18%",
  },
];

export default function ConciergePage() {
  const { isDemoConcierge, isLoading, fullName } = useAuthUser();

  if (isLoading) return <ConciergeSkeleton />;

  const stats = isDemoConcierge ? DEMO_STATS : [];

  return (
    <div className="px-6 py-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-3xl font-extrabold">
          Bonjour, {fullName || "Concierge"}.
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Votre espace concierge en un coup d&apos;œil.
        </p>
      </div>

      {/* Quick Stats */}
      {isDemoConcierge && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-5 editorial-shadow border border-outline-variant/10"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      className="text-primary"
                    />
                  </div>
                  {stat.trend && (
                    <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold font-[family-name:var(--font-manrope)] text-on-background">
                  {stat.value}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Section Folders */}
      <div className="mb-6">
        <h2 className="text-primary-dark font-[family-name:var(--font-manrope)] text-lg font-bold mb-1">
          Vos espaces
        </h2>
        <p className="text-on-surface-variant text-sm">
          Cliquez sur un espace pour y accéder.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map((folder) => {
          const Icon = folder.icon;
          return (
            <Link
              key={folder.href}
              href={folder.href}
              className="group relative bg-white rounded-2xl p-5 editorial-shadow border border-outline-variant/10 hover:border-outline-variant/25 hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Gradient background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${folder.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              <div className="relative z-10">
                {/* Icon + Arrow */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${folder.iconBg} flex items-center justify-center`}
                  >
                    <Icon
                      size={22}
                      strokeWidth={1.5}
                      className={folder.iconColor}
                    />
                  </div>
                  <ArrowRight
                    size={16}
                    strokeWidth={1.5}
                    className="text-on-surface-variant/0 group-hover:text-on-surface-variant group-hover:translate-x-1 transition-all duration-200"
                  />
                </div>

                {/* Title + Description */}
                <h3 className="font-[family-name:var(--font-manrope)] font-bold text-on-background text-base mb-1">
                  {folder.label}
                </h3>
                <p className="text-xs text-on-surface-variant mb-4">
                  {folder.description}
                </p>

                {/* Preview Lines */}
                {isDemoConcierge && (
                  <div className="space-y-1.5 pt-3 border-t border-outline-variant/15">
                    {folder.preview.map((line, i) => (
                      <p
                        key={i}
                        className="text-[0.6875rem] text-on-surface-variant/80 leading-tight flex items-center gap-1.5"
                      >
                        <span className="w-1 h-1 rounded-full bg-on-surface-variant/30 shrink-0" />
                        {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
