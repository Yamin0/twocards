"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CreditCard,
  Globe,
  Grid3X3,
  HelpCircle,
  Network,
  Plug,
  Settings,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";

/* Tout ce qui n'a pas sa place dans les premiers onglets. Au lancement,
   un établissement vit dans Réservations et Messages ; le reste est là,
   rangé, sans encombrer. C'est aussi l'onglet « Plus » de l'application. */

type Entry = {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  /* Un loueur de quads n'a ni salle ni soirées. */
  restaurantOnly?: boolean;
};

const GROUPS: { title: string; entries: Entry[] }[] = [
  {
    title: "Votre activité",
    entries: [
      {
        icon: Network,
        label: "Réseau apporteurs",
        description: "Quels hôtels et conciergeries vous envoient des clients",
        href: "/dashboard/network",
      },
      {
        icon: CreditCard,
        label: "Commissions",
        description: "Ce que vous reversez, réservation par réservation",
        href: "/dashboard/commissions",
      },
      {
        icon: BarChart3,
        label: "Analyses",
        description: "Volumes, panier moyen, tendances",
        href: "/dashboard/analytics",
      },
      {
        icon: Users,
        label: "Clients",
        description: "Historique et fidélité de vos convives",
        href: "/dashboard/guests",
      },
    ],
  },
  {
    title: "Outils",
    entries: [
      {
        icon: Globe,
        label: "Portail de réservation",
        description: "Votre page de réservation directe, sans commission",
        href: "/dashboard/portal",
      },
      {
        icon: Ticket,
        label: "Événements",
        description: "Soirées et programmation",
        href: "/dashboard/events",
        restaurantOnly: true,
      },
      {
        icon: Grid3X3,
        label: "Plan de salle",
        description: "Vos tables et leur occupation",
        href: "/dashboard/floor-plan",
        restaurantOnly: true,
      },
      {
        icon: Plug,
        label: "Caisse (POS)",
        description: "Rapprochement automatique des tickets",
        href: "/dashboard/integrations",
        restaurantOnly: true,
      },
    ],
  },
  {
    title: "Compte",
    entries: [
      {
        icon: Settings,
        label: "Paramètres",
        description: "Profil, établissement, sécurité",
        href: "/dashboard/settings",
      },
      {
        icon: Bell,
        label: "Notifications",
        description: "Tout ce qui s'est passé, dans l'ordre",
        href: "/dashboard/notifications",
      },
      {
        icon: HelpCircle,
        label: "Aide",
        description: "Guides et contact",
        href: "/dashboard/help",
      },
    ],
  },
];

export default function PlusPage() {
  const { isActivityVenue } = useAuthUser();

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <h1 className="font-display text-3xl font-light text-white">Plus</h1>
        <p className="font-ui text-sm text-white/60 mt-2">
          Les sections que vous n&apos;ouvrez pas tous les jours.
        </p>
      </div>

      {GROUPS.map((group) => {
        const entries = group.entries.filter(
          (e) => !(e.restaurantOnly && isActivityVenue)
        );
        if (entries.length === 0) return null;
        return (
          <section key={group.title}>
            <h2 className="font-ui mb-3 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
              {group.title}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {entries.map((e) => {
                const Icon = e.icon;
                return (
                  <Link
                    key={e.href}
                    href={e.href}
                    className="group flex items-center gap-4 rounded-2xl border border-white/[0.12] bg-black/45 p-4 backdrop-blur-2xl transition-all hover:bg-white/[0.06] active:scale-[0.99]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Icon size={19} strokeWidth={1.5} className="text-white/80" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{e.label}</p>
                      <p className="font-ui mt-0.5 text-xs text-white/50">
                        {e.description}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      strokeWidth={1.5}
                      className="shrink-0 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-white/70"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
