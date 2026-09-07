"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useVenueQrReservations } from "@/hooks/use-venue-qr-reservations";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { StatStrip } from "@/components/shared/stat-strip";
import { StatusBadge } from "@/components/shared/status-badge";
import { MiniBars, weeklySeries } from "@/components/shared/mini-charts";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  CreditCard,
  MessageSquare,
  MoreHorizontal,
  QrCode,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

/* Accueil de l'établissement. Deux lectures d'un même écran : un restaurant
   ou un club parle de service et de couverts ; un loueur de quads ou un
   chauffeur parle de participants et de prestations. Dans les deux cas,
   l'essentiel d'abord — ce qui attend une réponse — et les sections rares
   derrière « Plus ». */

type ServiceRow = {
  id: string;
  name: string;
  duration: string;
  price: string;
  active: boolean;
};

type QuickLink = {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
};

const QUICK_RESTAURANT: QuickLink[] = [
  {
    icon: QrCode,
    label: "Réservations",
    description: "Clients envoyés par les hôtels, montants et avis",
    href: "/dashboard/reservations",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    description: "Échanges avec les concierges et hôtels",
    href: "/dashboard/messages",
  },
  {
    icon: CreditCard,
    label: "Commissions",
    description: "Ce que vous reversez, réservation par réservation",
    href: "/dashboard/commissions",
  },
  {
    icon: MoreHorizontal,
    label: "Plus",
    description: "Événements, plan de salle, caisse, portail, clients",
    href: "/dashboard/plus",
  },
];

const QUICK_ACTIVITY: QuickLink[] = [
  {
    icon: QrCode,
    label: "Réservations",
    description: "Demandes des clients d'hôtels, montants et avis",
    href: "/dashboard/reservations",
  },
  {
    icon: Tags,
    label: "Prestations",
    description: "Ce que vos clients peuvent réserver, visible sur le menu",
    href: "/dashboard/prestations",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    description: "Échanges avec les concierges et hôtels",
    href: "/dashboard/messages",
  },
  {
    icon: MoreHorizontal,
    label: "Plus",
    description: "Réseau, commissions, analyses, portail, clients",
    href: "/dashboard/plus",
  },
];

