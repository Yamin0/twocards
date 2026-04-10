"use client";

import { useAuthUser } from "@/hooks/use-auth-user";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import Link from "next/link";
import {
  CalendarDays,
  Ticket,
  Users,
  Grid3X3,
  Network,
  CreditCard,
  MessageSquare,
  BarChart3,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const folders = [
  {
    label: "Réservations",
    description: "Gérer les réservations et les tables",
    href: "/dashboard/reservations",
    icon: CalendarDays,
    color: "from-blue-500/10 to-blue-600/5",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    preview: ["12 réservations ce soir", "3 en attente de confirmation"],
  },
  {
    label: "Événements",
    description: "Planifier et gérer vos soirées",
    href: "/dashboard/events",
    icon: Ticket,
    color: "from-purple-500/10 to-purple-600/5",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-500/10",
    preview: ["Gala de Minuit — Sam. 24 Oct", "187/300 couverts confirmés"],
  },
  {
    label: "Clients",
    description: "Base de données des clients et invités",
    href: "/dashboard/guests",
    icon: Users,
    color: "from-green-500/10 to-green-600/5",
    iconColor: "text-green-500",
    iconBg: "bg-green-500/10",
    preview: ["1 240 clients enregistrés", "38 nouveaux ce mois"],
  },
  {
    label: "Plan de salle",
    description: "Configuration des tables et espaces",
    href: "/dashboard/floor-plan",
    icon: Grid3X3,
    color: "from-pink-500/10 to-pink-600/5",
    iconColor: "text-pink-500",
    iconBg: "bg-pink-500/10",
    preview: ["8 tables VIP disponibles", "14 tables standard"],
  },
  {
    label: "Réseau RP",
    description: "Concierges et partenaires actifs",
    href: "/dashboard/network",
    icon: Network,
    color: "from-sky-500/10 to-sky-600/5",
    iconColor: "text-sky-500",
    iconBg: "bg-sky-500/10",
    preview: ["34 RP actifs", "Top: Karim Bennani — 52 couverts"],
  },
  {
    label: "Commissions",
    description: "Suivi des paiements et commissions",
    href: "/dashboard/commissions",
    icon: CreditCard,
    color: "from-amber-500/10 to-amber-600/5",
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    preview: ["782 000 MAD ce mois", "12 paiements en attente"],
  },
  {
    label: "Messages",
    description: "Conversations avec les RP et clients",
    href: "/dashboard/messages",
    icon: MessageSquare,
    color: "from-indigo-500/10 to-indigo-600/5",
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    preview: ["5 messages non lus", "Samy B. — Table VIP samedi"],
  },
  {
    label: "Analyses",
    description: "Statistiques et performances",
    href: "/dashboard/analytics",
    icon: BarChart3,
    color: "from-teal-500/10 to-teal-600/5",
    iconColor: "text-teal-500",
    iconBg: "bg-teal-500/10",
    preview: ["+18% de couverts vs mois dernier", "Taux de remplissage: 78%"],
  },
];

const DEMO_STATS = [
  {
    label: "Couverts ce soir",
    value: "38",
    icon: Users,
    trend: "+12%",
  },
  {
    label: "Demandes en attente",
    value: "12",
    icon: Clock,
    trend: null,
  },
  {
    label: "RP Actifs",
    value: "34",
    icon: Network,
    trend: "+3",
  },
  {
    label: "Revenu mensuel",
    value: "782K MAD",
    icon: TrendingUp,
    trend: "+18%",
  },
];

export default function DashboardPage() {
  const { isDemoVenue, isLoading, fullName } = useAuthUser();

  if (isLoading) return <DashboardSkeleton />;

  const stats = isDemoVenue ? DEMO_STATS : [];

  return (
    <div className="px-6 py-8">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-primary-dark font-[family-name:var(--font-manrope)] text-3xl font-extrabold">
          Bonjour, {fullName || "Directeur"}.
        </h1>
        <p className="text-on-surface-variant mt-1 text-sm">
          Voici un aperçu de votre établissement.
        </p>
      </div>

      {/* Quick Stats */}
      {isDemoVenue && (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                {isDemoVenue && (
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
