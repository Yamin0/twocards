"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  Grid3X3,
  LifeBuoy,
  Network,
  Plug,
  Settings,
  Tags,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { PageHeader, cardClass } from "@/components/app/ui";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

/* Tout ce qui n'a pas sa place dans les premiers onglets. Au quotidien,
   un établissement vit dans Réservations et Messages ; le reste est là,
   rangé. C'est aussi l'onglet « Plus » de l'application. */

type Entry = {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  /** Salle, soirées, caisse : un loueur de quads n'en a pas. */
  restaurantOnly?: boolean;
  /** Prestations : activités et services seulement. */
  activityOnly?: boolean;
};

const getGroups = (t: Translate): { title: string; entries: Entry[] }[] => [
  {
    title: t("Votre activité", "Your business"),
    entries: [
      {
        icon: Network,
        label: t("Réseau d'apporteurs", "Referral network"),
        description: t("Qui vous envoie des clients", "Who sends you guests"),
        href: "/dashboard/network",
      },
      {
        icon: CreditCard,
        label: t("Commissions", "Commissions"),
        description: t("Ce que vous reversez", "What you pay out"),
        href: "/dashboard/commissions",
      },
      {
        icon: BarChart3,
        label: t("Analyses", "Analytics"),
        description: t("Volumes, panier moyen, canaux", "Volumes, average spend, channels"),
        href: "/dashboard/analytics",
      },
      {
        icon: Users,
        label: t("Clients", "Guests"),
        description: t("Visites, dépenses et avis", "Visits, spend and reviews"),
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
        description: t("Votre page directe, sans commission", "Your direct page, commission-free"),
        href: "/dashboard/portal",
      },
      {
        icon: Tags,
        label: t("Prestations", "Services"),
        description: t("Ce que vos clients peuvent réserver", "What your guests can book"),
        href: "/dashboard/prestations",
        activityOnly: true,
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
        label: t("Caisse (POS)", "Till (POS)"),
        description: t("Additions rapprochées automatiquement", "Bills matched automatically"),
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
        description: t("Réservations, avis, caisse", "Reservations, reviews, till"),
        href: "/dashboard/notifications",
      },
      {
        icon: LifeBuoy,
        label: t("Aide", "Help"),
        description: t("Réponses et contact", "Answers and contact"),
        href: "/dashboard/help",
      },
    ],
  },
];

export default function PlusPage() {
  const { isActivityVenue } = useAuthUser();
  const t = useT();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Plus", "More")}
        description={t(
          "Les sections que vous n'ouvrez pas tous les jours.",
          "The sections you don't open every day."
        )}
      />

      {getGroups(t).map((group) => {
        const entries = group.entries.filter(
          (e) => !(e.restaurantOnly && isActivityVenue) && !(e.activityOnly && !isActivityVenue)
        );
        if (entries.length === 0) return null;
        return (
          <section key={group.title} className="space-y-3">
            <h2 className="px-1 text-[13px] font-bold text-ink-3">{group.title}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {entries.map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  className={cn(
                    cardClass,
                    "group flex items-center gap-4 p-4 transition-colors hover:border-line-2 hover:bg-fill"
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-fill-2">
                    <e.icon size={19} strokeWidth={1.75} className="text-ink" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink">{e.label}</span>
                    <span className="mt-0.5 block text-[13px] text-ink-3">{e.description}</span>
                  </span>
                  <ChevronRight
                    size={16}
                    strokeWidth={2}
                    aria-hidden
                    className="shrink-0 text-ink-4 transition-colors group-hover:text-ink-2"
                  />
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
