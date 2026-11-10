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
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

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

const getGroups = (t: Translate): { title: string; entries: Entry[] }[] => [
  {
    title: t("Votre activité", "Your business"),
    entries: [
      {
        icon: Network,
        label: t("Réseau apporteurs", "Referral network"),
        description: t("Quels hôtels et conciergeries vous envoient des clients", "Which hotels and concierge desks send you guests"),
        href: "/dashboard/network",
      },
      {
        icon: CreditCard,
        label: t("Commissions", "Commissions"),
        description: t("Ce que vous reversez, réservation par réservation", "What you pay out, reservation by reservation"),
        href: "/dashboard/commissions",
      },
      {
        icon: BarChart3,
        label: t("Analyses", "Analytics"),
        description: t("Volumes, panier moyen, tendances", "Volumes, average spend, trends"),
        href: "/dashboard/analytics",
      },
      {
        icon: Users,
        label: t("Clients", "Guests"),
        description: t("Historique et fidélité de vos convives", "Your guests' history and loyalty"),
        href: "/dashboard/guests",
      },
    ],
  },
  {
    title: t("Outils", "Tools"),
    entries: [
      {
        icon: Globe,
        label: t("Portail de réservation", "Booking portal"),
        description: t("Votre page de réservation directe, sans commission", "Your direct booking page, commission-free"),
        href: "/dashboard/portal",
      },
      {
        icon: Ticket,
        label: t("Événements", "Events"),
        description: t("Soirées et programmation", "Nights and line-up"),
        href: "/dashboard/events",
        restaurantOnly: true,
      },
      {
        icon: Grid3X3,
        label: t("Plan de salle", "Floor plan"),
        description: t("Vos tables et leur occupation", "Your tables and their occupancy"),
        href: "/dashboard/floor-plan",
        restaurantOnly: true,
      },
      {
        icon: Plug,
        label: t("Caisse (POS)", "Point of sale (POS)"),
        description: t("Rapprochement automatique des tickets", "Automatic ticket matching"),
        href: "/dashboard/integrations",
        restaurantOnly: true,
      },
    ],
  },
  {
    title: t("Compte", "Account"),
    entries: [
      {
        icon: Settings,
        label: t("Paramètres", "Settings"),
        description: t("Profil, établissement, sécurité", "Profile, venue, security"),
        href: "/dashboard/settings",
      },
      {
        icon: Bell,
        label: t("Notifications", "Notifications"),
        description: t("Tout ce qui s'est passé, dans l'ordre", "Everything that happened, in order"),
        href: "/dashboard/notifications",
      },
      {
        icon: HelpCircle,
        label: t("Aide", "Help"),
        description: t("Guides et contact", "Guides and contact"),
        href: "/dashboard/help",
      },
    ],
  },
];

export default function PlusPage() {
  const { isActivityVenue } = useAuthUser();
  const t = useT();
  const GROUPS = getGroups(t);

  return (
    <div className="space-y-6">
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <h1 className="font-display text-3xl font-light text-white">{t("Plus", "More")}</h1>
        <p className="font-ui text-sm text-white/60 mt-2">
          {t(
            <>Les sections que vous n&apos;ouvrez pas tous les jours.</>,
            <>The sections you don&apos;t open every day.</>
          )}
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
