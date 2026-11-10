"use client";

import { useEffect, useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { ConciergeSkeleton } from "@/components/shared/loading-skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  displayName,
  initialsOf,
  type Profile,
} from "@/hooks/use-messaging";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  Users,
  CreditCard,
  BarChart3,
  MessageSquare,
  Building2,
  Ticket,
  ArrowRight,
  TrendingUp,
  Search,
  Plus,
  Sparkles,
} from "lucide-react";
import { useT, useIntlLocale } from "@/lib/i18n/client";
import type { Translate } from "@/lib/i18n";

const VENUE_ROLES = ["etablissement", "hotel"];

const getRoleLabels = (t: Translate): Record<string, string> => ({
  etablissement: t("Établissement", "Venue"),
  hotel: t("Hôtel", "Hotel"),
});

const getFolders = (t: Translate) => [
  {
    label: t("Calendrier", "Calendar"),
    description: t("Événements à venir et passés", "Upcoming and past events"),
    href: "/concierge/reservations",
    icon: CalendarDays,
    iconColor: "text-blue-400",
    preview: [t("12 événements cette semaine", "12 events this week"), t("OPENING NIGHT · Jeu. 24", "OPENING NIGHT · Thu 24")],
  },
  {
    label: t("CRM Clients", "Guest CRM"),
    description: t("Base de données et suivi clients", "Guest database and follow-up"),
    href: "/concierge/clients",
    icon: Users,
    iconColor: "text-green-400",
    preview: [t("326 clients actifs", "326 active guests"), t("48 nouveaux ce mois", "48 new this month")],
  },
  {
    label: t("Commissions", "Commissions"),
    description: t("Suivi de vos gains et paiements", "Track your earnings and payouts"),
    href: "/concierge/commissions",
    icon: CreditCard,
    iconColor: "text-amber-400",
    preview: [t("124 000 MAD ce mois", "124,000 MAD this month"), t("8 paiements en attente", "8 payouts pending")],
  },
  {
    label: t("Statistiques", "Stats"),
    description: t("Performances et analyses", "Performance and analytics"),
    href: "/concierge/stats",
    icon: BarChart3,
    iconColor: "text-purple-400",
    preview: [t("+22% de listes vs mois dernier", "+22% lists vs last month"), t("Taux de conversion: 68%", "Conversion rate: 68%")],
  },
  {
    label: t("Messages", "Messages"),
    description: t("Conversations avec les établissements", "Conversations with venues"),
    href: "/concierge/messages",
    icon: MessageSquare,
    iconColor: "text-indigo-400",
    preview: [t("3 messages non lus", "3 unread messages"), t("Le Comptoir · Confirmation VIP", "Le Comptoir · VIP confirmation")],
  },
  {
    label: t("Établissements", "Venues"),
    description: t("Vos partenaires et lieux affiliés", "Your partners and affiliated venues"),
    href: "/concierge/venues",
    icon: Building2,
    iconColor: "text-sky-400",
    preview: [t("4 établissements actifs", "4 active venues"), "Le Comptoir, Sky Bar, Le Lotus..."],
  },
  {
    label: t("Assistant IA", "AI assistant"),
    description: t("Votre assistant intelligent twocards", "Your smart twocards assistant"),
    href: "/concierge/ai",
    icon: Sparkles,
    iconColor: "text-blue-400",
    preview: [t("Créer des réservations par commande", "Create reservations by command"), t("Résumé de soirée automatique", "Automatic night summary")],
  },
];

const getDemoStats = (t: Translate) => [
  {
    label: t("Listes cette semaine", "Lists this week"),
    value: "18",
    icon: Ticket,
    trend: "+5",
    color: "text-blue-400",
  },
  {
    label: t("Entrées confirmées", "Confirmed entries"),
    value: "142",
    icon: Users,
    trend: "+22%",
    color: "text-green-400",
  },
  {
    label: t("Événements à venir", "Upcoming events"),
    value: "12",
    icon: CalendarDays,
    trend: null,
    color: "text-purple-400",
  },
  {
    label: t("Gains du mois", "Earnings this month"),
    value: "124K MAD",
    icon: TrendingUp,
    trend: "+18%",
    color: "text-yellow-400",
  },
];