const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export default function VenueDashboardPage() {
  const { isLoading, fullName, venueName, isActivityVenue } = useAuthUser();
  const { reservations } = useVenueQrReservations();
  const [services, setServices] = useState<ServiceRow[] | null>(null);

  /* Les prestations n'existent que pour une activité ou un service. */
  useEffect(() => {
    if (isLoading || !isActivityVenue) return;
    let cancelled = false;
    createClient()
      .from("venue_services")
      .select("id, name, duration, price, active")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setServices((data as ServiceRow[] | null) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isActivityVenue]);

  if (isLoading || reservations === null) return <DashboardSkeleton />;

  const active = reservations.filter(
    (r) => r.status !== "annulée" && r.status !== "no-show"
  );
  const pendingList = reservations
    .filter((r) => r.status === "en attente")
    .sort(
      (a, b) =>
        a.reservation_date.localeCompare(b.reservation_date) ||
        (a.reservation_time ?? "").localeCompare(b.reservation_time ?? "")
    );
  const pending = pendingList.length;
  const revenue = active.reduce((sum, r) => sum + (r.amount_spent ?? 0), 0);
  const commissions = active.reduce((sum, r) => sum + r.commission, 0);
  const rated = reservations.filter((r) => r.rating !== null);
  const avgRating =
    rated.length > 0
      ? rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length
      : null;
  /* Même définition du volume que les KPI : les annulées n'y figurent pas. */
  const weekly = weeklySeries(active.map((r) => r.created_at));
  const latest = reservations.slice(0, 5);

  /* Le jour même : ce que le manager veut savoir en ouvrant l'app. */
  const todayIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const today = active.filter((r) => r.reservation_date === todayIso);
  const todayPeople = today.reduce((s, r) => s + r.party_size, 0);
  const nextArrival = today
    .filter((r) => r.reservation_time && !r.arrived_at)
    .map((r) => r.reservation_time as string)
    .filter((t) => {
      const [h, m] = t.split(":").map(Number);
      const now = new Date();
      return h * 60 + m >= now.getHours() * 60 + now.getMinutes();
    })
    .sort()[0];

  const people = isActivityVenue ? "participant" : "couvert";
  const stats = [
    { label: "CA apporté par twocards", value: `${revenue.toLocaleString()} MAD` },
    { label: "Commissions reversées", value: `${commissions.toLocaleString()} MAD` },
    {
      label: isActivityVenue ? "Réservations reçues" : "Sorties reçues",
      value: reservations.length,
      hint: pending > 0 ? `dont ${pending} en attente` : undefined,
    },
    {
      label: "Satisfaction",
      value:
        avgRating !== null ? `${avgRating.toFixed(1).replace(".", ",")}/5` : "—",
      hint:
        rated.length > 0
          ? `${rated.length} avis client${rated.length > 1 ? "s" : ""}`
          : "aucun avis pour le moment",
    },
  ];

  const quickLinks = isActivityVenue ? QUICK_ACTIVITY : QUICK_RESTAURANT;
  const activeServices = (services ?? []).filter((s) => s.active);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <h1 className="font-display text-3xl font-light text-white">
          Bienvenue{fullName ? `, ${fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="font-ui text-sm text-white/60 mt-2">
          {venueName ? `${venueName} · ` : ""}vos chiffres réels :{" "}
          {isActivityVenue ? "réservations" : "sorties"} reçues, montants
          saisis, commissions et satisfaction.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.08] pt-4">
          <span className="font-ui inline-flex items-center gap-1.5 text-sm text-white/70">
            <CalendarDays size={14} strokeWidth={1.5} className="text-blue-400" />
            {isActivityVenue ? "Aujourd'hui" : "Ce soir"} :{" "}
            <span className="font-semibold text-white">
              {today.length} réservation{today.length > 1 ? "s" : ""}
            </span>
          </span>
          <span className="font-ui inline-flex items-center gap-1.5 text-sm text-white/70">
            <Users size={14} strokeWidth={1.5} className="text-blue-400" />
            <span className="font-semibold text-white">{todayPeople}</span>
            {people}
            {todayPeople > 1 ? "s" : ""} attendus
          </span>
          {nextArrival && (
            <span className="font-ui text-sm text-white/70">
              Prochaine arrivée :{" "}
              <span className="font-semibold text-white">
                {nextArrival.slice(0, 5)}
              </span>
            </span>
          )}
          <Link
            href="/dashboard/reservations"
            className="font-ui ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Voir les réservations
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* KPI */}
      <StatStrip stats={stats} />

      {/* Ce qui attend une réponse + le rythme */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-lg font-normal text-white">
              En attente de réponse
            </h2>
            {pending > 0 && (
              <span className="font-ui flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-2 text-[11px] font-bold text-black">
                {pending}
              </span>
            )}
          </div>
          <p className="font-ui text-xs text-white/40 mb-4">
            Le client attend votre confirmation par téléphone ou WhatsApp.
          </p>
          {pendingList.length === 0 ? (
            <p className="font-ui text-sm text-white/40 leading-relaxed">
              Rien en attente. Chaque nouvelle demande apparaît ici et vous
              est notifiée sur votre téléphone.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {pendingList.slice(0, 5).map((r) => (
                <li key={r.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-ui text-sm text-white truncate">
                      {r.guest_name}
                      {r.service_name && (
                        <span className="text-blue-300/80"> · {r.service_name}</span>
                      )}
                    </p>
                    <p className="font-ui text-xs text-white/40 mt-0.5 flex items-center gap-1.5">
                      <Clock size={11} strokeWidth={1.5} />
                      {formatDay(r.reservation_date)}
                      {r.reservation_time ? ` · ${r.reservation_time}` : ""}
                      <Users size={11} strokeWidth={1.5} className="ml-1" />
                      {r.party_size}
                    </p>
                  </div>
                  <a
                    href={`tel:${r.guest_phone.replace(/\s/g, "")}`}
                    className="font-ui shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Appeler
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/reservations"
            className="font-ui mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Confirmer ou refuser
            <ArrowRight size={13} strokeWidth={1.5} />
          </Link>
        </div>

        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <h2 className="font-display text-lg font-normal text-white mb-1">
            {isActivityVenue ? "Réservations par semaine" : "Sorties par semaine"}
          </h2>
          <p className="font-ui text-xs text-white/40 mb-5">
            8 dernières semaines
          </p>
          <MiniBars data={weekly} color="bg-purple-400/70" />
        </div>
      </div>

      {/* Prestations : ce que le client voit sur le menu */}
      {isActivityVenue && services !== null && (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-lg font-normal text-white">
              Vos prestations
            </h2>
            <Link
              href="/dashboard/prestations"
              className="font-ui flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Gérer
              <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          </div>
          <p className="font-ui text-xs text-white/40 mb-4">
            {activeServices.length === 0
              ? "Aucune prestation visible : votre fiche n'affiche que son nom."
              : `${activeServices.length} visible${activeServices.length > 1 ? "s" : ""} sur le menu des hôtels partenaires, mise à jour immédiate.`}
          </p>
          {activeServices.length === 0 ? (
            <Link
              href="/dashboard/prestations"
              className="font-ui inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-white/90 transition-colors"
            >
              <Tags size={14} strokeWidth={1.75} />
              Ajouter une prestation
            </Link>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeServices.slice(0, 6).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-ui text-sm font-medium text-white truncate">{s.name}</p>
                    {s.duration && (
                      <p className="font-ui text-xs text-white/40">{s.duration}</p>
                    )}
                  </div>
                  <span className="font-display shrink-0 text-sm text-white tabular-nums">
                    {s.price || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Dernières réservations */}
      {latest.length > 0 && (
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-normal text-white">
              Dernières réservations
            </h2>
            <Link
              href="/dashboard/reservations"
              className="font-ui flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Tout voir
              <ArrowRight size={13} strokeWidth={1.5} />
            </Link>
          </div>
          <ul className="divide-y divide-white/[0.06]">
            {latest.map((r) => (
              <li
                key={r.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-ui text-sm text-white truncate">
                    {r.guest_name}
                    <span className="text-white/40">
                      {" "}· {r.service_name ?? r.category}
                    </span>
                  </p>
                  <p className="font-ui text-xs text-white/40 mt-0.5 flex items-center gap-1.5">
                    <CalendarDays size={11} strokeWidth={1.5} />
                    {new Date(
                      r.reservation_date + "T00:00:00"
                    ).toLocaleDateString("fr-FR")}
                    {r.reservation_time ? ` · ${r.reservation_time}` : ""}
                    <Users size={11} strokeWidth={1.5} className="ml-1" />
                    {r.party_size}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.amount_spent !== null && (
                    <span className="font-display text-sm text-white tabular-nums">
                      {r.amount_spent.toLocaleString()} MAD
                    </span>
                  )}
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Accès rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map((q) => {
          const Icon = q.icon;
          return (
            <Link
              key={q.href}
              href={q.href}
              className="group backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-2xl p-5 hover:bg-white/[0.06] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon size={18} strokeWidth={1.5} className="text-white/70" />
                </div>
                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                  className="text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <h3 className="text-sm font-semibold text-white">
                {q.label}
              </h3>
              <p className="font-ui text-xs text-white/50 mt-0.5">
                {q.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
