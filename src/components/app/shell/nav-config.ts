import {
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Coins,
  CreditCard,
  Globe,
  Grid3X3,
  Hotel,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  MessageSquare,
  Network,
  Plug,
  QrCode,
  Settings,
  Shield,
  Tags,
  Ticket,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Translate } from "@/lib/i18n";

/* Navigation des quatre espaces, décrite une fois. La coque
   (app-shell.tsx) en tire la barre latérale, le menu mobile et la barre
   d'onglets du bas ; aucun layout ne redessine sa navigation. */

export type ShellRole = "etablissement" | "hotel" | "concierge" | "admin";

export type NavItem = {
  icon: LucideIcon;
  label: string;
  /** Libellé court pour la barre d'onglets mobile. */
  short?: string;
  href: string;
  /** Actif seulement sur l'adresse exacte (accueil de l'espace). */
  exact?: boolean;
  /** Entrée portée par un paramètre d'URL (`/admin?vue=comptes`). */
  query?: { key: string; value: string | null };
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
  /** Groupe replié par défaut, ouvert quand l'une de ses pages est active. */
  collapsible?: boolean;
};

export type ShellNav = {
  home: string;
  /** Nom de l'espace, sous le logo. */
  space: string;
  groups: NavGroup[];
  /** Entrées de la barre d'onglets mobile (4 au plus ; « Menu » s'y ajoute). */
  tabs: NavItem[];
  help?: NavItem;
  account: NavItem;
};

