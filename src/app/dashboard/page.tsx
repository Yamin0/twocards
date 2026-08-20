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
  Grid3X3,
  MessageSquare,
  QrCode,
  Ticket,
  Users,
} from "lucide-react";

type UpcomingEvent = {
  id: number;
  title: string;
  event_day: number | null;
  event_month: number | null;
  event_year: number | null;
  time_range: string;
  status: string;
  total_spots: number;
};

const QUICK_LINKS = [
  {
    icon: QrCode,
    label: "Réservations",
    description: "Clients envoyés par les hôtels, montants et avis",
    href: "/dashboard/reservations",
  },
  {
    icon: Ticket,
    label: "Événements",
    description: "Votre programmation, compteurs en temps réel",
    href: "/dashboard/events",
  },
  {
    icon: Grid3X3,
    label: "Plan de salle",
    description: "Vos tables et leurs occupations réelles",
    href: "/dashboard/floor-plan",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    description: "Échanges avec les concierges et hôtels",
    href: "/dashboard/messages",
  },
];

export default function VenueDashboardPage() {
  const { isLoading, fullName, venueName } = useAuthUser();
  const { reservations } = useVenueQrReservations();
  const [nextEvent, setNextEvent] = useState<UpcomingEvent | null | undefined>(
    undefined
  );

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    createClient()
      .from("venue_events")
      .select(
        "id, title, event_day, event_month, event_year, time_range, status, total_spots"
      )
      /* Un brouillon n'est pas un événement annoncé : seuls les statuts
         publiés apparaissent comme « prochain événement ». */
      .in("status", ["Ouvert", "Bientôt complet"])
      .then(({ data }) => {
        if (cancelled) return;
        const upcoming = ((data as UpcomingEvent[] | null) ?? [])
          .filter((e) => e.event_year !== null)
          .map((e) => ({
            e,
            d: new Date(e.event_year!, e.event_month ?? 0, e.event_day ?? 1),
          }))
          .filter(({ d }) => d >= new Date(now.getFullYear(), now.getMonth(), now.getDate()))
          .sort((a, b) => a.d.getTime() - b.d.getTime());
        setNextEvent(upcoming[0]?.e ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading || reservations === null || nextEvent === undefined)
    return <DashboardSkeleton />;

  const active = reservations.filter(
    (r) => r.status !== "annulée" && r.status !== "no-show"
  );
  const pending = reservations.filter((r) => r.status === "en attente").length;
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

  /* Service du jour : ce que le manager veut savoir en ouvrant l'app. */
  const todayIso = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const tonight = active.filter((r) => r.reservation_date === todayIso);
  const tonightCovers = tonight.reduce((s, r) => s + r.party_size, 0);
  const nextArrival = tonight
    .filter((r) => r.reservation_time && !r.arrived_at)
    .map((r) => r.reservation_time as string)
    .filter((t) => {
      const [h, m] = t.split(":").map(Number);
      const now = new Date();
      return h * 60 + m >= now.getHours() * 60 + now.getMinutes();
    })
    .sort()[0];

  const stats = [
    { label: "CA apporté par twocards", value: `${revenue.toLocaleString()} MAD` },
    { label: "Commissions reversées", value: `${commissions.toLocaleString()} MAD` },
    {
      label: "Sorties reçues",
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

  const eventDate =
    nextEvent && nextEvent.event_year !== null
      ? new Date(
          nextEvent.event_year,
          nextEvent.event_month ?? 0,
          nextEvent.event_day ?? 1
        ).toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
        <h1 className="font-display text-3xl font-light text-white">
          Bienvenue{fullName ? `, ${fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="font-ui text-sm text-white/60 mt-2">
          {venueName ? `${venueName} — ` : ""}vos chiffres réels : sorties
          reçues, montants saisis, commissions et satisfaction.
        </p>
        {/* Service du jour, en une ligne : couverts attendus, prochaine arrivée */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.08] pt-4">
          <span className="font-ui inline-flex items-center gap-1.5 text-sm text-white/70">
            <CalendarDays size={14} strokeWidth={1.5} className="text-blue-400" />
            Ce soir :{" "}
            <span className="font-semibold text-white">
              {tonight.length} réservation{tonight.length > 1 ? "s" : ""}
            </span>
          </span>
          <span className="font-ui inline-flex items-center gap-1.5 text-sm text-white/70">
            <Users size={14} strokeWidth={1.5} className="text-blue-400" />
            <span className="font-semibold text-white">{tonightCovers}</span>
            couvert{tonightCovers > 1 ? "s" : ""} attendus
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
            href="/dashboard/floor-plan"
            className="font-ui ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Voir le plan de salle
            <ArrowRight size={12} strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* KPI */}
      <StatStrip stats={stats} />

      {/* Demande + prochain événement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6">
          <h2 className="font-display text-lg font-normal text-white mb-1">
            Sorties par semaine
          </h2>
          <p className="font-ui text-xs text-white/40 mb-5">
            8 dernières semaines
          </p>
          <MiniBars data={weekly} color="bg-purple-400/70" />
        </div>

        <div className="backdrop-blur-2xl bg-black/45 border border-white/[0.12] rounded-3xl p-6 flex flex-col">
          <h2 className="font-display text-lg font-normal text-white mb-4">
            Prochain événement
          </h2>
          {nextEvent ? (
            <>
              <p className="font-display text-2xl font-light text-white">
                {nextEvent.title}
              </p>
              <p className="font-ui text-sm text-white/50 mt-1 capitalize">
                {eventDate}
                {nextEvent.time_range ? ` · ${nextEvent.time_range}` : ""}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <StatusBadge
                  status={nextEvent.status === "Ouvert" ? "confirmée" : "en attente"}
                />
                <span className="font-ui text-xs text-white/40">
                  {nextEvent.status}
                  {nextEvent.total_spots > 0
                    ? ` · ${nextEvent.total_spots} places`
                    : ""}
                </span>
              </div>
              <Link
                href="/dashboard/events"
                className="font-ui mt-auto pt-5 inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Gérer mes événements
                <ArrowRight size={13} strokeWidth={1.5} />
              </Link>
            </>
          ) : (
            <>
              <p className="font-ui text-sm text-white/40 leading-relaxed">
                Aucun événement à venir. Créez votre prochaine soirée — ses
                réservations et son chiffre d&apos;affaires se suivront ici.
              </p>
              <Link
                href="/dashboard/events"
                className="font-ui mt-auto pt-5 inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
              >
                Créer un événement
                <ArrowRight size={13} strokeWidth={1.5} />
              </Link>
            </>
          )}
        </div>
      </div>

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
                    <span className="text-white/40"> · {r.category}</span>
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
        {QUICK_LINKS.map((q) => {
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