export default function ConciergePage() {
  const { isDemoConcierge, isLoading, fullName } = useAuthUser();
  const t = useT();
  const intl = useIntlLocale();
  const [query, setQuery] = useState("");
  /* Annuaire réel des établissements (table profiles), tenu à jour en
     direct : chaque nouveau compte apparaît dès sa création, sans
     recharger la page. */
  const [venues, setVenues] = useState<Profile[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("profiles")
      .select("id, full_name, role, venue_name, city")
      .in("role", VENUE_ROLES)
      .order("venue_name", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setVenues((data ?? []) as Profile[]);
      });

    const channel = supabase
      .channel("profiles-directory")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          const p = payload.new as Profile;
          if (!VENUE_ROLES.includes(p.role)) return;
          setVenues((prev) =>
            !prev || prev.some((v) => v.id === p.id)
              ? prev
              : [...prev, p].sort((a, b) =>
                  displayName(a).localeCompare(displayName(b), intl)
                )
          );
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [intl]);

  if (isLoading) return <ConciergeSkeleton />;

  const stats = isDemoConcierge ? getDemoStats(t) : [];
  const folders = getFolders(t);
  const roleLabels = getRoleLabels(t);

  /* La recherche filtre les espaces : c'est la seule chose cherchable ici,
     et le champ ne filtrait rien du tout. */
  const q = query.trim().toLowerCase();
  const visibleFolders = q
    ? folders.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      )
    : folders;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {t("Bonjour", "Hello")}, {fullName || "Concierge"}.
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {t("Votre espace concierge en un coup d'œil", "Your concierge workspace at a glance")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 h-4 w-4" />
              <input
                placeholder={t("Rechercher un espace...", "Search a section...")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-sm text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:outline-none transition-all w-48"
              />
            </div>
            {/* La cloche décorative a disparu : aucune page de notifications
                n'existe côté concierge. « Nouvelle liste » désignait une
                notion absente de l'app — l'action réelle est la réservation. */}
            <Link
              href="/concierge/reservations"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/25 text-white rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
            >
              <Plus size={16} strokeWidth={1.5} />
              <span className="hidden sm:inline">{t("Nouvelle réservation", "New reservation")}</span>
            </Link>
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
                className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-5 transition-all duration-500 hover:scale-[1.02] hover:bg-white/[0.1]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/50 text-xs font-ui">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1 font-ui">
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

      {/* ── Le réseau : tous les établissements référencés ── */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t("Établissements du réseau", "Network venues")}
            </h2>
            <p className="text-white/40 text-sm mt-0.5">
              {venues === null
                ? t("Chargement de l'annuaire…", "Loading directory…")
                : t(
                    `${venues.length} établissement${venues.length > 1 ? "s" : ""} référencé${venues.length > 1 ? "s" : ""}, mis à jour en direct`,
                    `${venues.length} venue${venues.length === 1 ? "" : "s"} listed, updated live`,
                  )}
            </p>
          </div>
        </div>

        {venues !== null && venues.length === 0 && (
          <p className="py-8 text-center text-sm text-white/40">
            {t(
              "Aucun établissement inscrit pour le moment. Ils apparaîtront ici dès la création de leur compte.",
              "No venues have signed up yet. They'll appear here as soon as their account is created.",
            )}
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(venues ?? []).map((v) => (
            <div
              key={v.id}
              className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/5 p-4 transition-colors hover:bg-white/[0.08]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-bold text-white">
                  {initialsOf(v)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {displayName(v)}
                  </p>
                  <p className="truncate text-xs text-white/40">
                    {[roleLabels[v.role] ?? v.role, v.city]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/concierge/reservations?new=1&venue=${encodeURIComponent(displayName(v))}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/25"
                >
                  <CalendarPlus size={13} strokeWidth={2} />
                  {t("Réserver", "Book")}
                </Link>
                <Link
                  href={`/concierge/messages?to=${v.id}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <MessageSquare size={13} strokeWidth={2} />
                  {t("Message", "Message")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {isDemoConcierge && (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("Activité récente", "Recent activity")}
          </h2>
          <div className="space-y-3">
            {[
              { text: t("Réservation confirmée · Famille Tazi, 6 pers. au Comptoir", "Reservation confirmed · Tazi family, party of 6 at Le Comptoir"), time: t("Il y a 12 min", "12 min ago"), color: "bg-green-400" },
              { text: t("Commission versée · 9 820 MAD (Le Comptoir, Mars)", "Commission paid · 9,820 MAD (Le Comptoir, March)"), time: t("Il y a 2h", "2h ago"), color: "bg-amber-400" },
              { text: t("Nouveau client ajouté · Sarah Bennis (VIP)", "New guest added · Sarah Bennis (VIP)"), time: t("Il y a 5h", "5h ago"), color: "bg-blue-400" },
              { text: t("No-show déclaré · Réda F. au Sky Bar", "No-show reported · Réda F. at Sky Bar"), time: t("Hier", "Yesterday"), color: "bg-red-400" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                <div className={`w-2 h-2 rounded-full ${a.color} shrink-0`} />
                <p className="text-sm text-white/60 font-ui flex-1">{a.text}</p>
                <span className="text-xs text-white/25 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Folder Cards */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {t("Vos espaces", "Your sections")}
            </h2>
            <p className="text-white/40 text-sm mt-0.5">{t("Cliquez pour accéder à un espace", "Click to open a section")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleFolders.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-white/40">
              {t(<>Aucun espace ne correspond à « {query} ».</>, <>No section matches “{query}”.</>)}
            </p>
          )}
          {visibleFolders.map((folder) => {
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
                <h3 className="font-semibold text-white text-sm mb-1">
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