export function getShellNav(
  role: ShellRole,
  t: Translate,
  opts: { isActivityVenue?: boolean; isAdmin?: boolean } = {}
): ShellNav {
  const adminLink: NavItem[] =
    opts.isAdmin && role !== "admin"
      ? [{ icon: Shield, label: t("Administration", "Admin"), href: "/admin" }]
      : [];

  if (role === "hotel") {
    const today: NavItem = {
      icon: LayoutDashboard,
      label: t("Aujourd'hui", "Today"),
      href: "/hotel",
      exact: true,
    };
    const rooms: NavItem = {
      icon: QrCode,
      label: t("Chambres & QR", "Rooms & QR"),
      short: t("QR", "QR"),
      href: "/hotel/chambres",
    };
    const reservations: NavItem = {
      icon: CalendarDays,
      label: t("Réservations", "Reservations"),
      short: t("Résas", "Bookings"),
      href: "/hotel/reservations",
    };
    const commissions: NavItem = {
      icon: Coins,
      label: t("Commissions", "Commissions"),
      short: t("Gains", "Earnings"),
      href: "/hotel/commissions",
    };
    const account: NavItem = {
      icon: Settings,
      label: t("Paramètres", "Settings"),
      href: "/hotel/settings",
    };
    return {
      home: "/hotel",
      space: t("Espace hôtel", "Hotel workspace"),
      groups: [
        {
          items: [
            today,
            reservations,
            rooms,
            { icon: MapPin, label: t("Mes adresses", "My places"), href: "/hotel/adresses" },
            { icon: Users, label: t("Clients", "Guests"), href: "/hotel/clients" },
          ],
        },
        {
          title: t("Résultats", "Results"),
          items: [
            commissions,
            { icon: BarChart3, label: t("Analyses", "Analytics"), href: "/hotel/analyses" },
          ],
        },
        { title: t("Compte", "Account"), items: [account, ...adminLink] },
      ],
      tabs: [today, reservations, rooms, commissions],
      help: { icon: LifeBuoy, label: t("Aide", "Help"), href: "/hotel/aide" },
      account,
    };
  }

  if (role === "concierge") {
    /* Le concierge est un apporteur d'affaires : son lien et son QR, les
       réservations qui en sortent, suivies jusqu'à la commission. Toutes
       les entrées ont de vraies données derrière elles ; l'assistant
       (/concierge/ai), pas encore branché, n'est pas au menu. */
    const today: NavItem = {
      icon: LayoutDashboard,
      label: t("Aujourd'hui", "Today"),
      href: "/concierge",
      exact: true,
    };
    const reservations: NavItem = {
      icon: CalendarDays,
      label: t("Réservations", "Reservations"),
      short: t("Résas", "Bookings"),
      href: "/concierge/reservations",
    };
    const messages: NavItem = {
      icon: MessageSquare,
      label: t("Messages", "Messages"),
      href: "/concierge/messages",
    };
    const commissions: NavItem = {
      icon: Coins,
      label: t("Commissions", "Commissions"),
      short: t("Gains", "Earnings"),
      href: "/concierge/commissions",
    };
    const account: NavItem = {
      icon: Settings,
      label: t("Paramètres", "Settings"),
      href: "/concierge/settings",
    };
    return {
      home: "/concierge",
      space: t("Espace concierge", "Concierge workspace"),
      groups: [
        {
          items: [
            today,
            reservations,
            { icon: QrCode, label: t("Liens & QR", "Links & QR"), href: "/concierge/liens" },
            { icon: Users, label: t("Clients", "Guests"), href: "/concierge/clients" },
            messages,
            { icon: Building2, label: t("Établissements", "Venues"), href: "/concierge/venues" },
          ],
        },
        {
          title: t("Résultats", "Results"),
          items: [
            commissions,
            { icon: BarChart3, label: t("Statistiques", "Statistics"), href: "/concierge/stats" },
          ],
        },
        { title: t("Compte", "Account"), items: [account, ...adminLink] },
      ],
      tabs: [today, reservations, messages, commissions],
      account,
    };
  }

  if (role === "admin") {
    const overview: NavItem = {
      icon: LayoutDashboard,
      label: t("Vue d'ensemble", "Overview"),
      short: t("Vue", "Overview"),
      href: "/admin",
      query: { key: "vue", value: null },
    };
    const accounts: NavItem = {
      icon: Users,
      label: t("Comptes", "Accounts"),
      href: "/admin?vue=comptes",
      query: { key: "vue", value: "comptes" },
    };
    const catalog: NavItem = {
      icon: BookOpen,
      label: t("Catalogue", "Catalogue"),
      href: "/admin?vue=catalogue",
      query: { key: "vue", value: "catalogue" },
    };
    const commissions: NavItem = {
      icon: Coins,
      label: t("Commissions", "Commissions"),
      short: t("Comm.", "Comm."),
      href: "/admin?vue=commissions",
      query: { key: "vue", value: "commissions" },
    };
    return {
      home: "/admin",
      space: t("Administration", "Admin console"),
      groups: [
        { items: [overview, accounts, catalog, commissions] },
        {
          title: t("Voir un espace", "Open a workspace"),
          /* Liste des comptes du type, d'où « Voir son espace » ouvre le
             dashboard réel d'un compte (lecture seule). Ouvrir /dashboard
             avec le compte admin ne montrait qu'un espace vide. */
          items: [
            {
              icon: Building2,
              label: t("Établissement", "Venue"),
              href: "/admin?vue=comptes&type=etablissement",
              query: { key: "type", value: "etablissement" },
            },
            {
              icon: Hotel,
              label: t("Hôtel", "Hotel"),
              href: "/admin?vue=comptes&type=hotel",
              query: { key: "type", value: "hotel" },
            },
            {
              icon: UserCheck,
              label: t("Concierge", "Concierge"),
              href: "/admin?vue=comptes&type=concierge",
              query: { key: "type", value: "concierge" },
            },
          ],
        },
      ],
      tabs: [overview, accounts, catalog, commissions],
      account: accounts,
    };
  }

  /* Établissement. Un loueur de quads ou un chauffeur vend des prestations,
     pas des tables : elles prennent la place du plan de salle. */
  const today: NavItem = {
    icon: LayoutDashboard,
    label: t("Aujourd'hui", "Today"),
    href: "/dashboard",
    exact: true,
  };
  const reservations: NavItem = {
    icon: CalendarDays,
    label: t("Réservations", "Reservations"),
    short: t("Résas", "Bookings"),
    href: "/dashboard/reservations",
  };
  const messages: NavItem = {
    icon: MessageSquare,
    label: t("Messages", "Messages"),
    href: "/dashboard/messages",
  };
  const commissions: NavItem = {
    icon: CreditCard,
    label: t("Commissions", "Commissions"),
    short: t("Comm.", "Comm."),
    href: "/dashboard/commissions",
  };
  const portal: NavItem = {
    icon: Globe,
    label: t("Portail de réservation", "Booking portal"),
    href: "/dashboard/portal",
  };
  const guests: NavItem = { icon: Users, label: t("Clients", "Guests"), href: "/dashboard/guests" };
  const account: NavItem = {
    icon: Settings,
    label: t("Paramètres", "Settings"),
    href: "/dashboard/settings",
  };
  const more: NavItem[] = opts.isActivityVenue
    ? [portal, guests]
    : [
        portal,
        guests,
        { icon: Ticket, label: t("Événements", "Events"), href: "/dashboard/events" },
        { icon: Grid3X3, label: t("Plan de salle", "Floor plan"), href: "/dashboard/floor-plan" },
        { icon: Plug, label: t("Caisse (POS)", "Till (POS)"), href: "/dashboard/integrations" },
      ];
  return {
    home: "/dashboard",
    space: opts.isActivityVenue
      ? t("Activités & services", "Activities & services")
      : t("Espace établissement", "Venue workspace"),
    groups: [
      {
        items: [
          today,
          reservations,
          messages,
          ...(opts.isActivityVenue
            ? [{ icon: Tags, label: t("Prestations", "Services"), href: "/dashboard/prestations" }]
            : []),
        ],
      },
      {
        title: t("Résultats", "Results"),
        items: [
          commissions,
          { icon: BarChart3, label: t("Analyses", "Analytics"), href: "/dashboard/analytics" },
          { icon: Network, label: t("Réseau d'apporteurs", "Referral network"), href: "/dashboard/network" },
        ],
      },
      { title: t("Outils", "Tools"), items: more, collapsible: true },
      {
        title: t("Compte", "Account"),
        items: [
          account,
          { icon: Bell, label: t("Notifications", "Notifications"), href: "/dashboard/notifications" },
          ...adminLink,
        ],
      },
    ],
    tabs: [today, reservations, messages, commissions],
    help: { icon: LifeBuoy, label: t("Aide", "Help"), href: "/dashboard/help" },
    account,
  };
}
